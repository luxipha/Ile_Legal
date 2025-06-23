-- Check the current admin user's profile and what's missing

-- First, check auth.users table
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'admin.test@ile-legal.com';

-- Check if there's a profile in the Profiles table
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    user_type,
    created_at
FROM "Profiles" 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin.test@ile-legal.com');

-- If no profile exists, we need to create one
-- Check if the user exists in auth but missing profile
SELECT 
    'Missing Profile' as issue,
    u.id,
    u.email
FROM auth.users u
LEFT JOIN "Profiles" p ON u.id = p.id
WHERE u.email = 'admin.test@ile-legal.com' 
AND p.id IS NULL;