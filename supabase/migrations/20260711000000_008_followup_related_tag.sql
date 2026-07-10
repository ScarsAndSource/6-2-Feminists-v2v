-- Run this in the Supabase SQL Editor if you haven't already run
-- migrations 20260711000000_008_followup_related_tag.sql
-- It is safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS-style guard).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'visit_followups'
      AND column_name = 'related_tag'
  ) THEN
    ALTER TABLE visit_followups ADD COLUMN related_tag text;
  END IF;
END;
$$;
