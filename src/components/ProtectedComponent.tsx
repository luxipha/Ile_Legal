/**
 * Protected Component
 * Conditionally renders components based on user permissions
 */

import React from 'react';
import { PermissionName } from '../types/roles';
import { usePermissions, usePermissionCheck, useAnyPermissionCheck } from '../hooks/usePermissions';

interface ProtectedComponentProps {
  children: React.ReactNode;
  requiredPermission?: PermissionName;
  requiredPermissions?: PermissionName[];
  requiredRole?: string;
  requireAll?: boolean; // If true, user must have ALL permissions (default: ANY)
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requiredRole,
  requireAll = false,
  fallback = null,
  showLoading = false
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasRole, 
    isLoading 
  } = usePermissions();

  if (isLoading && showLoading) {
    return <div className="text-gray-500">Loading permissions...</div>;
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Simpler permission-based component
 */
interface RequirePermissionProps {
  permission: PermissionName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { hasPermission } = usePermissionCheck(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Role-based component protection
 */
interface RequireRoleProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  role,
  children,
  fallback = null
}) => {
  const { hasRole } = usePermissions();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Admin-only component
 */
interface RequireAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({
  children,
  fallback = <div className="text-red-500">Access denied: Admin required</div>
}) => {
  const { isAdmin } = usePermissions();

  if (!isAdmin()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Multiple permissions with AND/OR logic
 */
interface RequirePermissionsProps {
  permissions: PermissionName[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermissions: React.FC<RequirePermissionsProps> = ({
  permissions,
  requireAll = false,
  children,
  fallback = null
}) => {
  const { hasPermission } = useAnyPermissionCheck(permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Permission display component - shows permission status
 */
interface PermissionStatusProps {
  permission: PermissionName;
  showGranted?: boolean;
  showDenied?: boolean;
}

export const PermissionStatus: React.FC<PermissionStatusProps> = ({
  permission,
  showGranted = true,
  showDenied = true
}) => {
  const { hasPermission, isLoading } = usePermissionCheck(permission);

  if (isLoading) {
    return <span className="text-gray-400">Checking...</span>;
  }

  if (hasPermission && showGranted) {
    return <span className="text-green-600 text-sm">✓ Granted</span>;
  }

  if (!hasPermission && showDenied) {
    return <span className="text-red-600 text-sm">✗ Denied</span>;
  }

  return null;
};