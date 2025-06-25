/**
 * Simplified Role Management API Service
 * Uses simple user_type field instead of complex role tables
 */

import { supabase } from '../lib/supabase';

export type UserType = 'buyer' | 'seller' | 'admin' | 'super_admin' | 'moderator' | 'support';

export interface SimpleRole {
  id: string;
  name: UserType;
  display_name: string;
  description: string;
  color: string;
  permissions: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: UserType;
  created_at: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface TeamMemberListResponse {
  members: TeamMember[];
  total: number;
  page: number;
  limit: number;
}

// Define role permissions and properties
const ROLE_DEFINITIONS: Record<UserType, SimpleRole> = {
  buyer: {
    id: 'buyer',
    name: 'buyer',
    display_name: 'Buyer',
    description: 'Regular client who purchases legal services',
    color: '#3B82F6',
    permissions: ['view_gigs', 'create_bids', 'message_sellers']
  },
  seller: {
    id: 'seller',
    name: 'seller',
    display_name: 'Legal Professional',
    description: 'Legal professional who provides services',
    color: '#10B981',
    permissions: ['create_gigs', 'manage_bids', 'message_buyers', 'upload_documents']
  },
  admin: {
    id: 'admin',
    name: 'admin',
    display_name: 'Admin',
    description: 'Basic administrator with limited permissions',
    color: '#F59E0B',
    permissions: ['view_users', 'moderate_content', 'view_analytics']
  },
  super_admin: {
    id: 'super_admin',
    name: 'super_admin',
    display_name: 'Super Admin',
    description: 'Full administrator with all permissions',
    color: '#EF4444',
    permissions: ['*'] // All permissions
  },
  moderator: {
    id: 'moderator',
    name: 'moderator',
    display_name: 'Moderator',
    description: 'Content moderator',
    color: '#8B5CF6',
    permissions: ['moderate_content', 'view_reports', 'manage_disputes']
  },
  support: {
    id: 'support',
    name: 'support',
    display_name: 'Support',
    description: 'Customer support representative',
    color: '#06B6D4',
    permissions: ['view_tickets', 'message_users', 'view_user_profiles']
  }
};

export class RoleService {
  /**
   * Get all available roles
   */
  static async getAllRoles(): Promise<SimpleRole[]> {
    try {
      return Object.values(ROLE_DEFINITIONS);
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get admin-manageable roles (excludes buyer/seller)
   */
  static async getAdminRoles(): Promise<SimpleRole[]> {
    try {
      return Object.values(ROLE_DEFINITIONS).filter(role => 
        !['buyer', 'seller'].includes(role.name)
      );
    } catch (error) {
      console.error('Error fetching admin roles:', error);
      throw error;
    }
  }

  /**
   * Get role by user_type
   */
  static getRoleByType(userType: UserType): SimpleRole {
    return ROLE_DEFINITIONS[userType];
  }

  /**
   * Get admin team members only (excludes regular buyers/sellers)
   */
  static async getTeamMembers(page = 1, limit = 20): Promise<TeamMemberListResponse> {
    try {
      const offset = (page - 1) * limit;

      // Get total count for admin users only
      const { count, error: countError } = await supabase
        .from('Profiles')
        .select('*', { count: 'exact', head: true })
        .in('user_type', ['admin', 'super_admin', 'moderator', 'support']);

      if (countError) throw countError;

      // Get admin team members
      const { data: profiles, error } = await supabase
        .from('Profiles')
        .select('id, email, first_name, last_name, user_type, created_at, avatar_url')
        .in('user_type', ['admin', 'super_admin', 'moderator', 'support'])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const members: TeamMember[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown User',
        email: profile.email || '',
        first_name: profile.first_name,
        last_name: profile.last_name,
        user_type: profile.user_type as UserType,
        created_at: profile.created_at,
        avatar_url: profile.avatar_url,
        is_active: true
      }));

      return {
        members,
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  /**
   * Create a new admin user
   */
  static async createAdminUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    location?: string;
    password: string;
    userType: UserType;
    sendInvite?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { 
          first_name: userData.firstName,
          last_name: userData.lastName,
          user_type: userData.userType
        }
      });

      if (error) throw error;

      // Create profile
      const { error: profileError } = await supabase
        .from('Profiles')
        .insert({
          id: data.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phoneNumber,
          location: userData.location,
          user_type: userData.userType
        });

      if (profileError) throw profileError;

      return {
        success: true,
        message: `Admin user ${userData.email} created successfully`
      };
    } catch (error) {
      console.error('Error creating admin user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create admin user'
      };
    }
  }

  /**
   * Change a user's role/user_type
   */
  static async changeUserRole(userId: string, newUserType: UserType): Promise<void> {
    try {
      const { error } = await supabase
        .from('Profiles')
        .update({ user_type: newUserType })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  }

  /**
   * Get user's role details by user ID
   */
  static async getUserRole(userId: string): Promise<SimpleRole | null> {
    try {
      const { data: profile, error } = await supabase
        .from('Profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error || !profile?.user_type) {
        console.log('User has no user_type assigned');
        return null;
      }

      return ROLE_DEFINITIONS[profile.user_type as UserType];
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  /**
   * Get user's permissions by user ID
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const role = await this.getUserRole(userId);
      return role?.permissions || [];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes('*') || permissions.includes(permissionName);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get admin profile data
   */
  static async getAdminProfile(userId: string): Promise<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    location?: string;
    user_type: UserType;
    created_at: string;
  } | null> {
    try {
      const { data: profile, error } = await supabase
        .from('Profiles')
        .select('id, email, first_name, last_name, phone, location, user_type, created_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return profile as any;
    } catch (error) {
      console.error('Error loading admin profile:', error);
      return null;
    }
  }
}