'use strict';

const { Router } = require('express');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const config = require('../config');

const router = Router();

// TEMPORARY: replace with DB lookup once sub→user mapping is established.
// Starts empty — the first real eSignet login logs UNMAPPED_ESIGNET_SUB so we
// can add the mapping by hand.
const SUB_TO_USER = {};

// ---------------------------------------------------------------------------
// GET /auth/esignet/callback — eSignet OpenID4VP authorization code callback
// ---------------------------------------------------------------------------
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query ?? {};

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const client_assertion = build_client_assertion();

    const token_res = await fetch(process.env.ESIGNET_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.ESIGNET_REDIRECT_URI,
        client_id: process.env.ESIGNET_CLIENT_ID,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion,
      }),
    });

    if (!token_res.ok) {
      const body = await token_res.text();
      console.error('eSignet token endpoint error:', token_res.status, body);
      return res.status(502).json({ error: 'identity_provider_error' });
    }

    const token_body = await token_res.json();
    const id_token = token_body.id_token;

    // No signature verification at this stage — comes later.
    const claims = jwt.decode(id_token);
    const sub = claims?.sub;

    if (!sub) {
      return res.status(502).json({ error: 'identity_provider_error' });
    }

    const mapped_user_id = SUB_TO_USER[sub];

    if (!mapped_user_id) {
      console.log(`UNMAPPED_ESIGNET_SUB: ${sub}`);
      return res.status(401).json({ error: 'identity_not_recognized' });
    }

    const { rows } = await pool.query(
      'SELECT id, role, institution_id, email, created_at FROM users WHERE id = $1',
      [mapped_user_id]
    );

    const user = rows[0];
    if (!user) {
      console.log(`UNMAPPED_ESIGNET_SUB: ${sub}`);
      return res.status(401).json({ error: 'identity_not_recognized' });
    }

    const session_token = sign_token(user);

    return res.status(200).json({ token: session_token, user: public_user(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function build_client_assertion() {
  const private_key = fs.readFileSync(process.env.ESIGNET_PRIVATE_KEY_PATH, 'utf8');
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: process.env.ESIGNET_CLIENT_ID,
      sub: process.env.ESIGNET_CLIENT_ID,
      aud: process.env.ESIGNET_TOKEN_ENDPOINT,
      iat: now,
      exp: now + 60,
      jti: crypto.randomUUID(),
    },
    private_key,
    { algorithm: 'RS256' }
  );
}

// Same JWT shape as POST /auth/login (see routes/auth.js).
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
