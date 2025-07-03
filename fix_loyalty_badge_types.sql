-- Fix loyalty badge types in database

-- Step 1: Drop the old constraint
ALTER TABLE badge_definitions DROP CONSTRAINT badge_definitions_type_check;

-- Step 2: Add new constraint with 'loyalty' included
ALTER TABLE badge_definitions ADD CONSTRAINT badge_definitions_type_check 
  CHECK (type IN ('reputation', 'achievement', 'quality', 'verification', 'loyalty'));

-- Step 3: Update the badge types to 'loyalty'
UPDATE badge_definitions 
SET type = 'loyalty' 
WHERE id IN ('loyalty_active', 'loyalty_milestone', 'loyalty_streak', 'loyalty_engagement');

-- Step 4: Verify the update
SELECT id, name, type, category FROM badge_definitions 
WHERE id IN ('loyalty_active', 'loyalty_milestone', 'loyalty_streak', 'loyalty_engagement');