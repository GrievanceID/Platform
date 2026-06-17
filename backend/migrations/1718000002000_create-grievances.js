/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createType('grievance_status', [
    'submitted',
    'transcribed',
    'categorized',
    'pending_review',
    'routed',
    'resolved',
  ]);

  pgm.createType('flag_reason', ['low_confidence', 'manual_override', 'other']);

  pgm.createTable('grievances', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    citizen_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },
    status: { type: 'grievance_status', notNull: true, default: 'submitted' },
    // Nullable until the grievance is routed
    institution_id: {
      type: 'uuid',
      references: '"institutions"',
      onDelete: 'RESTRICT',
      notNull: false,
    },
    // Self-reference for follow-ups (FR-10)
    related_grievance_id: {
      type: 'uuid',
      references: '"grievances"',
      onDelete: 'SET NULL',
      notNull: false,
    },
    flag_reason: { type: 'flag_reason', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('grievances', 'citizen_id');
  pgm.addIndex('grievances', 'status');
  pgm.addIndex('grievances', 'institution_id');
  pgm.addIndex('grievances', ['status', 'institution_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('grievances');
  pgm.dropType('grievance_status');
  pgm.dropType('flag_reason');
};
