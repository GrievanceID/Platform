'use strict';

const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const config = require('../config');

const router = Router();

const auth_limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});

router.use(auth_limiter);

// ---------------------------------------------------------------------------
// POST /auth/register — citizen self-registration only (Section 10, spec)
// ---------------------------------------------------------------------------
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const email_lower = email.trim().toLowerCase();

    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email_lower]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (role, institution_id, email, password_hash)
       VALUES ('citizen', NULL, $1, $2)
       RETURNING id, role, email, created_at`,
      [email_lower, password_hash]
    );

    const user = rows[0];
    const token = sign_token(user);

    return res.status(201).json({ token, user: public_user(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, role, institution_id, email, password_hash FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    const user = rows[0];
    const valid = user && (await bcrypt.compare(password, user.password_hash));

    if (!valid) {
      // Identical response for both "user not found" and "wrong password" to avoid enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = sign_token(user);

    return res.status(200).json({ token, user: public_user(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/logout
// JWTs are stateless; logout is client-side token discard.
// This endpoint exists so the frontend has a consistent lifecycle hook and
// so we can wire server-side revocation (e.g. token blocklist) later without
// a frontend change.
// ---------------------------------------------------------------------------
router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out' });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sign_token(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      institution_id: user.institution_id ?? null,
    },
    config.jwt_secret,
    { expiresIn: config.jwt_expires_in }
  );
}

function public_user(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

module.exports = router;
