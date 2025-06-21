-- Update Role System for Hybrid Approach
-- Keep AuthContext for buyers/sellers, use role system only for admin roles

-- Update role descriptions to clarify the hybrid system
UPDATE user_roles SET 
  description = 'Full system access and control. Uses advanced role system with granular permissions.',
  is_system_role = true
WHERE name = 'admin';

UPDATE user_roles SET 
  description = 'Legal professionals who offer services. Uses simplified AuthContext role system.',
  is_system_role = true
WHERE name = 'seller';

UPDATE user_roles SET 
  description = 'Users seeking legal services. Uses simplified AuthContext role system.',
  is_system_role = true  
WHERE name = 'buyer';

-- Keep admin-specific roles as non-system roles (can be managed)
UPDATE user_roles SET 
  is_system_role = false,
  description = 'Customer support staff with permission-based access control.'
WHERE name = 'support_agent';

UPDATE user_roles SET 
  is_system_role = false,
  description = 'Senior legal staff with permission-based access for dispute resolution.'
WHERE name = 'legal_advisor';

UPDATE user_roles SET 
  is_system_role = false,
  description = 'Technical support staff with permission-based system access.'
WHERE name = 'technical_support';

-- Add a new column to track if role uses permission system
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS uses_permissions BOOLEAN DEFAULT true;

-- Set which roles use the permission system
UPDATE user_roles SET uses_permissions = true WHERE name IN ('admin', 'support_agent', 'legal_advisor', 'technical_support');
UPDATE user_roles SET uses_permissions = false WHERE name IN ('buyer', 'seller');

-- Create a view for admin-manageable roles (excludes buyer/seller)
CREATE OR REPLACE VIEW admin_manageable_roles AS
SELECT * FROM user_roles 
WHERE name NOT IN ('buyer', 'seller')
ORDER BY is_system_role DESC, name;

-- Create a view for admin users (users with admin-type roles)
CREATE OR REPLACE VIEW admin_users AS
SELECT 
  p.*,
  ur.name as role_name,
  ur.display_name as role_display_name,
  ur.uses_permissions
FROM profiles p
JOIN user_roles ur ON p.role_id = ur.id
WHERE ur.uses_permissions = true;

-- Grant permissions on the new views
GRANT SELECT ON admin_manageable_roles TO authenticated, anon;
GRANT SELECT ON admin_users TO authenticated;