-- Migration: Add affects_score column to habits table
-- Date: 2025-12-15
-- Purpose: Support "Bonus Habit" feature - habits that don't affect global score/streaks

-- Add the affects_score column with default value of true
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS affects_score BOOLEAN NOT NULL DEFAULT true;

-- Add comment to document the column
COMMENT ON COLUMN habits.affects_score IS 'If false, habit is a "Bonus" and does not affect global score or streaks. Default is true.';

-- Optional: Add an index if you plan to query by this field frequently
CREATE INDEX IF NOT EXISTS idx_habits_affects_score ON habits(affects_score);

-- Update any existing habits to explicitly set affects_score = true
-- (This ensures consistency for existing data)
UPDATE habits 
SET affects_score = true 
WHERE affects_score IS NULL;

