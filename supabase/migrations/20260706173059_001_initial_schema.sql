/*
# Create symptom tracking tables

1. New Tables
- `entries`: One row per symptom logging event
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user)
  - `tags` (jsonb, array of {tag, severity, note?})
  - `cycle_day` (int, nullable, for menstrual cycle tracking)
  - `created_at` (timestamptz)
- `pattern_reports`: One row per successful case file generation
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null)
  - `computed_stats` (jsonb, statistical aggregates)
  - `narrative` (text, generated summary)
  - `provider` (text, enum: groq/gemini/template)
  - `generated_at` (timestamptz)

2. Security
- Enable RLS on both tables
- Owner-scoped CRUD: authenticated users can only access their own data
- Anonymous auth is supported for zero-friction onboarding
*/

CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  cycle_day int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_entries" ON entries;
CREATE POLICY "select_own_entries" ON entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_entries" ON entries;
CREATE POLICY "insert_own_entries" ON entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_entries" ON entries;
CREATE POLICY "update_own_entries" ON entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_entries" ON entries;
CREATE POLICY "delete_own_entries" ON entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS pattern_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  computed_stats jsonb NOT NULL,
  narrative text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('groq','gemini','template')),
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pattern_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pattern_reports" ON pattern_reports;
CREATE POLICY "select_own_pattern_reports" ON pattern_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pattern_reports" ON pattern_reports;
CREATE POLICY "insert_own_pattern_reports" ON pattern_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_pattern_reports" ON pattern_reports;
CREATE POLICY "update_own_pattern_reports" ON pattern_reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_pattern_reports" ON pattern_reports;
CREATE POLICY "delete_own_pattern_reports" ON pattern_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for efficient user-scoped queries
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_reports_user_id ON pattern_reports(user_id);