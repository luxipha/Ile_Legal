/**
 * Enhanced Role and Permission System Types
 * Supports flexible RBAC (Role-Based Access Control)
 */

// Core permission type
export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  created_at: string;
}

// Core role type
export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  color: string;
  uses_permissions?: boolean; // Whether this role uses the permission system
  permissions: Permission[];
  user_count?: number;
  created_at: string;
  updated_at: string;
}

// Team member type for role delegation
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  team?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

// Permission categories
export type PermissionCategory = 
  | 'system'
  | 'users'
  | 'disputes'
  | 'gigs'
  | 'reports'
  | 'support'
  | 'financial';

// Permission group for UI organization
export interface PermissionGroup {
  category: PermissionCategory;
  display_name: string;
  description: string;
  permissions: Permission[];
}

// API Request/Response types for role management
export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  permission_ids: string[];
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  color?: string;
  permission_ids?: string[];
}

export interface ChangeUserRoleRequest {
  user_id: string;
  role_id: string;
  reason?: string;
}

// API Response types
export interface RoleListResponse {
  roles: Role[];
  total: number;
}

export interface PermissionListResponse {
  permissions: Permission[];
  groups: PermissionGroup[];
}

export interface TeamMemberListResponse {
  members: TeamMember[];
  total: number;
  page: number;
  limit: number;
}

// Permission checking utilities
export interface UserPermissions {
  roles: Role[];
  permissions: Permission[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
}

// Audit log for role/permission changes
export interface RoleAuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: 'role_created' | 'role_updated' | 'role_deleted' | 'user_role_changed' | 'permissions_updated';
  target_id: string;
  target_name: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  created_at: string;
}

// Enhanced User type that extends the existing User interface
export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
  isVerified: boolean;
  user_metadata: {
    phone?: string;
    address?: string;
    profile_picture?: string;
    role_title?: string;
    clearance_level?: string;
    email_verified?: boolean;
    eth_address?: string;
    circle_wallet_id?: string;
    circle_wallet_address?: string;
  };
}

// System-wide permission constants
export const PERMISSIONS = {
  // System
  SYSTEM_ADMIN: 'system_admin',
  SYSTEM_CONFIG: 'system_config',
  SECURITY_SETTINGS: 'security_settings',
  ROLE_MANAGEMENT: 'role_management',
  
  // Users
  USER_MANAGEMENT: 'user_management',
  USER_VERIFICATION: 'user_verification',
  USER_SUSPENSION: 'user_suspension',
  VIEW_USER_PROFILES: 'view_user_profiles',
  EDIT_USER_PROFILES: 'edit_user_profiles',
  RESET_PASSWORDS: 'reset_passwords',
  
  // Disputes
  DISPUTE_RESOLUTION: 'dispute_resolution',
  VIEW_DISPUTES: 'view_disputes',
  UPDATE_DISPUTE_STATUS: 'update_dispute_status',
  ADD_DISPUTE_COMMENTS: 'add_dispute_comments',
  ASSIGN_DISPUTES: 'assign_disputes',
  RESOLVE_DISPUTES: 'resolve_disputes',
  
  // Gigs
  GIG_MANAGEMENT: 'gig_management',
  VIEW_ALL_GIGS: 'view_all_gigs',
  MODERATE_GIGS: 'moderate_gigs',
  SUSPEND_GIGS: 'suspend_gigs',
  FEATURE_GIGS: 'feature_gigs',
  
  // Reports
  GENERATE_REPORTS: 'generate_reports',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // Support
  SUPPORT_TICKETS: 'support_tickets',
  LIVE_CHAT: 'live_chat',
  KNOWLEDGE_BASE: 'knowledge_base',
  
  // Financial
  PAYMENT_MANAGEMENT: 'payment_management',
  REFUND_PROCESSING: 'refund_processing',
  FINANCIAL_REPORTS: 'financial_reports'
} as const;

// Default role names
export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer',
  SUPPORT_AGENT: 'support_agent',
  LEGAL_ADVISOR: 'legal_advisor',
  TECHNICAL_SUPPORT: 'technical_support'
} as const;

// Permission categories for UI organization
export const PERMISSION_CATEGORIES: Record<PermissionCategory, { display_name: string; description: string; color: string }> = {
  system: {
    display_name: 'System Administration',
    description: 'Core system settings and administration',
    color: '#3B82F6'
  },
  users: {
    display_name: 'User Management',
    description: 'User accounts and profile management',
    color: '#10B981'
  },
  disputes: {
    display_name: 'Dispute Resolution',
    description: 'Dispute handling and resolution',
    color: '#EF4444'
  },
  gigs: {
    display_name: 'Gig Management',
    description: 'Legal service gig management',
    color: '#F59E0B'
  },
  reports: {
    display_name: 'Reports & Analytics',
    description: 'System reports and data analytics',
    color: '#8B5CF6'
  },
  support: {
    display_name: 'Customer Support',
    description: 'Customer support and assistance',
    color: '#06B6D4'
  },
  financial: {
    display_name: 'Financial Management',
    description: 'Payments, transactions, and financial data',
    color: '#84CC16'
  }
};

// Utility type for permission checking
export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type RoleName = typeof ROLES[keyof typeof ROLES];

// Error types for role management
export interface RoleManagementError {
  code: 'ROLE_NOT_FOUND' | 'PERMISSION_DENIED' | 'SYSTEM_ROLE_PROTECTED' | 'ROLE_IN_USE' | 'INVALID_PERMISSIONS';
  message: string;
  details?: Record<string, any>;
}