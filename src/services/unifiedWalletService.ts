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
    // Get profile data including both ETH and Circle wallet info
    const { data: profile, error: profileError } = await supabase
      .from('Profiles')
      .select('eth_address, circle_wallet_id, circle_wallet_address, circle_wallet_status')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile wallet data:', profileError);
      throw profileError;
    }

    // Get Circle wallet balance if available
    let circleBalance = '0.00';
    if (profile?.circle_wallet_id) {
      try {
        // Get real-time balance from Circle API
        const balanceData = await frontendWalletService.getWalletBalance(profile.circle_wallet_id);
        if (balanceData?.tokenBalances?.length > 0) {
          const usdcBalance = balanceData.tokenBalances.find((b: any) => b.token.symbol === 'USDC');
          circleBalance = usdcBalance?.amount || '0.00';
        }
      } catch (error) {
        console.log('Could not fetch Circle wallet balance:', error);
      }
    }

    return {
      ethAddress: profile?.eth_address || undefined,
      circleWalletId: profile?.circle_wallet_id || undefined,
      circleWalletAddress: profile?.circle_wallet_address || undefined,
      balance: circleBalance,
      currency: 'USDC',
      hasEthWallet: !!profile?.eth_address,
      hasCircleWallet: !!profile?.circle_wallet_id
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