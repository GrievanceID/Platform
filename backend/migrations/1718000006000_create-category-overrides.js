/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('category_overrides', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    grievance_id: {
      type: 'uuid',
      notNull: true,
      references: '"grievances"',
      onDelete: 'CASCADE',
    },
    requested_by: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },
    old_category: { type: 'institution_category', notNull: true },
    new_category: { type: 'institution_category', notNull: true },
    reason: { type: 'text', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('category_overrides', 'grievance_id');
};

exports.down = (pgm) => {
  pgm.dropTable('category_overrides');
};
