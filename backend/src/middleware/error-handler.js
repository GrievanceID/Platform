'use strict';

// eslint-disable-next-line no-unused-vars
function error_handler(err, req, res, next) {
  console.error(err);
  const status = err.status ?? 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
}

module.exports = error_handler;
