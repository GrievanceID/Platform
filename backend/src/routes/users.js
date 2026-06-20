'use strict';

const { Router } = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = Router();

// All routes require authentication. Authorization scoping: req.user.id from
// token only — never from any client-supplied param or body field.
router.use(authenticate);

// ---------------------------------------------------------------------------
// De-identification contract for this file:
// The SELECT list here is the ONLY place in the codebase that reads citizen
// profile fields (first_name, last_name, phone_number) from the users table.
// Reviewer-facing routes (grievances.reviewer.js) never JOIN users at all —
// they select exclusively from grievances, case_files, and audio_sessions.
// Employee and Admin routes that touch users only do so for account management
// (create/delete employees), and those SELECTs never include citizen PII columns.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /users/me
// Returns the caller's own profile. Explicit column list — never SELECT *.
// Returning first_name/last_name/phone_number here is safe because this route
// is scoped to req.user.id and available to any authenticated role reading
// their own record (not a Reviewer-facing or cross-citizen query).
// ---------------------------------------------------------------------------
router.get('/me', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, role, created_at,
              first_name, last_name, phone_number
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /users/me
// Allows a citizen to update their own self-reported profile fields.
// Only first_name, last_name, phone_number are mutable here — email and role
// are not accepted even if sent (they are simply ignored, never written).
//
// Authorization: scoped to req.user.id from token. A citizen can only ever
// update their own row — the WHERE clause is parameterised on the token value.
//
// Phone validation: basic format check only (not over-engineered — these are
// placeholder/self-reported values, not identity-verified data yet).
// Accepted formats: optional leading +, then 7–15 digits with optional spaces,
// dots, or hyphens between groups. Matches Moroccan (+212) and international
// numbers at the level of precision appropriate for placeholder data.
// ---------------------------------------------------------------------------
const PHONE_RE = /^\+?[\d][\d\s.\-]{5,17}[\d]$/;

router.patch('/me', async (req, res, next) => {
  const { first_name, last_name, phone_number } = req.body ?? {};

  // Collect only the fields that were actually sent and are acceptable.
  const updates = {};

  if (first_name !== undefined) {
    if (typeof first_name !== 'string') {
      return res.status(400).json({ error: 'first_name must be a string' });
    }
    updates.first_name = first_name.trim() || null;
  }

  if (last_name !== undefined) {
    if (typeof last_name !== 'string') {
      return res.status(400).json({ error: 'last_name must be a string' });
    }
    updates.last_name = last_name.trim() || null;
  }

  if (phone_number !== undefined) {
    if (phone_number === null || phone_number === '') {
      updates.phone_number = null;
    } else if (typeof phone_number !== 'string') {
      return res.status(400).json({ error: 'phone_number must be a string' });
    } else {
      const normalised = phone_number.trim();
      if (!PHONE_RE.test(normalised)) {
        return res.status(400).json({ error: 'phone_number format is invalid' });
      }
      updates.phone_number = normalised;
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  // Build SET clause dynamically from validated fields.
  const keys = Object.keys(updates);
  const set_clause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map((k) => updates[k]);
  values.push(req.user.id); // WHERE id = $N — always from token

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET ${set_clause}
       WHERE id = $${values.length}
       RETURNING id, email, role, created_at, first_name, last_name, phone_number`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
