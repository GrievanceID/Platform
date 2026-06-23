/* eslint-disable camelcase */

// Adds audio_file_path to live_sessions so the raw audio file is linked to
// the session record. The column is nullable: sessions created before this
// migration (or in tests that don't upload audio) will have NULL here, which
// the backend treats as "no audio stored yet".

exports.up = (pgm) => {
  pgm.addColumn('live_sessions', {
    audio_file_path: { type: 'text', notNull: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('live_sessions', 'audio_file_path');
};
