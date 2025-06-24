-- Corrected SQL for Supabase auth.users table structure
-- The column is likely called raw_user_meta_data, not user_metadata

-- First, let's check what we're working with
SELECT id, email, raw_user_meta_data
FROM auth.users 
WHERE email = 'admin.test@ile-legal.com';

-- Update using the correct column name
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb), 
        '{role}', 
        '"admin"'
    ),
    '{role_title}', 
    '"admin"'
)
WHERE email = 'admin.test@ile-legal.com';

-- Verify the update worked
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'role_title' as role_title,
    raw_user_meta_data->>'name' as name
FROM auth.users 
WHERE email = 'admin.test@ile-legal.com';

-- Also update the RLS policy to use the correct column
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;

CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.raw_user_meta_data->>'role_title' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        )
    );