/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('grievance_notes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    grievance_id: {
      type: 'uuid',
      notNull: true,
      references: '"grievances"',
      onDelete: 'CASCADE',
    },
    author_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },
    text: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('grievance_notes', 'grievance_id');
  pgm.addIndex('grievance_notes', 'author_id');
};

exports.down = (pgm) => {
  pgm.dropTable('grievance_notes');
};
