-- Fix the RLS policy for app_settings table to recognize admin users correctly

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;

-- Create the corrected policy that checks both role_title and role fields
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.user_metadata->>'role_title' = 'admin'
                OR auth.users.user_metadata->>'role' = 'admin'
            )
        )
    );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'app_settings';