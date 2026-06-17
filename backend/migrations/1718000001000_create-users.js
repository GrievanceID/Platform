/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createType('user_role', ['citizen', 'reviewer', 'employee', 'admin']);

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    role: { type: 'user_role', notNull: true },
    // Nullable: only set for role='employee'. Enforced in application logic + CHECK below.
    institution_id: {
      type: 'uuid',
      references: '"institutions"',
      onDelete: 'RESTRICT',
      notNull: false,
    },
    email: { type: 'text', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // institution_id must be set for employees, must be null for all other roles
  pgm.addConstraint(
    'users',
    'users_institution_id_role_check',
    `CHECK (
      (role = 'employee' AND institution_id IS NOT NULL)
      OR
      (role <> 'employee' AND institution_id IS NULL)
    )`
  );

  pgm.addIndex('users', 'email');
  pgm.addIndex('users', 'role');
  pgm.addIndex('users', 'institution_id');
};

exports.down = (pgm) => {
  pgm.dropTable('users');
  pgm.dropType('user_role');
};
