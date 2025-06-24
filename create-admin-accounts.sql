-- Create proper admin accounts with all necessary privileges
-- Run these commands in your Supabase SQL editor

-- First, let's check the current user that's having issues
SELECT 
    id, 
    email, 
    user_metadata->>'role' as role,
    user_metadata->>'role_title' as role_title,
    user_metadata->>'name' as name
FROM auth.users 
WHERE email = 'admin.test@ile-legal.com';

-- Update the current admin.test@ile-legal.com user to have proper admin access
UPDATE auth.users 
SET user_metadata = jsonb_set(
    jsonb_set(user_metadata, '{role}', '"admin"'),
    '{role_title}', '"admin"'
)
WHERE email = 'admin.test@ile-legal.com';

-- If you want to create additional admin accounts, here's the process:
-- 1. Register normally through the app with these emails
-- 2. Then run these UPDATE commands to give them admin privileges:

-- Example for future admin accounts:
/*
UPDATE auth.users 
SET user_metadata = jsonb_set(
    jsonb_set(
        jsonb_set(user_metadata, '{role}', '"admin"'),
        '{role_title}', '"admin"'
    ),
    '{name}', '"Admin User"'
)
WHERE email = 'your-new-admin@ile-legal.com';
*/

-- Verify all admin users
SELECT 
    id, 
    email, 
    user_metadata->>'role' as role,
    user_metadata->>'role_title' as role_title,
    user_metadata->>'name' as name,
    created_at
FROM auth.users 
WHERE user_metadata->>'role' = 'admin' 
   OR user_metadata->>'role_title' = 'admin'
ORDER BY created_at;