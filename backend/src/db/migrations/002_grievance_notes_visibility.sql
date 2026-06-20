-- Migration 002: Add is_citizen_visible flag to grievance_notes
--
-- New column: is_citizen_visible BOOLEAN NOT NULL DEFAULT FALSE
--   - FALSE (default): note is internal — visible to Employee/Admin only
--   - TRUE: note is explicitly made citizen-visible by the authoring employee
--
-- Default is FALSE (internal) so existing notes are not accidentally exposed.
-- Employee must opt-in per note to make it citizen-visible; it is never the default.
-- The citizen-facing GET /grievances/:id endpoint filters to is_citizen_visible = TRUE
-- server-side — the frontend never receives internal notes, even in the response shape.
--
-- Run once against the database before deploying the corresponding backend code.

ALTER TABLE grievance_notes
  ADD COLUMN IF NOT EXISTS is_citizen_visible BOOLEAN NOT NULL DEFAULT FALSE;
