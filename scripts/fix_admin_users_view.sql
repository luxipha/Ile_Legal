-- Fix admin_users view to use correct column names
-- The profiles table has 'name' column, not first_name/last_name

-- Drop and recreate the admin_users view with correct column mapping
DROP VIEW IF EXISTS admin_users;

CREATE OR REPLACE VIEW admin_users AS
SELECT 
  p.id,
  p.email,
  p.name as full_name,
  p.created_at,
  p.updated_at,
  p.role_id,
  ur.name as role_name,
  ur.display_name as role_display_name,
  ur.color as role_color,
  ur.uses_permissions
FROM profiles p
JOIN user_roles ur ON p.role_id = ur.id
WHERE ur.uses_permissions = true;

-- Grant permissions on the updated view
GRANT SELECT ON admin_users TO authenticated;

-- Also create a user_role_assignments table if it doesn't exist
-- This will help with role management
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id, is_active)
);

-- Enable RLS on role assignments
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for role assignments
CREATE POLICY "Allow authenticated users to view role assignments" ON user_role_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin users to manage role assignments" ON user_role_assignments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN user_roles ur ON p.role_id = ur.id
      WHERE p.id = auth.uid() AND ur.name = 'admin'
    )
  );