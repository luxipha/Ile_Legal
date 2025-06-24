-- COMPREHENSIVE DIAGNOSTIC CHECK
-- Run this first to understand the current state before making any changes

-- 1. Check if admin user exists in auth.users
SELECT 
    '=== AUTH.USERS CHECK ===' as section,
    id, 
    email, 
    raw_user_meta_data,
    created_at,
    CASE 
        WHEN raw_user_meta_data->>'role' = 'admin' THEN 'Has admin role in metadata'
        WHEN raw_user_meta_data->>'role_title' = 'admin' THEN 'Has admin role_title in metadata'
        ELSE 'No admin role in metadata'
    END as auth_status
FROM auth.users 
WHERE email = 'admin.test@ile-legal.com';

-- 2. Check if profile exists in Profiles table
SELECT 
    '=== PROFILES TABLE CHECK ===' as section,
    p.id, 
    p.email, 
    p.first_name, 
    p.last_name, 
    p.user_type,
    p.created_at,
    CASE 
        WHEN p.user_type IN ('admin', 'super_admin') THEN 'Has admin user_type'
        WHEN p.user_type IS NULL THEN 'user_type is NULL'
        ELSE 'user_type is: ' || p.user_type
    END as profile_status
FROM "Profiles" p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'admin.test@ile-legal.com');

-- 3. Check if profile is missing entirely
SELECT 
    '=== MISSING PROFILE CHECK ===' as section,
    u.id as user_id,
    u.email,
    'MISSING PROFILE - This is the problem!' as issue
FROM auth.users u
LEFT JOIN "Profiles" p ON u.id = p.id
WHERE u.email = 'admin.test@ile-legal.com' 
AND p.id IS NULL;

-- 4. Check current RLS policy on app_settings
SELECT 
    '=== RLS POLICY CHECK ===' as section,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual as policy_condition
FROM pg_policies 
WHERE tablename = 'app_settings';

-- 5. Check if app_settings table exists and has data
SELECT 
    '=== APP_SETTINGS TABLE CHECK ===' as section,
    COUNT(*) as total_rows,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Table exists with data'
        ELSE 'Table exists but empty'
    END as table_status
FROM app_settings;

-- 6. Test what the current policy would return for this user
SELECT 
    '=== POLICY TEST ===' as section,
    u.id as user_id,
    u.email,
    p.user_type,
    CASE 
        WHEN p.user_type IN ('admin', 'super_admin') THEN 'WOULD PASS: Profiles check'
        WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'WOULD PASS: Auth metadata check'
        WHEN u.raw_user_meta_data->>'role_title' = 'admin' THEN 'WOULD PASS: Auth metadata check'
        ELSE 'WOULD FAIL: No admin access found'
    END as policy_result
FROM auth.users u
LEFT JOIN "Profiles" p ON u.id = p.id
WHERE u.email = 'admin.test@ile-legal.com';

-- 7. Show what we would insert/update
SELECT 
    '=== PROPOSED CHANGES ===' as section,
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', 'Demo Admin') as proposed_first_name,
    'Admin' as proposed_last_name,
    'admin' as proposed_user_type,
    CASE 
        WHEN p.id IS NULL THEN 'Would INSERT new profile'
        ELSE 'Would UPDATE existing profile user_type to admin'
    END as action_needed
FROM auth.users u
LEFT JOIN "Profiles" p ON u.id = p.id
WHERE u.email = 'admin.test@ile-legal.com';

-- 8. Check other admin users for reference
SELECT 
    '=== OTHER ADMIN USERS ===' as section,
    p.id,
    p.email,
    p.user_type,
    'Reference admin user' as note
FROM "Profiles" p
WHERE p.user_type IN ('admin', 'super_admin')
LIMIT 3;