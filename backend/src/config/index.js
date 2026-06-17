'use strict';

require('dotenv').config();

function require_env(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

module.exports = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  node_env: process.env.NODE_ENV ?? 'development',
  database_url: require_env('DATABASE_URL'),
  jwt_secret: require_env('JWT_SECRET'),
  jwt_expires_in: process.env.JWT_EXPIRES_IN ?? '8h',
};
