/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('audio_sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    grievance_id: {
      type: 'uuid',
      notNull: true,
      unique: true, // one audio session per grievance
      references: '"grievances"',
      onDelete: 'CASCADE',
    },
    // Filesystem path or local storage reference — no cloud URLs per NFR-1/NFR-2
    audio_file_ref: { type: 'text', notNull: true },
    raw_transcript: { type: 'text', notNull: false },
    diarized_transcript: { type: 'text', notNull: false },
    // JSON array of speaker-segmented diarization output from the ASR service
    speaker_segments: { type: 'jsonb', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('audio_sessions', 'grievance_id');
};

exports.down = (pgm) => {
  pgm.dropTable('audio_sessions');
};
