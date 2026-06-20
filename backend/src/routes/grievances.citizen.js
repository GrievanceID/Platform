'use strict';

const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db/pool');
const { authenticate, gate_role } = require('../middleware/auth');

const router = Router();

// ---------------------------------------------------------------------------
// Multer — local disk storage only (NFR-1: air-gapped, no cloud storage).
// Files land in /uploads relative to the backend root; the path stored in
// audio_sessions.audio_file_ref is the relative path from that directory.
// Destination and filename are intentionally fixed here, not caller-supplied.
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (_req, file, cb) => {
      const safe_ext = path.extname(file.originalname).replace(/[^.a-z0-9]/gi, '');
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safe_ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB ceiling
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/mp4'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// All citizen grievance routes require an authenticated citizen session.
// gate_role (not require_role) so a non-citizen role skips to the next mounted router.
router.use(authenticate, gate_role('citizen'));

// ---------------------------------------------------------------------------
// POST /grievances
// citizen_id ← req.user.id (token). Never from body.
// Creates Grievance (status: submitted) + AudioSession stub.
// AudioSession transcript fields are null — ASR pipeline populates them later.
// ---------------------------------------------------------------------------
router.post('/', upload.single('audio'), async (req, res, next) => {
  // Considered: should we accept citizen_id in the body so the frontend can
  // specify it? No. The entire point of server-side scoping is that citizen_id
  // is always req.user.id. Even if a malicious client sends citizen_id in the
  // body we never read it.
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required (field name: audio)' });
  }

  const citizen_id = req.user.id; // ← always from token, never from body
  const audio_file_ref = req.file.filename;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: grievance_rows } = await client.query(
      `INSERT INTO grievances (citizen_id, status)
       VALUES ($1, 'submitted')
       RETURNING id, citizen_id, status, institution_id, related_grievance_id,
                 flag_reason, created_at`,
      [citizen_id]
    );
    const grievance = grievance_rows[0];

    const { rows: session_rows } = await client.query(
      `INSERT INTO audio_sessions (grievance_id, audio_file_ref)
       VALUES ($1, $2)
       RETURNING id, grievance_id, audio_file_ref, created_at`,
      [grievance.id, audio_file_ref]
    );
    const audio_session = session_rows[0];

    await client.query('COMMIT');
    return res.status(201).json({ grievance, audio_session });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// GET /grievances/mine
// Scoped to req.user.id. No citizen_id query param is accepted or read —
// the WHERE clause is parameterised on the token value only.
// ---------------------------------------------------------------------------
router.get('/mine', async (req, res, next) => {
  // Considered: should we allow ?citizen_id= for convenience? No — that is
  // exactly the client-controlled scoping vulnerability described in Section 8.
  const citizen_id = req.user.id; // ← token only

  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.status, g.institution_id, g.related_grievance_id,
              g.flag_reason, g.created_at,
              cf.category, cf.urgency, cf.confidence_score
       FROM grievances g
       LEFT JOIN case_files cf ON cf.grievance_id = g.id
       WHERE g.citizen_id = $1
       ORDER BY g.created_at DESC`,
      [citizen_id]
    );
    return res.json({ grievances: rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /grievances/:id  (citizen view)
// Returns 404 — not 403 — when the grievance exists but belongs to someone
// else. This prevents leaking the existence of grievances to non-owners.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  const citizen_id = req.user.id; // ← token only
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.status, g.institution_id, g.related_grievance_id,
              g.flag_reason, g.created_at,
              s.audio_file_ref, s.raw_transcript, s.diarized_transcript,
              s.speaker_segments,
              cf.category, cf.urgency, cf.summary, cf.confidence_score
       FROM grievances g
       LEFT JOIN audio_sessions s ON s.grievance_id = g.id
       LEFT JOIN case_files cf ON cf.grievance_id = g.id
       WHERE g.id = $1
         AND g.citizen_id = $2`,
      [id, citizen_id]
    );

    // citizen_id in the WHERE clause means a row belonging to another citizen
    // produces zero rows — indistinguishable from a non-existent grievance.
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    // Fetch citizen-visible notes only — internal notes are filtered server-side
    // and never present in this response, even as an empty field.
    // This query is safe to run even if grievance_notes.is_citizen_visible doesn't
    // exist yet (migration 002 must be applied first).
    const { rows: note_rows } = await pool.query(
      `SELECT id, text, created_at
       FROM grievance_notes
       WHERE grievance_id = $1
         AND is_citizen_visible = TRUE
       ORDER BY created_at ASC`,
      [id]
    );

    return res.json({ grievance: rows[0], notes: note_rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /grievances/:id/followup
// Creates a new Grievance linked via related_grievance_id.
// Verifies the original grievance belongs to this citizen before proceeding —
// same 404-not-403 pattern to avoid leaking existence.
// The new grievance's citizen_id is req.user.id from the token, never from body.
// ---------------------------------------------------------------------------
router.post('/:id/followup', upload.single('audio'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required (field name: audio)' });
  }

  const citizen_id = req.user.id; // ← token only
  const { id: parent_id } = req.params;
  const audio_file_ref = req.file.filename;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ownership check — returns nothing if the grievance exists but belongs to
    // a different citizen, yielding the same 404 as a missing grievance.
    const { rows: parent_rows } = await client.query(
      'SELECT id FROM grievances WHERE id = $1 AND citizen_id = $2',
      [parent_id, citizen_id]
    );
    if (parent_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    // New record per FR-10 — never an edit to the parent.
    const { rows: grievance_rows } = await client.query(
      `INSERT INTO grievances (citizen_id, status, related_grievance_id)
       VALUES ($1, 'submitted', $2)
       RETURNING id, citizen_id, status, related_grievance_id, created_at`,
      [citizen_id, parent_id]
    );
    const grievance = grievance_rows[0];

    const { rows: session_rows } = await client.query(
      `INSERT INTO audio_sessions (grievance_id, audio_file_ref)
       VALUES ($1, $2)
       RETURNING id, grievance_id, audio_file_ref, created_at`,
      [grievance.id, audio_file_ref]
    );

    await client.query('COMMIT');
    return res.status(201).json({ grievance, audio_session: session_rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
