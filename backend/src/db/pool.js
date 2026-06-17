'use strict';

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({ connectionString: config.database_url });

pool.on('error', (err) => {
  console.error('Unexpected pg pool error', err);
  process.exit(1);
});

module.exports = pool;
