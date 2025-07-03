import { supabase } from '../lib/supabase';
import { frontendWalletService } from './frontendWalletService';

/**
 * Service to retry Circle wallet creation for users who had failed wallet creation during registration
 */
export class WalletRetryService {
  
  /**
   * Retry wallet creation for a specific user
   */
  async retryWalletCreation(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 [WalletRetry] Attempting to retry wallet creation for user:', userId);

      // Get user information
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get current pending wallet
      const { data: currentWallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('wallet_state', 'PENDING')
        .single();

      if (walletError || !currentWallet) {
        return {
          success: false,
          message: 'No pending wallet found for this user'
        };
      }

      // Get user profile for name and email
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('first_name, last_name, email, user_type')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

      // Attempt to create Circle wallet via frontend
      const walletResponse = await frontendWalletService.createWallet({
        userId: userId,
        userType: profile.user_type as 'buyer' | 'seller',
        name: fullName,
        email: profile.email
      });

      if (!walletResponse.success || !walletResponse.wallet) {
        return {
          success: false,
          message: `Circle wallet creation failed: ${walletResponse.error || 'Unknown error'}`
        };
      }

      const wallet = walletResponse.wallet;

      // Delete the old pending wallet since frontendWalletService creates a new one
      await supabase
        .from('user_wallets')
        .delete()
        .eq('user_id', userId)
        .eq('id', currentWallet.id);

      // Update user metadata in auth
      await supabase.auth.updateUser({
        data: {
          circle_wallet_id: wallet.circle_wallet_id,
          circle_wallet_address: wallet.wallet_address,
          wallet_status: 'completed'
        }
      });

      console.log('✅ [WalletRetry] Successfully created Circle wallet via frontend');

      return {
        success: true,
        message: 'Circle wallet successfully created and linked to your account'
      };

    } catch (error) {
      console.error('❌ [WalletRetry] Error retrying wallet creation:', error);
      return {
        success: false,
        message: `Failed to create Circle wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all users with pending wallet creation
   */
  async getUsersWithPendingWallets(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select(`
          *,
          profile:Profiles!user_wallets_user_id_fkey(first_name, last_name, email, user_type)
        `)
        .eq('wallet_state', 'PENDING')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting users with pending wallets:', error);
      return [];
    }
  }

  /**
   * Check if user has a pending wallet that needs retry
   */
  async userNeedsWalletRetry(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', userId)
        .eq('wallet_state', 'PENDING')
        .eq('is_active', true);

      if (error) {
        console.error('Error checking wallet retry status:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking wallet retry status:', error);
      return false;
    }
  }

  /**
   * Batch retry wallet creation for multiple users (admin function)
   */
  async batchRetryWalletCreation(userIds: string[]): Promise<{ 
    successful: string[]; 
    failed: { userId: string; error: string }[] 
  }> {
    const successful: string[] = [];
    const failed: { userId: string; error: string }[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.retryWalletCreation(userId);
        if (result.success) {
          successful.push(userId);
        } else {
          failed.push({ userId, error: result.message });
        }
      } catch (error) {
        failed.push({ 
          userId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { successful, failed };
  }
}

// Export singleton instance
export const walletRetryService = new WalletRetryService();