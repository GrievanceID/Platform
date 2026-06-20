-- Migration 001: Add self-reported citizen profile fields
--
-- These fields are placed on the users table (not a separate table) because:
--   1. Every Reviewer-facing query in grievances.reviewer.js selects ONLY from
--      grievances, case_files, and audio_sessions — it never JOINs users at all.
--      There is therefore no structural path for these columns to leak to Reviewer
--      regardless of which table they live on.
--   2. A separate citizen_profiles table would add a JOIN to every citizen self-read
--      and add a write-side transaction for every PATCH, with no security benefit
--      given point 1. The protection comes from the SELECT allowlist in users.js and
--      the absence of any users JOIN in reviewer/employee routes — not from physical
--      table separation.
--   3. All columns are nullable. Citizens may leave them blank; the Inji identity
--      layer integration (later phase) will populate verified values through a
--      dedicated pathway, not by mutating these columns.
--
-- Run this against your PostgreSQL database once before deploying the corresponding
-- backend code. Safe to re-run: the IF NOT EXISTS guards prevent duplicate columns.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name    TEXT,
  ADD COLUMN IF NOT EXISTS last_name     TEXT,
  ADD COLUMN IF NOT EXISTS phone_number  TEXT;

-- Partial index: only index rows where phone_number is set, since most rows will
-- be NULL during the placeholder phase. Useful if admin tooling queries by phone.
CREATE INDEX IF NOT EXISTS idx_users_phone_number
  ON users (phone_number)
  WHERE phone_number IS NOT NULL;
