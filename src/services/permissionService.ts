/**
 * Permission Service
 * Utility functions for permission checking and management
 */

import { Permission, UserPermissions, PermissionName } from '../types/roles';
import { RoleService } from './roleService';

export class PermissionService {
  /**
   * Create a UserPermissions object for easy permission checking
   */
  static createUserPermissions(permissions: Permission[]): UserPermissions {
    const permissionNames = new Set(permissions.map(p => p.name));

    return {
      roles: [], // Will be populated by the calling service
      permissions,
      hasPermission: (permission: string) => permissionNames.has(permission),
      hasAnyPermission: (requiredPermissions: string[]) => 
        requiredPermissions.some(perm => permissionNames.has(perm)),
      hasRole: (roleName: string) => false // Will be overridden by calling service
    };
  }

  /**
   * Check if user has specific permission
   */
  static async checkUserPermission(userId: string, permission: PermissionName): Promise<boolean> {
    return await RoleService.hasPermission(userId, permission);
  }

  /**
   * Get user's all permissions
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    return await RoleService.getUserPermissions(userId);
  }

  /**
   * Validate permissions array
   */
  static validatePermissions(permissionIds: string[], allPermissions: Permission[]): boolean {
    const validIds = new Set(allPermissions.map(p => p.id));
    return permissionIds.every(id => validIds.has(id));
  }

  /**
   * Get permissions by category
   */
  static getPermissionsByCategory(permissions: Permission[], category: string): Permission[] {
    return permissions.filter(p => p.category === category);
  }

  /**
   * Check if permissions array includes admin permissions
   */
  static hasAdminPermissions(permissions: Permission[]): boolean {
    const adminPermissions = ['system_admin', 'role_management', 'user_management'];
    return permissions.some(p => adminPermissions.includes(p.name));
  }

  /**
   * Get permission display name by name
   */
  static getPermissionDisplayName(permissionName: string, permissions: Permission[]): string {
    const permission = permissions.find(p => p.name === permissionName);
    return permission?.display_name || permissionName;
  }

  /**
   * Group permissions by category for UI display
   */
  static groupPermissionsByCategory(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }
}