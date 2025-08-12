-- Comprehensive diagnosis of user profile issues
-- Run this to understand what's happening

-- 1. Check ALL user profiles (bypassing RLS if needed)
SELECT 'All user profiles:' as info;
SELECT id, user_id, display_name, default_budget, created_at, updated_at 
FROM user_profiles 
ORDER BY user_id, created_at;

-- 2. Count profiles per user
SELECT 'Profile count per user:' as info;
SELECT user_id, COUNT(*) as profile_count
FROM user_profiles 
GROUP BY user_id 
ORDER BY profile_count DESC;

-- 3. Check for any users with multiple profiles
SELECT 'Users with multiple profiles:' as info;
SELECT user_id, COUNT(*) as count, array_agg(id) as profile_ids, array_agg(display_name) as names
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 4. Check authentication users vs profiles
SELECT 'Auth users vs profiles comparison:' as info;
SELECT 
    au.id as auth_user_id,
    au.email,
    up.id as profile_id,
    up.display_name,
    CASE 
        WHEN up.id IS NULL THEN 'Missing Profile'
        ELSE 'Has Profile'
    END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- 5. Check for orphaned profiles
SELECT 'Orphaned profiles (no corresponding auth user):' as info;
SELECT up.id, up.user_id, up.display_name
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- 6. Check RLS policies status
SELECT 'RLS policies on user_profiles:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 7. Check table constraints
SELECT 'Table constraints:' as info;
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_name = 'user_profiles';