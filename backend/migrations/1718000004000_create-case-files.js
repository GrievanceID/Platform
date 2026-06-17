/* eslint-disable camelcase */

// grievance_category is stored as varchar + CHECK so Mira's NLP taxonomy can gain
// new labels via a transactional ALTER CONSTRAINT, not the DDL-outside-transaction
// ALTER TYPE ... ADD VALUE that Postgres enums require.
const GRIEVANCE_CATEGORIES = [
  'infrastructure',
  'public_services',
  'health',
  'education',
  'transport',
  'environment',
  'social_protection',
  'justice',
  'utilities',
  'municipality',
  'other',
];

exports.up = (pgm) => {
  pgm.createType('urgency_level', ['low', 'medium', 'high']);

  // ------------------------------------------------------------------
  // routing_map: maps grievance_category → institution_category so that
  // the routing logic is an explicit, data-driven lookup, not a code
  // assumption that the two taxonomies are identical (NFR-6: swappable
  // without redeployment).
  // ------------------------------------------------------------------
  pgm.createTable('routing_map', {
    grievance_category: { type: 'varchar(64)', primaryKey: true },
    institution_category: { type: 'institution_category', notNull: true },
  });

  pgm.addConstraint(
    'routing_map',
    'routing_map_grievance_category_check',
    `CHECK (grievance_category IN (${GRIEVANCE_CATEGORIES.map((c) => `'${c}'`).join(', ')}))`
  );

  // Seed the initial mapping. These defaults can be updated via seed/migration
  // as Mira's taxonomy is refined — no code change needed.
  pgm.sql(`
    INSERT INTO routing_map (grievance_category, institution_category) VALUES
      ('infrastructure',    'municipality'),
      ('public_services',   'municipality'),
      ('health',            'health'),
      ('education',         'education'),
      ('transport',         'transport'),
      ('environment',       'municipality'),
      ('social_protection', 'social_protection'),
      ('justice',           'justice'),
      ('utilities',         'utilities'),
      ('municipality',      'municipality'),
      ('other',             'municipality');
  `);

  pgm.createTable('case_files', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    grievance_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: '"grievances"',
      onDelete: 'CASCADE',
    },
    // Mira's NLP label — grievance-side taxonomy, NOT institution_category
    category: { type: 'varchar(64)', notNull: false },
    urgency: { type: 'urgency_level', notNull: false },
    suggested_institution_id: {
      type: 'uuid',
      references: '"institutions"',
      onDelete: 'SET NULL',
      notNull: false,
    },
    summary: { type: 'text', notNull: false },
    confidence_score: { type: 'numeric(5,4)', notNull: false },
    human_review_flag: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint(
    'case_files',
    'case_files_category_check',
    `CHECK (category IS NULL OR category IN (${GRIEVANCE_CATEGORIES.map((c) => `'${c}'`).join(', ')}))`
  );

  // FK into routing_map so every non-null category has a routing rule
  pgm.addConstraint(
    'case_files',
    'case_files_category_fk',
    'FOREIGN KEY (category) REFERENCES routing_map (grievance_category) ON UPDATE CASCADE'
  );

  pgm.addIndex('case_files', 'grievance_id');
  pgm.addIndex('case_files', 'confidence_score');
  pgm.addIndex('case_files', 'human_review_flag');
};

exports.down = (pgm) => {
  pgm.dropTable('case_files');
  pgm.dropTable('routing_map');
  pgm.dropType('urgency_level');
};
