'use strict';

const { Router } = require('express');
const pool = require('../db/pool');
const { authenticate, require_role } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// /issue-reports
//
// POST /issue-reports         — Reviewer or Employee submits a report
// GET  /issue-reports         — Admin lists all reports (open by default)
// PATCH /issue-reports/:id/resolve — Admin marks a report resolved
//
// reporter_id is always taken from req.user.id (token) — never from body.
// reporter_role is always taken from req.user.role (token).
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = ['ai_error', 'bug', 'other'];

const router = Router();
router.use(authenticate);

// ── POST /issue-reports ─────────────────────────────────────────────────────
// Reviewer and Employee only.
router.post('/', require_role('reviewer', 'employee'), async (req, res, next) => {
  const reporter_id = req.user.id;        // ← token only
  const reporter_role = req.user.role;    // ← token only
  const { category, description, grievance_id } = req.body ?? {};

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ error: 'description is required' });
  }

  // If grievance_id was supplied, verify it exists (prevents dangling FK from a
  // client-supplied fake UUID). If not supplied, NULL is inserted (general report).
  const gid = grievance_id ?? null;

  try {
    if (gid) {
      const { rows: g_rows } = await pool.query(
        'SELECT id FROM grievances WHERE id = $1',
        [gid]
      );
      if (g_rows.length === 0) {
        return res.status(400).json({ error: 'grievance_id does not match any known grievance' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO issue_reports
         (reporter_id, reporter_role, grievance_id, category, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, reporter_id, reporter_role, grievance_id, category,
                 description, status, created_at`,
      [reporter_id, reporter_role, gid, category, description.trim()]
    );

    return res.status(201).json({ report: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── GET /issue-reports ──────────────────────────────────────────────────────
// Admin only. Optional ?status=open|resolved filter, default: all.
router.get('/', require_role('admin'), async (req, res, next) => {
  const { status } = req.query;

  const conditions = [];
  const params = [];

  if (status === 'open' || status === 'resolved') {
    params.push(status);
    conditions.push(`ir.status = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT
         ir.id,
         ir.reporter_id,
         ir.reporter_role,
         ir.grievance_id,
         ir.category,
         ir.description,
         ir.status,
         ir.created_at
       FROM issue_reports ir
       ${where}
       ORDER BY ir.created_at DESC`,
      params
    );
    return res.json({ reports: rows });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /issue-reports/:id/resolve ────────────────────────────────────────
// Admin only.
router.patch('/:id/resolve', require_role('admin'), async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `UPDATE issue_reports
       SET status = 'resolved'
       WHERE id = $1
       RETURNING id, status`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    return res.json({ report: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
