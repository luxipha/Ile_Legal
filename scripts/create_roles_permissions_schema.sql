-- Enhanced Role and Permission System Schema
-- This creates a flexible RBAC (Role-Based Access Control) system

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'seller', 'buyer', 'support_agent', 'legal_advisor', etc.
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- System roles can't be deleted
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL, -- 'user_management', 'dispute_resolution', etc.
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'system', 'users', 'disputes', 'reports', 'gigs', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Add role_id column to profiles table (keeping old role column for backward compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_id') THEN
        ALTER TABLE profiles ADD COLUMN role_id UUID REFERENCES user_roles(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Create updated_at trigger for user_roles
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_roles_updated_at();

-- Insert default system roles
INSERT INTO user_roles (name, display_name, description, is_system_role, color) VALUES
    ('admin', 'System Administrator', 'Full system access and control. Can manage all users, settings, and system configuration.', true, '#3B82F6'),
    ('seller', 'Legal Service Provider', 'Legal professionals who offer services. Can create gigs, manage clients, and handle transactions.', true, '#10B981'),
    ('buyer', 'Legal Service Client', 'Users seeking legal services. Can browse gigs, hire lawyers, and manage cases.', true, '#F59E0B'),
    ('support_agent', 'Support Agent', 'Customer support staff. Can assist users, handle basic inquiries, and escalate issues.', false, '#8B5CF6'),
    ('legal_advisor', 'Legal Advisor', 'Senior legal staff. Can review disputes, provide legal guidance, and manage complex cases.', false, '#EF4444'),
    ('technical_support', 'Technical Support', 'Technical support staff. Can handle technical issues, user accounts, and system troubleshooting.', false, '#F97316')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
    -- System Administration
    ('system_admin', 'System Administration', 'Full system administration access', 'system'),
    ('system_config', 'System Configuration', 'Modify system settings and configuration', 'system'),
    ('security_settings', 'Security Settings', 'Manage security settings and audit logs', 'system'),
    ('role_management', 'Role Management', 'Create and assign user roles', 'system'),
    
    -- User Management
    ('user_management', 'User Management', 'Create, modify, and delete user accounts', 'users'),
    ('user_verification', 'User Verification', 'Verify and approve user accounts', 'users'),
    ('user_suspension', 'User Suspension', 'Suspend and unsuspend user accounts', 'users'),
    ('view_user_profiles', 'View User Profiles', 'View user profile information', 'users'),
    ('edit_user_profiles', 'Edit User Profiles', 'Edit user profile information', 'users'),
    ('reset_passwords', 'Reset Passwords', 'Reset user passwords', 'users'),
    
    -- Dispute Resolution
    ('dispute_resolution', 'Dispute Resolution', 'Full access to all dispute cases', 'disputes'),
    ('view_disputes', 'View Disputes', 'View dispute cases', 'disputes'),
    ('update_dispute_status', 'Update Dispute Status', 'Update status of disputes', 'disputes'),
    ('add_dispute_comments', 'Add Dispute Comments', 'Add comments to disputes', 'disputes'),
    ('assign_disputes', 'Assign Disputes', 'Assign disputes to team members', 'disputes'),
    ('resolve_disputes', 'Resolve Disputes', 'Mark disputes as resolved', 'disputes'),
    
    -- Gig Management
    ('gig_management', 'Gig Management', 'Full gig management access', 'gigs'),
    ('view_all_gigs', 'View All Gigs', 'View all gigs in the system', 'gigs'),
    ('moderate_gigs', 'Moderate Gigs', 'Review and moderate gig content', 'gigs'),
    ('suspend_gigs', 'Suspend Gigs', 'Suspend inappropriate gigs', 'gigs'),
    ('feature_gigs', 'Feature Gigs', 'Mark gigs as featured', 'gigs'),
    
    -- Reports and Analytics
    ('generate_reports', 'Generate Reports', 'Generate and view all system reports', 'reports'),
    ('view_analytics', 'View Analytics', 'View system analytics and metrics', 'reports'),
    ('export_data', 'Export Data', 'Export system data', 'reports'),
    
    -- Support
    ('support_tickets', 'Support Tickets', 'Manage customer support tickets', 'support'),
    ('live_chat', 'Live Chat', 'Access to live chat support', 'support'),
    ('knowledge_base', 'Knowledge Base', 'Manage knowledge base articles', 'support'),
    
    -- Financial
    ('payment_management', 'Payment Management', 'Manage payments and transactions', 'financial'),
    ('refund_processing', 'Refund Processing', 'Process refunds and chargebacks', 'financial'),
    ('financial_reports', 'Financial Reports', 'View financial reports and metrics', 'financial')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to default roles
DO $$
DECLARE
    admin_role_id UUID;
    seller_role_id UUID;
    buyer_role_id UUID;
    support_role_id UUID;
    legal_role_id UUID;
    tech_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
    SELECT id INTO seller_role_id FROM user_roles WHERE name = 'seller';
    SELECT id INTO buyer_role_id FROM user_roles WHERE name = 'buyer';
    SELECT id INTO support_role_id FROM user_roles WHERE name = 'support_agent';
    SELECT id INTO legal_role_id FROM user_roles WHERE name = 'legal_advisor';
    SELECT id INTO tech_role_id FROM user_roles WHERE name = 'technical_support';
    
    -- Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Seller permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT seller_role_id, id FROM permissions 
    WHERE name IN ('view_user_profiles', 'support_tickets', 'view_disputes', 'add_dispute_comments')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Buyer permissions  
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT buyer_role_id, id FROM permissions 
    WHERE name IN ('view_user_profiles', 'support_tickets', 'view_disputes', 'add_dispute_comments')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Support Agent permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT support_role_id, id FROM permissions 
    WHERE name IN ('view_user_profiles', 'reset_passwords', 'support_tickets', 'live_chat', 'knowledge_base', 'view_disputes', 'add_dispute_comments')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Legal Advisor permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT legal_role_id, id FROM permissions 
    WHERE name IN ('dispute_resolution', 'view_disputes', 'update_dispute_status', 'add_dispute_comments', 'assign_disputes', 'resolve_disputes', 'moderate_gigs', 'view_user_profiles', 'user_verification')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Technical Support permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT tech_role_id, id FROM permissions 
    WHERE name IN ('view_user_profiles', 'edit_user_profiles', 'reset_passwords', 'support_tickets', 'live_chat', 'user_suspension', 'view_all_gigs', 'view_analytics')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Allow read access to user_roles" ON user_roles
    FOR SELECT 
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow admin users to manage roles" ON user_roles
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN user_roles ur ON p.role_id = ur.id 
            JOIN role_permissions rp ON ur.id = rp.role_id 
            JOIN permissions perm ON rp.permission_id = perm.id 
            WHERE p.id = auth.uid() AND perm.name = 'role_management'
        )
    );

-- Create RLS policies for permissions
CREATE POLICY "Allow read access to permissions" ON permissions
    FOR SELECT 
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow admin users to manage permissions" ON permissions
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN user_roles ur ON p.role_id = ur.id 
            JOIN role_permissions rp ON ur.id = rp.role_id 
            JOIN permissions perm ON rp.permission_id = perm.id 
            WHERE p.id = auth.uid() AND perm.name = 'role_management'
        )
    );

-- Create RLS policies for role_permissions
CREATE POLICY "Allow read access to role_permissions" ON role_permissions
    FOR SELECT 
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow admin users to manage role permissions" ON role_permissions
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN user_roles ur ON p.role_id = ur.id 
            JOIN role_permissions rp ON ur.id = rp.role_id 
            JOIN permissions perm ON rp.permission_id = perm.id 
            WHERE p.id = auth.uid() AND perm.name = 'role_management'
        )
    );

-- Grant necessary permissions
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON role_permissions TO authenticated;
GRANT SELECT ON user_roles TO anon;
GRANT SELECT ON permissions TO anon;
GRANT SELECT ON role_permissions TO anon;