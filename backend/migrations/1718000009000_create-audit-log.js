/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('audit_log', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    actor_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },
    action: { type: 'varchar(64)', notNull: true },
    // Nullable — some future actions may not be grievance-scoped (e.g. account deactivation).
    grievance_id: {
      type: 'uuid',
      references: '"grievances"',
      onDelete: 'SET NULL',
      notNull: false,
    },
    // Free-form payload: old/new values, reasons, institution IDs, etc.
    details: { type: 'jsonb', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('audit_log', 'grievance_id');
  pgm.addIndex('audit_log', 'actor_id');
  pgm.addIndex('audit_log', 'action');
  pgm.addIndex('audit_log', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('audit_log');
};
