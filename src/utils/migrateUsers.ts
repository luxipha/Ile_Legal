/**
 * User Migration Utility
 * Migrates existing users from string roles to new role system
 */

import { RoleService } from '../services/roleService';

export const migrateExistingUsers = async (): Promise<void> => {
  try {
    console.log('🔄 Starting user migration to new role system...');
    await RoleService.migrateExistingUsers();
    console.log('✅ User migration completed successfully');
  } catch (error) {
    console.error('❌ User migration failed:', error);
    throw error;
  }
};

// Export for manual testing
(window as any).migrateUsers = migrateExistingUsers;