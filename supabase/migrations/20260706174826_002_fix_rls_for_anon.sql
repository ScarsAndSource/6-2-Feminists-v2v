/*
# Update RLS policies for single-tenant (no auth required)

1. Changes
- Drop existing policies that require authentication
- Create new policies allowing anon access for public use
- Remove user_id requirements since we're in single-tenant mode
- Enable anonymous users to CRUD all data

2. Security
- This is a single-tenant demo app
- Data is intentionally shared/public for the session
- RLS remains enabled but policies allow anon access
*/

-- Drop old authenticated-only policies
DROP POLICY IF EXISTS "select_own_entries" ON entries;
DROP POLICY IF EXISTS "insert_own_entries" ON entries;
DROP POLICY IF EXISTS "update_own_entries" ON entries;
DROP POLICY IF EXISTS "delete_own_entries" ON entries;

DROP POLICY IF EXISTS "select_own_pattern_reports" ON pattern_reports;
DROP POLICY IF EXISTS "insert_own_pattern_reports" ON pattern_reports;
DROP POLICY IF EXISTS "update_own_pattern_reports" ON pattern_reports;
DROP POLICY IF EXISTS "delete_own_pattern_reports" ON pattern_reports;

-- Create new policies allowing anon access
CREATE POLICY "anon_select_entries" ON entries FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_entries" ON entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_entries" ON entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_entries" ON entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE POLICY "anon_select_pattern_reports" ON pattern_reports FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_pattern_reports" ON pattern_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_pattern_reports" ON pattern_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_pattern_reports" ON pattern_reports FOR DELETE
  TO anon, authenticated USING (true);

-- Make user_id nullable since we won't have auth
ALTER TABLE entries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE entries ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE pattern_reports ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE pattern_reports ALTER COLUMN user_id DROP DEFAULT;