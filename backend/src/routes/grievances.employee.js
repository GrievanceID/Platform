'use strict';

const { Router } = require('express');
const pool = require('../db/pool');
const { authenticate, require_role } = require('../middleware/auth');
const { write_audit } = require('../db/audit');

const router = Router();

router.use(authenticate, require_role('employee'));

// ---------------------------------------------------------------------------
// institution_id scoping — critical note (Section 8, CLAUDE.md):
// Every query in this file that filters by institution uses req.user.institution_id
// exclusively. Even if the client sends institution_id as a query param or body
// field, it is NEVER read from req.query, req.body, or req.params for scoping.
// The value never touches the WHERE clause unless it came from req.user.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /grievances
// Returns only grievances routed to req.user.institution_id.
// Considered: should we read ?institution_id from the query string and validate
// it matches the token? No — reading it at all (even to reject mismatches)
// would invite subtle bugs where a future developer accidentally uses the
// param value. We simply never reference req.query.institution_id.
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only, always

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
         cf.human_review_flag
       FROM grievances g
       LEFT JOIN case_files cf ON cf.grievance_id = g.id
       WHERE g.institution_id = $1
       ORDER BY g.created_at DESC`,
      [institution_id]
    );
    return res.json({ grievances: rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /grievances/:id
// 404 if grievance.institution_id !== req.user.institution_id.
// Same approach: institution_id in the WHERE clause means cross-institution
// rows produce zero results — same response as a missing grievance.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only
  const { id } = req.params;

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
         s.audio_file_ref,
         s.raw_transcript,
         s.diarized_transcript,
         s.speaker_segments,
         cf.category,
         cf.urgency,
         cf.summary,
         cf.confidence_score,
         cf.human_review_flag,
         cf.suggested_institution_id
       FROM grievances g
       LEFT JOIN audio_sessions s ON s.grievance_id = g.id
       LEFT JOIN case_files cf ON cf.grievance_id = g.id
       WHERE g.id = $1
         AND g.institution_id = $2`,
      [id, institution_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ grievance: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /grievances/:id/status
// Only allows forward progression within the routed→resolved leg.
// Employees cannot move a grievance backward or into pipeline states.
// ---------------------------------------------------------------------------
const EMPLOYEE_ALLOWED_STATUSES = ['resolved'];

router.patch('/:id/status', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only
  const { id } = req.params;
  const { status } = req.body ?? {};

  if (!EMPLOYEE_ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Employees may set: ${EMPLOYEE_ALLOWED_STATUSES.join(', ')}`,
    });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE grievances
       SET status = $1
       WHERE id = $2 AND institution_id = $3
       RETURNING id, status, institution_id`,
      [status, id, institution_id]
    );
    // Zero rows = either doesn't exist or belongs to another institution — both 404.
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ grievance: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /grievances/:id/notes
// author_id ← req.user.id (token). Never from body.
// ---------------------------------------------------------------------------
router.post('/:id/notes', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token for scoping check
  const author_id = req.user.id;                  // ← token for authorship
  const { id: grievance_id } = req.params;
  const { text } = req.body ?? {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Scope check: grievance must belong to this employee's institution.
    const { rows: g_rows } = await client.query(
      'SELECT id FROM grievances WHERE id = $1 AND institution_id = $2',
      [grievance_id, institution_id]
    );
    if (g_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    const { rows } = await client.query(
      `INSERT INTO grievance_notes (grievance_id, author_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, grievance_id, author_id, text, created_at`,
      [grievance_id, author_id, text.trim()]
    );

    await client.query('COMMIT');
    return res.status(201).json({ note: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /grievances/:id/flag
// Sets flag_reason on the grievance. Scope-checked against institution_id.
// ---------------------------------------------------------------------------
const VALID_FLAG_REASONS = ['low_confidence', 'manual_override', 'other'];

router.post('/:id/flag', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only
  const { id } = req.params;
  const { flag_reason } = req.body ?? {};

  if (!VALID_FLAG_REASONS.includes(flag_reason)) {
    return res.status(400).json({
      error: `flag_reason must be one of: ${VALID_FLAG_REASONS.join(', ')}`,
    });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE grievances
       SET flag_reason = $1
       WHERE id = $2 AND institution_id = $3
       RETURNING id, status, flag_reason`,
      [flag_reason, id, institution_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ grievance: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /grievances/:id/override-category
// Creates a CategoryOverride record (additive only — FR-6).
// Does NOT mutate case_files.category or any SessionVC.
// body: { new_institution_category, reason? }
// The override tracks the institution routing bucket (institution_category),
// not Mira's grievance_category label — consistent with the override table schema.
// ---------------------------------------------------------------------------
const VALID_INSTITUTION_CATEGORIES = [
  'health', 'transport', 'municipality', 'education',
  'justice', 'utilities', 'social_protection',
];

router.post('/:id/override-category', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token for scope check
  const requested_by = req.user.id;               // ← token for authorship
  const { id: grievance_id } = req.params;
  const { new_institution_category, reason } = req.body ?? {};

  if (!VALID_INSTITUTION_CATEGORIES.includes(new_institution_category)) {
    return res.status(400).json({
      error: `new_institution_category must be one of: ${VALID_INSTITUTION_CATEGORIES.join(', ')}`,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Scope + current-category fetch in one query.
    const { rows: g_rows } = await client.query(
      `SELECT g.id, i.category AS current_institution_category
       FROM grievances g
       JOIN institutions i ON i.id = g.institution_id
       WHERE g.id = $1 AND g.institution_id = $2`,
      [grievance_id, institution_id]
    );
    if (g_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    const old_category = g_rows[0].current_institution_category;

    // Additive record only — case_files and session_vcs are untouched (FR-6).
    const { rows } = await client.query(
      `INSERT INTO category_overrides
         (grievance_id, requested_by, old_category, new_category, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, grievance_id, requested_by, old_category, new_category,
                 reason, created_at`,
      [grievance_id, requested_by, old_category, new_institution_category, reason ?? null]
    );

    await write_audit(client, {
      actor_id: requested_by,
      action: 'employee_override_category',
      grievance_id,
      details: { old_category, new_category: new_institution_category, reason: reason ?? null },
    });

    await client.query('COMMIT');
    return res.status(201).json({ override: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
