/* eslint-disable camelcase */

// live_sessions — structured-recording sessions initiated by an employee
// (interrogations, courtroom proceedings, multi-party conversations).
// This is a distinct record type from grievances: the employee is present
// for the whole recording, diarization identifies multiple named speakers,
// and the AI pipeline runs after the fact as a batch step.
//
// Speaker-segment storage (diarized_segments table) is intentionally
// deferred — the session-level record is built first; segment rows will be
// added in a later migration once the ASR/diarization pipeline is wired in.

exports.up = (pgm) => {
  pgm.createType('live_session_status', [
    'recording',          // session actively in progress
    'pending_processing', // ended, not yet sent to ASR/diarization
    'processing',         // ASR/diarization pipeline running
    'pending_review',     // Reviewer queue (same semantics as grievances)
    'routed',             // dispatched to institution after Reviewer approval
    'resolved',           // closed
  ]);

  pgm.createTable('live_sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },

    // Institution scoping — ALWAYS derived server-side from the employee's
    // auth token (Section 8, CLAUDE.md). Never accepted from the client.
    institution_id: {
      type: 'uuid',
      notNull: true,
      references: '"institutions"',
      onDelete: 'RESTRICT',
    },

    // Employee who initiated the recording (from auth token, never client body).
    created_by: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },

    // Free-text label entered by the employee, e.g. "Interview — Case #X".
    // Nullable — employee may leave it blank.
    title: { type: 'text', notNull: false },

    status: {
      type: 'live_session_status',
      notNull: true,
      default: 'pending_processing',
    },

    started_at: { type: 'timestamptz', notNull: true },
    ended_at:   { type: 'timestamptz', notNull: false },

    // Computed and stored on stop — saves repeated subtraction on list queries.
    duration_seconds: { type: 'integer', notNull: false },

    // Populated by ASR integration (future pass — NOT built yet).
    transcript: { type: 'text', notNull: false },

    // Populated by AI categorization (future pass — NOT built yet).
    ai_summary:  { type: 'text', notNull: false },
    ai_category: { type: 'text', notNull: false },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addIndex('live_sessions', 'institution_id');
  pgm.addIndex('live_sessions', 'created_by');
  pgm.addIndex('live_sessions', 'status');
  pgm.addIndex('live_sessions', ['institution_id', 'status']);
};

exports.down = (pgm) => {
  pgm.dropTable('live_sessions');
  pgm.dropType('live_session_status');
};
