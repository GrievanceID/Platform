'use strict';

const { Router } = require('express');
const multer = require('multer');
const path   = require('path');
const pool   = require('../db/pool');
const { authenticate, require_role } = require('../middleware/auth');

const router = Router();

// All live-session routes require authentication and the employee role.
router.use(authenticate, require_role('employee'));

// ---------------------------------------------------------------------------
// institution_id scoping — same discipline as grievances.employee.js:
// institution_id is ALWAYS taken from req.user.institution_id (the signed JWT).
// No route in this file reads institution_id from req.query, req.body, or
// req.params for scoping purposes. See Section 8, CLAUDE.md.
// created_by is ALWAYS taken from req.user.id (the signed JWT).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Multer — identical setup to grievances.citizen.js: local disk only,
// no cloud storage (NFR-1: air-gapped). Files land in /uploads; filename is
// generated server-side and never derived from client input.
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (_req, file, cb) => {
      const safe_ext = path.extname(file.originalname).replace(/[^.a-z0-9]/gi, '');
      cb(null, `ls-${Date.now()}-${Math.random().toString(36).slice(2)}${safe_ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB — live sessions can be long
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/mp4'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ---------------------------------------------------------------------------
// GET /live-sessions
// Returns all sessions for req.user.institution_id, newest first.
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only

  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         title,
         status,
         started_at,
         ended_at,
         duration_seconds,
         created_at
       FROM live_sessions
       WHERE institution_id = $1
       ORDER BY created_at DESC`,
      [institution_id]
    );
    return res.json({ sessions: rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /live-sessions/:id
// Returns one session. 404 if it doesn't belong to the employee's institution.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         title,
         status,
         started_at,
         ended_at,
         duration_seconds,
         audio_file_path,
         transcript,
         ai_summary,
         ai_category,
         created_at
       FROM live_sessions
       WHERE id = $1
         AND institution_id = $2`,
      [id, institution_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ session: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /live-sessions
// Creates a session record. Accepts multipart/form-data so the audio blob can
// be included in the same request as the metadata fields.
//
// Form fields:
//   title?           — optional session label
//   started_at       — ISO 8601 timestamp
//   ended_at         — ISO 8601 timestamp
//   duration_seconds — non-negative integer (sent as string in multipart; coerced)
//   audio            — audio file (optional; multer field name "audio")
//
// institution_id ← req.user.institution_id  (token — never client body)
// created_by     ← req.user.id              (token — never client body)
// status is set to 'pending_processing' — session ended, ASR not yet run.
// ---------------------------------------------------------------------------
router.post('/', upload.single('audio'), async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only
  const created_by     = req.user.id;             // ← token only

  const { title, started_at, ended_at, duration_seconds } = req.body ?? {};

  if (!started_at || !ended_at) {
    return res.status(400).json({ error: 'started_at and ended_at are required' });
  }

  const duration_num = Number(duration_seconds);
  if (!Number.isFinite(duration_num) || duration_num < 0) {
    return res.status(400).json({ error: 'duration_seconds must be a non-negative number' });
  }

  const audio_file_path = req.file ? req.file.filename : null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO live_sessions
         (institution_id, created_by, title, status, started_at, ended_at,
          duration_seconds, audio_file_path)
       VALUES ($1, $2, $3, 'pending_processing', $4, $5, $6, $7)
       RETURNING id, title, status, started_at, ended_at, duration_seconds,
                 audio_file_path, created_at`,
      [
        institution_id,
        created_by,
        title?.trim() || null,
        started_at,
        ended_at,
        duration_num,
        audio_file_path,
      ]
    );
    return res.status(201).json({ session: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /live-sessions/:id/audio
// Streams the stored audio file for a session.
// Institution-scoped: the session must belong to req.user.institution_id.
// Uses a DB lookup before serving — we never trust the filename from the client
// and never expose the raw /uploads directory publicly.
// ---------------------------------------------------------------------------
router.get('/:id/audio', async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT audio_file_path
       FROM live_sessions
       WHERE id = $1
         AND institution_id = $2`,
      [id, institution_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const { audio_file_path } = rows[0];
    if (!audio_file_path) {
      return res.status(404).json({ error: 'No audio file for this session' });
    }

    const file_path = path.join(__dirname, '../../uploads', audio_file_path);
    return res.sendFile(file_path, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /live-sessions/:id/audio
// Attaches an audio file to an existing session (two-step upload flow).
// Only employees whose institution owns the session may upload.
// Replaces any previously stored file reference on the record.
// ---------------------------------------------------------------------------
router.post('/:id/audio', upload.single('audio'), async (req, res, next) => {
  const institution_id = req.user.institution_id; // ← token only
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required (field name: audio)' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE live_sessions
       SET audio_file_path = $1
       WHERE id = $2
         AND institution_id = $3
       RETURNING id, audio_file_path`,
      [req.file.filename, id, institution_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ session: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
