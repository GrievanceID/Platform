'use strict';

/**
 * Write one row to audit_log inside an already-open transaction client.
 *
 * @param {import('pg').PoolClient} client  - active transaction client
 * @param {object} entry
 * @param {string} entry.actor_id           - req.user.id of the acting user
 * @param {string} entry.action             - short snake_case label, e.g. 'reviewer_approve_routing'
 * @param {string|null} [entry.grievance_id]
 * @param {object|null} [entry.details]     - any extra JSONB payload
 */
async function write_audit(client, { actor_id, action, grievance_id = null, details = null }) {
  await client.query(
    `INSERT INTO audit_log (actor_id, action, grievance_id, details)
     VALUES ($1, $2, $3, $4)`,
    [actor_id, action, grievance_id, details ? JSON.stringify(details) : null]
  );
}

module.exports = { write_audit };
