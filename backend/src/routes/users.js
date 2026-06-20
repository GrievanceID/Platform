'use strict';

const { Router } = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = Router();

// All routes require authentication; no role restriction — any role may read
// their own profile. Authorization scoping: req.user.id from token only.
router.use(authenticate);

// ---------------------------------------------------------------------------
// GET /users/me
// Returns the caller's own profile. citizen_id is always req.user.id from
// the JWT — never a query param or body field.
// Does NOT return password_hash, institution_id, or internal role metadata
// beyond what the frontend already has from the login token.
// ---------------------------------------------------------------------------
router.get('/me', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
