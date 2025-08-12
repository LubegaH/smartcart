-- Fix duplicate user profiles issue
-- This removes duplicate profiles keeping the most recent one

-- First, let's see what duplicates exist (for information)
SELECT user_id, COUNT(*) as profile_count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Delete duplicate profiles, keeping only the most recent one for each user_id
WITH ranked_profiles AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as rn
  FROM user_profiles
)
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id 
  FROM ranked_profiles 
  WHERE rn > 1
);

-- Verify no duplicates remain
SELECT user_id, COUNT(*) as profile_count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Add a unique constraint to prevent future duplicates if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_profiles' 
        AND constraint_name = 'user_profiles_user_id_key'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Show final profile count
SELECT 'Total profiles after cleanup: ' || COUNT(*) as status FROM user_profiles;