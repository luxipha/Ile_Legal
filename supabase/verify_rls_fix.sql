-- Verification script to check if RLS security fixes were applied correctly

-- 1. Check if the secure admin function exists
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'is_admin' AND n.nspname = 'public';

-- 2. List all RLS policies on critical tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('Profiles', 'Payments', 'Withdrawals', 'PaymentLogs', 'app_settings')
ORDER BY tablename, policyname;

-- 3. Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Profiles', 'Payments', 'Withdrawals', 'PaymentLogs', 'app_settings')
ORDER BY tablename;

-- 4. Verify no policies still reference user_metadata (should return 0 rows)
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE qual LIKE '%user_metadata%' OR qual LIKE '%raw_user_meta_data%';

-- 5. Test the admin function (will return false unless you're an admin)
SELECT public.is_admin() as am_i_admin;