-- Restore user-scoped RLS (undo the anon-open policy from migration 002)
-- Migration 002 opened both tables to anon read/write/delete with
-- USING (true), as a workaround for the fact that the client never actually
-- called getOrCreateUser() / signInAnonymously(). The real fix is on the
-- client (useAuth now calls getOrCreateUser on mount, so every session gets
-- a genuine anonymous auth.uid()), not relaxed RLS.

-- Remove unattributable rows written while user_id was nullable
DELETE FROM pattern_reports WHERE user_id IS NULL;
DELETE FROM entries WHERE user_id IS NULL;

-- Drop the anon-open policies
DROP POLICY IF EXISTS "anon_select_entries" ON entries;
DROP POLICY IF EXISTS "anon_insert_entries" ON entries;
DROP POLICY IF EXISTS "anon_update_entries" ON entries;
DROP POLICY IF EXISTS "anon_delete_entries" ON entries;

DROP POLICY IF EXISTS "anon_select_pattern_reports" ON pattern_reports;
DROP POLICY IF EXISTS "anon_insert_pattern_reports" ON pattern_reports;
DROP POLICY IF EXISTS "anon_update_pattern_reports" ON pattern_reports;
DROP POLICY IF EXISTS "anon_delete_pattern_reports" ON pattern_reports;

-- Restore NOT NULL + DEFAULT auth.uid()
ALTER TABLE entries ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE entries ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE pattern_reports ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE pattern_reports ALTER COLUMN user_id SET NOT NULL;

-- Restore owner-scoped policies (identical to migration 001)
CREATE POLICY "select_own_entries" ON entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_entries" ON entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_entries" ON entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_entries" ON entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_pattern_reports" ON pattern_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_pattern_reports" ON pattern_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_pattern_reports" ON pattern_reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_pattern_reports" ON pattern_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
