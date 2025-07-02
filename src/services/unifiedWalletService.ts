import { supabase } from '../lib/supabase';
import { frontendWalletService } from './frontendWalletService';

export interface UnifiedWalletData {
  ethAddress?: string;
  circleWalletId?: string;
  circleWalletAddress?: string;
  balance: string;
  currency: string;
  hasEthWallet: boolean;
  hasCircleWallet: boolean;
}

/**
 * Get unified wallet data for a user (both ETH and Circle wallets)
 * @param userId - User ID to fetch wallet data for
 * @returns Promise<UnifiedWalletData>
 */
export const getUserWalletData = async (userId: string): Promise<UnifiedWalletData> => {
  try {
    // Get profile data for ETH address
    const { data: profile, error: profileError } = await supabase
      .from('Profiles')
      .select('eth_address')
      .eq('id', userId)
      .single();

    // Get Circle wallet data from correct table
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, balance_usdc')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile data:', profileError);
    }

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error fetching wallet data:', walletError);
    }

    // Use stored balance as fallback if API fails
    let circleBalance = walletData?.balance_usdc?.toString() || '0.00';
    
    if (walletData?.circle_wallet_id) {
      try {
        // Try to get real-time balance from Circle API
        const balanceData = await frontendWalletService.getWalletBalance(walletData.circle_wallet_id);
        if (balanceData?.tokenBalances?.length > 0) {
          const usdcBalance = balanceData.tokenBalances.find((b: any) => b.token.symbol === 'USDC');
          circleBalance = usdcBalance?.amount || circleBalance; // Fallback to stored balance
        }
      } catch (error) {
        console.log('Could not fetch Circle wallet balance, using stored balance:', error);
        // Keep using stored balance from database
      }
    }

    return {
      ethAddress: profile?.eth_address || undefined,
      circleWalletId: walletData?.circle_wallet_id || undefined,
      circleWalletAddress: walletData?.wallet_address || undefined,
      balance: circleBalance,
      currency: 'USDC',
      hasEthWallet: !!profile?.eth_address,
      hasCircleWallet: !!walletData?.circle_wallet_id
    };
  } catch (error) {
    console.error('Error in getUserWalletData:', error);
    throw error;
  }
};

/**
 * Get the primary wallet address for a user (ETH takes precedence)
 * @param userId - User ID
 * @returns Primary wallet address string
 */
export const getPrimaryWalletAddress = async (userId: string): Promise<string | null> => {
  try {
    const walletData = await getUserWalletData(userId);
    
    // ETH address takes precedence if available
    if (walletData.ethAddress) {
      return walletData.ethAddress;
    }
    
    // Fall back to Circle wallet address
    if (walletData.circleWalletAddress) {
      return walletData.circleWalletAddress;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting primary wallet address:', error);
    return null;
  }
};

/**
 * Update ETH address in user profile
 * @param userId - User ID
 * @param ethAddress - Ethereum address
 */
export const updateEthAddress = async (userId: string, ethAddress: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('Profiles')
      .update({ eth_address: ethAddress })
      .eq('id', userId);

    if (error) {
      console.error('Error updating ETH address:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateEthAddress:', error);
    throw error;
  }
};