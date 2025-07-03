import { supabase } from '../lib/supabase';
import { frontendWalletService } from '../services/frontendWalletService';

/**
 * Utility functions for migrating wallet data from Profiles to user_wallets table
 */

export interface MigrationResult {
  success: boolean;
  message: string;
  walletId?: string;
  error?: string;
}

/**
 * Migrate a single user's wallet data from Profiles to user_wallets
 */
export const migrateUserWallet = async (userId: string): Promise<MigrationResult> => {
  try {
    console.log('🔄 [Migration] Starting wallet migration for user:', userId);
    
    // Check if user already has wallet in user_wallets table
    const { data: existingWallets, error: checkError } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [Migration] Error checking existing wallets:', checkError);
      return {
        success: false,
        message: 'Failed to check existing wallets',
        error: checkError.message
      };
    }
    
    if (existingWallets && existingWallets.length > 0) {
      console.log('✅ [Migration] User already has wallet in user_wallets table');
      return {
        success: true,
        message: 'Wallet already migrated',
        walletId: existingWallets[0].circle_wallet_id
      };
    }
    
    // Get wallet data from Profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('Profiles')
      .select('circle_wallet_id, circle_wallet_address, eth_address, first_name, last_name, email')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData) {
      console.log('⚠️  [Migration] No profile data found or error:', profileError?.message);
      return {
        success: false,
        message: 'No profile data found for migration',
        error: profileError?.message || 'Profile not found'
      };
    }
    
    console.log('📊 [Migration] Found profile data:', {
      hasCircleWallet: !!profileData.circle_wallet_id,
      hasEthAddress: !!profileData.eth_address,
      hasEmail: !!profileData.email
    });
    
    // If user has Circle wallet in Profiles, migrate it
    if (profileData.circle_wallet_id && profileData.circle_wallet_address) {
      console.log('🔄 [Migration] Migrating Circle wallet from Profiles');
      
      const { data: migratedWallet, error: migrationError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          circle_wallet_id: profileData.circle_wallet_id,
          wallet_address: profileData.circle_wallet_address,
          wallet_state: 'LIVE',
          blockchain: 'MATIC-AMOY',
          account_type: 'SCA',
          custody_type: 'ENDUSER',
          description: `Migrated wallet for ${profileData.first_name} ${profileData.last_name}`,
          balance_usdc: 0,
          balance_matic: 0,
          is_active: true
        })
        .select()
        .single();
      
      if (migrationError) {
        console.error('❌ [Migration] Failed to migrate Circle wallet:', migrationError);
        return {
          success: false,
          message: 'Failed to migrate Circle wallet',
          error: migrationError.message
        };
      }
      
      console.log('✅ [Migration] Circle wallet migrated successfully');
      return {
        success: true,
        message: 'Circle wallet migrated successfully',
        walletId: profileData.circle_wallet_id
      };
    }
    
    // If user has ETH address in Profiles, create a placeholder record
    if (profileData.eth_address) {
      console.log('🔄 [Migration] Creating ETH wallet record from Profiles');
      
      const { data: ethWallet, error: ethError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          circle_wallet_id: `eth-${userId}`,
          wallet_address: profileData.eth_address,
          wallet_state: 'LIVE',
          blockchain: 'ETHEREUM',
          account_type: 'EOA',
          custody_type: 'ENDUSER',
          description: `Migrated ETH wallet for ${profileData.first_name} ${profileData.last_name}`,
          balance_usdc: 0,
          balance_matic: 0,
          is_active: true
        })
        .select()
        .single();
      
      if (ethError) {
        console.error('❌ [Migration] Failed to migrate ETH wallet:', ethError);
        return {
          success: false,
          message: 'Failed to migrate ETH wallet',
          error: ethError.message
        };
      }
      
      console.log('✅ [Migration] ETH wallet migrated successfully');
      return {
        success: true,
        message: 'ETH wallet migrated successfully',
        walletId: `eth-${userId}`
      };
    }
    
    // If no wallet data found, create a new wallet
    if (profileData.email && profileData.first_name) {
      console.log('🔄 [Migration] No existing wallet found, creating new wallet');
      
      const result = await frontendWalletService.createWallet({
        userId: userId,
        userType: 'buyer', // Default to buyer, can be updated later
        name: `${profileData.first_name} ${profileData.last_name || ''}`.trim(),
        email: profileData.email
      });
      
      if (result.success && result.wallet) {
        console.log('✅ [Migration] New wallet created successfully');
        return {
          success: true,
          message: 'New wallet created successfully',
          walletId: result.wallet.circle_wallet_id
        };
      } else {
        console.error('❌ [Migration] Failed to create new wallet:', result.error);
        return {
          success: false,
          message: 'Failed to create new wallet',
          error: result.error || 'Unknown error'
        };
      }
    }
    
    return {
      success: false,
      message: 'No wallet data found and insufficient profile data to create new wallet',
      error: 'Missing email or name in profile'
    };
    
  } catch (error: any) {
    console.error('❌ [Migration] Migration failed with exception:', error);
    return {
      success: false,
      message: 'Migration failed with exception',
      error: error.message
    };
  }
};

/**
 * Check if user needs wallet migration
 */
export const checkMigrationNeeded = async (userId: string): Promise<boolean> => {
  try {
    // Check if user has wallet in user_wallets table
    const { data: userWallets, error } = await supabase
      .from('user_wallets')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user wallets:', error);
      return false;
    }
    
    // If user has wallets, no migration needed
    if (userWallets && userWallets.length > 0) {
      return false;
    }
    
    // Check if user has wallet data in Profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('Profiles')
      .select('circle_wallet_id, eth_address')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData) {
      return false;
    }
    
    // Migration needed if user has wallet data in Profiles but not in user_wallets
    return !!(profileData.circle_wallet_id || profileData.eth_address);
    
  } catch (error) {
    console.error('Error checking migration needed:', error);
    return false;
  }
};

/**
 * Auto-migrate user wallet if needed (to be called on login/session check)
 */
export const autoMigrateIfNeeded = async (userId: string): Promise<MigrationResult | null> => {
  try {
    const migrationNeeded = await checkMigrationNeeded(userId);
    
    if (migrationNeeded) {
      console.log('🔄 [AutoMigration] Auto-migrating wallet for user:', userId);
      return await migrateUserWallet(userId);
    }
    
    return null; // No migration needed
  } catch (error: any) {
    console.error('❌ [AutoMigration] Auto-migration check failed:', error);
    return {
      success: false,
      message: 'Auto-migration check failed',
      error: error.message
    };
  }
};