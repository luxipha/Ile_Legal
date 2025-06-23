-- FIX: Create missing admin profile record
-- This will create the missing profile for admin.test@ile-legal.com

-- Insert the missing profile record
INSERT INTO "Profiles" (
    id, 
    email, 
    first_name, 
    last_name, 
    user_type,
    created_at,
    updated_at
)
VALUES (
    '140a2c7a-7296-4420-bc0e-40832868733d',  -- Your exact user ID
    'admin.test@ile-legal.com',
    'Demo',
    'Admin', 
    'admin',  -- This is the key field that enables admin access
    NOW(),
    NOW()
);

-- Verify the insert worked
SELECT 
    '=== VERIFICATION ===' as section,
    id,
    email,
    first_name,
    last_name,
    user_type,
    'Profile created successfully!' as status
FROM "Profiles" 
WHERE id = '140a2c7a-7296-4420-bc0e-40832868733d';