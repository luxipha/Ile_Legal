-- Check the actual structure of the auth.users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Also check if there's a raw_user_meta_data column instead
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users' 
  AND column_name LIKE '%meta%';

-- Check current admin user data
SELECT id, email, raw_user_meta_data
FROM auth.users 
WHERE email = 'admin.test@ile-legal.com';