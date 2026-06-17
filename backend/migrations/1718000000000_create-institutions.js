/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createType('institution_category', [
    'health',
    'transport',
    'municipality',
    'education',
    'justice',
    'utilities',
    'social_protection',
  ]);

  pgm.createTable('institutions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    category: { type: 'institution_category', notNull: true },
    is_default_for_category: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('institutions', 'category');
  pgm.addIndex('institutions', ['category', 'is_default_for_category']);
};

exports.down = (pgm) => {
  pgm.dropTable('institutions');
  pgm.dropType('institution_category');
};
