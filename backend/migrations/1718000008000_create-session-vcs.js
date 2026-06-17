/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('session_vcs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    grievance_id: {
      type: 'uuid',
      notNull: true,
      unique: true, // one session VC per grievance, immutable once issued (FR-6)
      references: '"grievances"',
      onDelete: 'RESTRICT',
    },
    // SHA-256 hash of the final transcript text
    transcript_hash: { type: 'text', notNull: true },
    // JSON array of hashed participant identifiers (citizen, witnesses, etc.)
    participant_id_hashes: { type: 'jsonb', notNull: true },
    // Grievance-side category at time of VC issuance — uses grievance_category
    // (varchar), not institution_category. The VC captures what Mira classified
    // the grievance as, not which institution bucket it was routed into.
    category: { type: 'varchar(64)', notNull: true },
    // JWS/Ed25519 signature over the VC payload (Identity service, later phase)
    signature: { type: 'text', notNull: false },
    issued_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // Constrain to known grievance_category labels via routing_map FK
  pgm.addConstraint(
    'session_vcs',
    'session_vcs_category_fk',
    'FOREIGN KEY (category) REFERENCES routing_map (grievance_category) ON UPDATE CASCADE'
  );

  pgm.addIndex('session_vcs', 'grievance_id');
};

exports.down = (pgm) => {
  pgm.dropTable('session_vcs');
};
