'use strict';

const { Router } = require('express');
const pool = require('../db/pool');
const { authenticate, gate_role } = require('../middleware/auth');
const { write_audit } = require('../db/audit');

const router = Router();

// gate_role (not require_role) so a non-reviewer role skips to the next mounted router.
router.use(authenticate, gate_role('reviewer'));

// ---------------------------------------------------------------------------
// Reviewer de-identification contract (FR-5, Section 8):
// Every SELECT in this file explicitly names the columns it returns.
// citizen_id and any citizen PII are NEVER in the SELECT list — they are
// excluded at the query layer, not stripped from a complete object afterward.
// If a future developer adds citizen_id to a SELECT here, that is a security
// regression, not a cosmetic issue.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /grievances?status=pending_review
// Sorted ascending by confidence_score (lowest confidence reviewed first per
// UC-5). Reviewer cannot filter by institution_id or citizen — there is no
// scoping parameter at all; Reviewer sees the full pending queue.
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  // Considered: should we accept ?status= from the client so the Reviewer
  // could query other statuses? The spec says the Reviewer queue is always
  // pending_review. Accepting a status param would let a client enumerate
  // grievances at other lifecycle stages. We hardcode the filter here.
  try {
    const { rows } = await pool.query(
      `SELECT
         g.id,
         g.status,
         g.institution_id,
         g.flag_reason,
         g.created_at,
         cf.id            AS case_file_id,
         cf.category,
         cf.urgency,
         cf.suggested_institution_id,
         cf.summary,
         cf.confidence_score,
         cf.human_review_flag,
         s.raw_transcript,
         s.diarized_transcript,
         s.speaker_segments
       FROM grievances g
       JOIN case_files cf ON cf.grievance_id = g.id
       LEFT JOIN audio_sessions s ON s.grievance_id = g.id
       WHERE g.status = 'pending_review'
       ORDER BY cf.confidence_score ASC NULLS LAST`,
    );
    // Note: citizen_id is absent from every SELECT alias above — not selected,
    // not present in the response object, cannot leak via JSON serialisation.
    return res.json({ grievances: rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /grievances/:id  (reviewer view)
// De-identified: citizen_id, citizen email, and any joined citizen row are
// excluded at the query level. 404 for unknown grievances.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  // Scoping: none. Reviewer can view any individual grievance by ID.
  // De-identification is enforced by the SELECT list — not by post-processing.
  try {
    const { rows } = await pool.query(
      `SELECT
         g.id,
         g.status,
         g.institution_id,
         g.related_grievance_id,
         g.flag_reason,
         g.created_at,
         cf.id            AS case_file_id,
         cf.category,
         cf.urgency,
         cf.suggested_institution_id,
         cf.summary,
         cf.confidence_score,
         cf.human_review_flag,
         s.raw_transcript,
         s.diarized_transcript,
         s.speaker_segments
       FROM grievances g
       LEFT JOIN case_files cf ON cf.grievance_id = g.id
       LEFT JOIN audio_sessions s ON s.grievance_id = g.id
       WHERE g.id = $1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ grievance: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /grievances/:id/approve-routing
// Advances status to 'routed'. Requires pending_review status and a
// suggested_institution_id already set in CaseFile.
// ---------------------------------------------------------------------------
router.post('/:id/approve-routing', async (req, res, next) => {
  const reviewer_id = req.user.id;
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: g_rows } = await client.query(
      `SELECT g.id, g.status, cf.suggested_institution_id
       FROM grievances g
       JOIN case_files cf ON cf.grievance_id = g.id
       WHERE g.id = $1`,
      [id]
    );
    if (g_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const g = g_rows[0];
    if (g.status !== 'pending_review') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Grievance is not pending_review (current: ${g.status})` });
    }
    if (!g.suggested_institution_id) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'No suggested institution to approve — CaseFile is incomplete' });
    }

    const { rows: updated } = await client.query(
      `UPDATE grievances
       SET status = 'routed', institution_id = $2
       WHERE id = $1
       RETURNING id, status, institution_id`,
      [id, g.suggested_institution_id]
    );

    await write_audit(client, {
      actor_id: reviewer_id,
      action: 'reviewer_approve_routing',
      grievance_id: id,
      details: { institution_id: g.suggested_institution_id },
    });

    await client.query('COMMIT');
    return res.json({ grievance: updated[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /grievances/:id/correct-routing
// Reviewer overrides the AI's suggested institution with their own choice.
// body: { institution_id }  ← legitimate destination param, not a scope filter.
// ---------------------------------------------------------------------------
router.post('/:id/correct-routing', async (req, res, next) => {
  const reviewer_id = req.user.id;
  const { id } = req.params;
  const { institution_id } = req.body ?? {};

  if (!institution_id) {
    return res.status(400).json({ error: 'institution_id is required in body' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: g_rows } = await client.query(
      `SELECT g.id, g.status, cf.suggested_institution_id
       FROM grievances g
       LEFT JOIN case_files cf ON cf.grievance_id = g.id
       WHERE g.id = $1`,
      [id]
    );
    if (g_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    if (g_rows[0].status !== 'pending_review') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Grievance is not pending_review (current: ${g_rows[0].status})` });
    }

    const { rows: inst_rows } = await client.query(
      'SELECT id FROM institutions WHERE id = $1',
      [institution_id]
    );
    if (inst_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'institution_id does not match any known institution' });
    }

    const { rows: updated } = await client.query(
      `UPDATE grievances
       SET status = 'routed', institution_id = $2
       WHERE id = $1
       RETURNING id, status, institution_id`,
      [id, institution_id]
    );

    await write_audit(client, {
      actor_id: reviewer_id,
      action: 'reviewer_correct_routing',
      grievance_id: id,
      details: {
        ai_suggested_institution_id: g_rows[0].suggested_institution_id ?? null,
        reviewer_chosen_institution_id: institution_id,
      },
    });

    await client.query('COMMIT');
    return res.json({ grievance: updated[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /grievances/:id/reject
// Sends the grievance back to 'categorized' for reprocessing.
// body: { rejection_reason (required, free text), flag_reason (optional enum) }
//
// rejection_reason is stored in audit_log.details — it is per-grievance and
// queryable: SELECT details->>'rejection_reason' FROM audit_log
//   WHERE action = 'reviewer_reject' AND grievance_id = $1
// This is preferable to a separate column on grievances because rejection is
// a Reviewer workflow event, not a permanent property of the grievance record.
// ---------------------------------------------------------------------------
const VALID_FLAG_REASONS = ['low_confidence', 'manual_override', 'other'];

router.post('/:id/reject', async (req, res, next) => {
  const reviewer_id = req.user.id;
  const { id } = req.params;
  const { rejection_reason, flag_reason } = req.body ?? {};

  if (!rejection_reason || typeof rejection_reason !== 'string' || rejection_reason.trim().length === 0) {
    return res.status(400).json({ error: 'rejection_reason is required' });
  }

  const resolved_flag_reason = VALID_FLAG_REASONS.includes(flag_reason)
    ? flag_reason
    : 'manual_override';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: g_rows } = await client.query(
      'SELECT id, status FROM grievances WHERE id = $1',
      [id]
    );
    if (g_rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    if (g_rows[0].status !== 'pending_review') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Grievance is not pending_review (current: ${g_rows[0].status})` });
    }

    const { rows: updated } = await client.query(
      `UPDATE grievances
       SET status = 'categorized', flag_reason = $2
       WHERE id = $1
       RETURNING id, status, flag_reason`,
      [id, resolved_flag_reason]
    );

    // rejection_reason is stored in audit_log.details so it is per-grievance
    // and queryable without adding a nullable column to the grievances table.
    await write_audit(client, {
      actor_id: reviewer_id,
      action: 'reviewer_reject',
      grievance_id: id,
      details: {
        rejection_reason: rejection_reason.trim(),
        flag_reason: resolved_flag_reason,
      },
    });

    await client.query('COMMIT');
    return res.json({ grievance: updated[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
