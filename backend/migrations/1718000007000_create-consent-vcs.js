/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('consent_vcs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    citizen_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },
    grievance_id: {
      type: 'uuid',
      notNull: true,
      unique: true, // one consent VC per grievance
      references: '"grievances"',
      onDelete: 'RESTRICT',
    },
    // Full W3C VC JSON payload, stored as JSONB for queryability
    vc_payload: { type: 'jsonb', notNull: true },
    issued_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('consent_vcs', 'citizen_id');
  pgm.addIndex('consent_vcs', 'grievance_id');
};

exports.down = (pgm) => {
  pgm.dropTable('consent_vcs');
};
