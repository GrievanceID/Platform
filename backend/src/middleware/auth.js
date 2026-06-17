'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Verifies the Bearer JWT on the request and attaches the decoded payload
 * to req.user: { id, role, institution_id }.
 * Never trust any scoping that arrives from the client — all scoping is
 * derived here from the signed token (see CLAUDE.md hard constraint).
 */
function authenticate(req, res, next) {
  const auth_header = req.headers['authorization'] ?? '';
  const token = auth_header.startsWith('Bearer ') ? auth_header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt_secret);
    req.user = {
      id: payload.sub,
      role: payload.role,
      institution_id: payload.institution_id ?? null,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Returns middleware that allows only the listed roles through.
 * Usage: router.get('/foo', authenticate, require_role('admin', 'reviewer'), handler)
 */
function require_role(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, require_role };
