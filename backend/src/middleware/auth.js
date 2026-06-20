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
 * Sends 403 on mismatch — use this on individual routes within a router.
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

/**
 * Returns middleware for router.use() that skips to the next mounted app router
 * (via next('router')) when the role does not match, instead of sending 403.
 *
 * This is required when multiple role-specific routers are all mounted at the
 * same path (e.g. app.use('/grievances', citizen_router); app.use('/grievances',
 * reviewer_router)). Without this, the citizen router's require_role would send
 * a 403 to a reviewer before Express ever reaches the reviewer router.
 *
 * Usage: router.use(authenticate, gate_role('citizen'))
 */
function gate_role(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next('router'); // skip this entire router; try the next app.use
    }
    next();
  };
}

module.exports = { authenticate, require_role, gate_role };
