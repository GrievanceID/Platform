'use strict';

const { Router } = require('express');
const pool = require('../db/pool');
const { authenticate, require_role } = require('../middleware/auth');
const { write_audit } = require('../db/audit');

const router = Router();

router.use(authenticate, require_role('admin'));

// ---------------------------------------------------------------------------
// Admin filter params vs. scoping params — important distinction:
// For Employee/Citizen/Reviewer, institution_id and citizen_id coming from
// the client are a vulnerability because they bypass the user's own scope.
// For Admin, ?institution_id= is a legitimate *filter* on cross-institution
// data the Admin is already authorised to see in full. It is not being used
// to grant access — Admin already has full access; the param narrows results.
// This is the only role where a client-supplied institution_id is acceptable.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /grievances
// Cross-institution, filterable by: institution_id, category, status, date range.
// All filters are optional additive WHERE clauses; none of them grant access
// beyond what the admin role already has.
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  const {
    institution_id,
    category,
    status,
    date_from,
    date_to,
  } = req.query;

  const conditions = [];
  const params = [];

  if (institution_id) {
    params.push(institution_id);
    conditions.push(`g.institution_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`g.status = $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`cf.category = $${params.length}`);
  }
  if (date_from) {
    params.push(date_from);
    conditions.push(`g.created_at >= $${params.length}`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`g.created_at <= $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT
         g.id,
         g.citizen_id,
         g.status,
         g.institution_id,
         g.related_grievance_id,
         g.flag_reason,
         g.created_at,
         cf.category,
         cf.urgency,
         cf.confidence_score,
         cf.human_review_flag,
         i.name AS institution_name
       FROM grievances g
       LEFT JOIN case_files cf ON cf.grievance_id = g.id
       LEFT JOIN institutions i ON i.id = g.institution_id
       ${where}
       ORDER BY g.created_at DESC`,
      params
    );
    return res.json({ grievances: rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /grievances/:id/reroute
// Admin reroutes a grievance to a different institution post-routing.
// Action is logged to audit_log (NFR-5) with old/new institution and reason.
// body: { institution_id, reason? }
// ---------------------------------------------------------------------------
router.patch('/:id/reroute', async (req, res, next) => {
  const admin_id = req.user.id;
  const { id: grievance_id } = req.params;
  const { institution_id: new_institution_id, reason } = req.body ?? {};

  if (!new_institution_id) {
    return res.status(400).json({ error: 'institution_id is required in body' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: g_rows } = await client.query(
      'SELECT id, institution_id, status FROM grievances WHERE id = $1',
      [grievance_id]
    );
    if (g_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    const { rows: inst_rows } = await client.query(
      'SELECT id FROM institutions WHERE id = $1',
      [new_institution_id]
    );
    if (inst_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'institution_id does not match any known institution' });
    }

    const old_institution_id = g_rows[0].institution_id;

    const { rows: updated } = await client.query(
      `UPDATE grievances SET institution_id = $1 WHERE id = $2
       RETURNING id, status, institution_id`,
      [new_institution_id, grievance_id]
    );

    await write_audit(client, {
      actor_id: admin_id,
      action: 'admin_reroute',
      grievance_id,
      details: { old_institution_id, new_institution_id, reason: reason ?? null },
    });

    await client.query('COMMIT');
    return res.json({ grievance: updated[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// GET /stats
// Aggregate counts. No per-citizen identity in this response.
// Provides the data Admin needs (Section 3.4) and the research export point
// (confidence distributions, category/institution/status breakdowns).
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res, next) => {
  try {
    const [by_status, by_category, by_institution, confidence_dist] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM grievances GROUP BY status ORDER BY status`
      ),
      pool.query(
        `SELECT cf.category, COUNT(*)::int AS count
         FROM case_files cf GROUP BY cf.category ORDER BY count DESC`
      ),
      pool.query(
        `SELECT i.name AS institution, i.category AS institution_category,
                COUNT(g.id)::int AS total,
                COUNT(g.id) FILTER (WHERE g.status = 'resolved')::int AS resolved
         FROM institutions i
         LEFT JOIN grievances g ON g.institution_id = i.id
         GROUP BY i.id, i.name, i.category
         ORDER BY total DESC`
      ),
      pool.query(
        `SELECT
           ROUND(AVG(confidence_score)::numeric, 4)  AS avg_confidence,
           ROUND(MIN(confidence_score)::numeric, 4)  AS min_confidence,
           ROUND(MAX(confidence_score)::numeric, 4)  AS max_confidence,
           COUNT(*) FILTER (WHERE human_review_flag) ::int AS human_flagged
         FROM case_files`
      ),
    ]);

    return res.json({
      by_status: by_status.rows,
      by_category: by_category.rows,
      by_institution: by_institution.rows,
      confidence: confidence_dist.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// employees_router — mounted at /employees in index.js
// Separated so it can be mounted at the correct path without conflating
// /grievances and /employees under one router instance.
// ---------------------------------------------------------------------------
const employees_router = Router();
employees_router.use(authenticate, require_role('admin'));

// GET /employees — list all users with role='employee', joined to institution name.
// Returns a de-identified list (no password_hash). Admin-only.
employees_router.get('/', async (req, res, next) => {
  const { institution_id } = req.query; // optional filter (Admin sees all; this is a filter, not a scope gate)

  const conditions = [`u.role = 'employee'`];
  const params = [];
  if (institution_id) {
    params.push(institution_id);
    conditions.push(`u.institution_id = $${params.length}`);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.institution_id, u.created_at,
              i.name AS institution_name
       FROM users u
       LEFT JOIN institutions i ON i.id = u.institution_id
       ${where}
       ORDER BY i.name ASC, u.email ASC`,
      params
    );
    return res.json({ employees: rows });
  } catch (err) {
    next(err);
  }
});

// POST /employees — create an employee account.
// Admin sets role='employee' and institution_id. Citizen self-registration
// (POST /auth/register) is the only other user-creation path and is locked
// to role='citizen'. This is the only route that creates non-citizen users.
employees_router.post('/', async (req, res, next) => {
  const bcrypt = require('bcryptjs');
  const { email, password, institution_id } = req.body ?? {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!institution_id) {
    return res.status(400).json({ error: 'institution_id is required for employees' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: inst_rows } = await client.query(
      'SELECT id FROM institutions WHERE id = $1',
      [institution_id]
    );
    if (inst_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'institution_id does not match any known institution' });
    }

    const email_lower = email.trim().toLowerCase();
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email_lower]
    );
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      `INSERT INTO users (role, institution_id, email, password_hash)
       VALUES ('employee', $1, $2, $3)
       RETURNING id, role, institution_id, email, created_at`,
      [institution_id, email_lower, password_hash]
    );

    await client.query('COMMIT');
    return res.status(201).json({ user: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /employees/:id — deactivate an employee account.
// Only allows deletion of users with role='employee' to prevent accidental
// admin/reviewer deletion through this endpoint.
employees_router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `DELETE FROM users WHERE id = $1 AND role = 'employee'
       RETURNING id, email, role`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    return res.json({ deleted: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = { grievances_router: router, employees_router };
