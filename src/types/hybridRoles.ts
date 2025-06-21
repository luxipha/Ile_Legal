/**
 * Hybrid Role System Documentation
 * 
 * This system uses a hybrid approach for role management:
 * 
 * ## AuthContext Roles (Simple)
 * - **buyer**: Legal service clients - handled by AuthContext
 * - **seller**: Legal service providers - handled by AuthContext
 * 
 * ## Permission-Based Roles (Advanced)
 * - **admin**: System administrators - uses permission system
 * - **support_agent**: Customer support staff - uses permission system  
 * - **legal_advisor**: Senior legal staff - uses permission system
 * - **technical_support**: Technical support staff - uses permission system
 * 
 * ## Key Benefits:
 * 1. **Backward Compatibility**: Existing buyer/seller workflows unchanged
 * 2. **Granular Admin Control**: Advanced permission system for admin users
 * 3. **System Stability**: No breaking changes to existing code
 * 4. **Future Flexibility**: Can migrate buyers/sellers later if needed
 * 
 * ## Usage:
 * - Use `useAuth()` for buyer/seller role checks
 * - Use `usePermissions()` for admin permission checks
 * - Role management UI only shows admin-type roles
 * - Team member management only shows admin users
 */

export const HYBRID_SYSTEM_INFO = {
  authContextRoles: ['buyer', 'seller'],
  permissionBasedRoles: ['admin', 'support_agent', 'legal_advisor', 'technical_support'],
  
  isAuthContextRole: (role: string): boolean => {
    return ['buyer', 'seller'].includes(role);
  },
  
  isPermissionBasedRole: (role: string): boolean => {
    return ['admin', 'support_agent', 'legal_advisor', 'technical_support'].includes(role);
  },
  
  shouldShowInRoleManagement: (role: string): boolean => {
    return !['buyer', 'seller'].includes(role);
  }
} as const;