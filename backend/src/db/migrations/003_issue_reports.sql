-- Migration 003: Issue / flag reports submitted by Reviewer and Employee roles.
-- grievance_id is nullable — some reports are general (AI behaviour, platform bugs)
-- and are not tied to a specific case.
CREATE TABLE IF NOT EXISTS issue_reports (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id    UUID        NOT NULL REFERENCES users(id),
  reporter_role  TEXT        NOT NULL CHECK (reporter_role IN ('reviewer', 'employee')),
  grievance_id   UUID        REFERENCES grievances(id) ON DELETE SET NULL,
  category       TEXT        NOT NULL CHECK (category IN ('ai_error', 'bug', 'other')),
  description    TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_reports_status    ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_reporter  ON issue_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_grievance ON issue_reports(grievance_id);
