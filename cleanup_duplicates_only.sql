-- Clean up duplicate user profiles only (skip constraint creation)

-- First, show what duplicates exist
SELECT user_id, COUNT(*) as profile_count, string_agg(id::text, ', ') as profile_ids
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Remove duplicate profiles, keeping only the most recent one for each user_id
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
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: No duplicate profiles found after cleanup'
    ELSE 'WARNING: ' || COUNT(*) || ' duplicate profiles still exist'
  END as cleanup_status
FROM (
  SELECT user_id
  FROM user_profiles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
) duplicates;

-- Show final profile count
SELECT 'Total profiles after cleanup: ' || COUNT(*) as final_count FROM user_profiles;