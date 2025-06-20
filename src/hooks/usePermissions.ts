/**
 * Permission Management React Hook
 * Provides easy access to user permissions and role checking
 * Updated to work with simplified role system
 */

import { useState, useEffect, useCallback } from 'react';
import { RoleService, SimpleRole } from '../services/roleService';
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<SimpleRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user permissions (only for admin-type users)
  const loadPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions([]);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user permissions and role details using simplified system
      const userPermissions = await RoleService.getUserPermissions(user.id);
      setPermissions(userPermissions);

      // Get their role details
      const roleDetails = await RoleService.getUserRole(user.id);
      
      if (roleDetails) {
        setUserRole(roleDetails);
      } else {
        // Fallback: set empty permissions and null role
        console.log('User has no role assigned');
        setPermissions([]);
        setUserRole(null);
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes('*') || permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasRole = useCallback((roleName: string): boolean => {
    return user?.role === roleName || userRole?.name === roleName;
  }, [user?.role, userRole?.name]);

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin') || hasRole('super_admin') || hasPermission('*');
  }, [hasRole, hasPermission]);

  const canManageUsers = useCallback((): boolean => {
    return hasAnyPermission(['view_users', 'moderate_content', '*']);
  }, [hasAnyPermission]);

  const canManageRoles = useCallback((): boolean => {
    return hasPermission('*') || userRole?.name === 'super_admin';
  }, [hasPermission, userRole]);

  const canManageDisputes = useCallback((): boolean => {
    return hasAnyPermission(['manage_disputes', '*']);
  }, [hasAnyPermission]);

  const canViewReports = useCallback((): boolean => {
    return hasAnyPermission(['view_analytics', '*']);
  }, [hasAnyPermission]);

  // Create simplified user permissions object
  const userPermissions = {
    roles: userRole ? [userRole] : [],
    permissions,
    hasPermission,
    hasAnyPermission,
    hasRole
  };

  return {
    permissions,
    userRole,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    canManageUsers,
    canManageRoles,
    canManageDisputes,
    canViewReports,
    userPermissions,
    refreshPermissions: loadPermissions
  };
};

/**
 * Hook for checking specific permissions (simpler version)
 */
export const usePermissionCheck = (requiredPermission: string) => {
  const { hasPermission, isLoading } = usePermissions();
  
  return {
    hasPermission: hasPermission(requiredPermission),
    isLoading
  };
};

/**
 * Hook for checking if user has any of the required permissions
 */
export const useAnyPermissionCheck = (requiredPermissions: string[]) => {
  const { hasAnyPermission, isLoading } = usePermissions();
  
  return {
    hasPermission: hasAnyPermission(requiredPermissions),
    isLoading
  };
};