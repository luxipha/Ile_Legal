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
  supportedChains: string[];
  chainBalances: { [chain: string]: string };
}

export interface ChainConfig {
  name: string;
  chainId: string;
  blockchain: string;
  tokenId: string;
  symbol: string;
  rpcUrl?: string;
  explorerUrl?: string;
  isTestnet?: boolean;
}

// Supported blockchain configurations for multichain USDC
export const SUPPORTED_CHAINS: { [key: string]: ChainConfig } = {
  'ETHEREUM': {
    name: 'Ethereum',
    chainId: '1',
    blockchain: 'ETHEREUM',
    tokenId: 'usd-coin',
    symbol: 'USDC',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false
  },
  'POLYGON': {
    name: 'Polygon',
    chainId: '137',
    blockchain: 'POLYGON',
    tokenId: 'usd-coin-pos',
    symbol: 'USDC.e',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false
  },
  'BASE': {
    name: 'Base',
    chainId: '8453',
    blockchain: 'BASE',
    tokenId: 'usd-base-coin',
    symbol: 'USDbC',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    isTestnet: false
  },
  'ARBITRUM': {
    name: 'Arbitrum One',
    chainId: '42161',
    blockchain: 'ARBITRUM',
    tokenId: 'usd-coin-arbitrum',
    symbol: 'USDC',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false
  },
  'OPTIMISM': {
    name: 'Optimism',
    chainId: '10',
    blockchain: 'OPTIMISM',
    tokenId: 'usd-coin-optimism',
    symbol: 'USDC',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false
  }
};

/**
 * Get unified wallet data for a user (both ETH and Circle wallets with multichain support)
 * @param userId - User ID to fetch wallet data for
 * @returns Promise<UnifiedWalletData>
 */
export const getUserWalletData = async (userId: string): Promise<UnifiedWalletData> => {
  try {
    console.log('🔍 [UnifiedWallet] Fetching wallet data for user:', userId);
    
    // Get all wallet data from unified user_wallets table (multichain support)
    const { data: wallets, error: walletError } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, balance_usdc, blockchain')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    console.log('📊 [UnifiedWallet] Database query result:', {
      walletsFound: wallets?.length || 0,
      hasError: !!walletError,
      error: walletError?.message
    });

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error fetching wallet data:', walletError);
    }

    // Separate Circle and Ethereum wallets, collect multichain data
    const circleWallet = wallets?.find(w => w.blockchain !== 'ETHEREUM' && !w.circle_wallet_id.startsWith('eth-'));
    const ethWallet = wallets?.find(w => w.blockchain === 'ETHEREUM' || w.circle_wallet_id.startsWith('eth-'));
    
    // Get supported chains from user's wallets
    const supportedChains = wallets?.map(w => w.blockchain).filter(Boolean) || [];
    const chainBalances: { [chain: string]: string } = {};
    
    // Collect balance data for each chain
    wallets?.forEach(wallet => {
      if (wallet.blockchain && wallet.balance_usdc) {
        chainBalances[wallet.blockchain] = wallet.balance_usdc.toString();
      }
    });
    
    console.log('🔍 [UnifiedWallet] Wallet types found:', {
      hasCircle: !!circleWallet,
      hasEth: !!ethWallet,
      supportedChains: supportedChains,
      chainBalances: chainBalances,
      circleId: circleWallet?.circle_wallet_id,
      ethId: ethWallet?.circle_wallet_id
    });

    // Use stored balance as fallback if API fails
    let circleBalance = circleWallet?.balance_usdc?.toString() || '0.00';
    
    if (circleWallet?.circle_wallet_id && !circleWallet.circle_wallet_id.startsWith('eth-')) {
      try {
        console.log('💰 [UnifiedWallet] Fetching real-time balance from Circle API for wallet:', circleWallet.circle_wallet_id);
        // Try to get real-time balance from Circle API (only for actual Circle wallets)
        const balanceData = await frontendWalletService.getWalletBalance(circleWallet.circle_wallet_id);
        if (balanceData?.tokenBalances?.length > 0) {
          const usdcBalance = balanceData.tokenBalances.find((b: any) => b.token.symbol === 'USDC');
          const newBalance = usdcBalance?.amount || circleBalance;
          console.log('✅ [UnifiedWallet] Balance updated from API:', {
            stored: circleBalance,
            fromAPI: newBalance,
            tokenCount: balanceData.tokenBalances.length
          });
          circleBalance = newBalance;
        } else {
          console.log('⚠️  [UnifiedWallet] No token balances found in API response');
        }
      } catch (error) {
        console.log('⚠️  [UnifiedWallet] Could not fetch Circle wallet balance, using stored balance:', error);
        // Keep using stored balance from database
      }
    } else {
      console.log('ℹ️  [UnifiedWallet] Skipping Circle API call for ETH wallet or missing Circle wallet');
    }

    const result = {
      ethAddress: ethWallet?.wallet_address || undefined,
      circleWalletId: circleWallet?.circle_wallet_id || undefined,
      circleWalletAddress: circleWallet?.wallet_address || undefined,
      balance: circleBalance,
      currency: 'USDC',
      hasEthWallet: !!ethWallet?.wallet_address,
      hasCircleWallet: !!circleWallet?.circle_wallet_id,
      supportedChains: supportedChains,
      chainBalances: chainBalances
    };
    
    console.log('✅ [UnifiedWallet] Final wallet data:', {
      hasEth: result.hasEthWallet,
      hasCircle: result.hasCircleWallet,
      balance: result.balance,
      currency: result.currency
    });
    
    return result;
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
 * Update ETH address in user_wallets table
 * @param userId - User ID
 * @param ethAddress - Ethereum address
 */
export const updateEthAddress = async (userId: string, ethAddress: string): Promise<void> => {
  try {
    console.log('🔄 [UnifiedWallet] Updating ETH address for user:', userId);
    
    // Upsert ETH wallet in user_wallets table
    const { error } = await supabase
      .from('user_wallets')
      .upsert({
        user_id: userId,
        circle_wallet_id: `eth-${userId}`,
        wallet_address: ethAddress,
        wallet_state: 'LIVE',
        blockchain: 'ETHEREUM',
        account_type: 'EOA',
        custody_type: 'ENDUSER',
        description: `ETH wallet for user ${userId}`,
        balance_usdc: 0,
        balance_matic: 0,
        is_active: true
      }, {
        onConflict: 'user_id,wallet_address'
      });

    if (error) {
      console.error('❌ [UnifiedWallet] Error updating ETH wallet:', error);
      throw error;
    }
    
    console.log('✅ [UnifiedWallet] ETH wallet updated successfully');
  } catch (error) {
    console.error('❌ [UnifiedWallet] Error in updateEthAddress:', error);
    throw error;
  }
};

/**
 * Create multichain wallet for user on a specific blockchain
 * @param userId - User ID
 * @param blockchain - Target blockchain (POLYGON, BASE, ARBITRUM, etc.)
 * @param walletAddress - Wallet address on that chain
 * @param circleWalletId - Circle wallet ID if applicable
 */
export const createMultichainWallet = async (
  userId: string, 
  blockchain: string, 
  walletAddress: string, 
  circleWalletId?: string
): Promise<void> => {
  try {
    const chainConfig = SUPPORTED_CHAINS[blockchain.toUpperCase()];
    if (!chainConfig) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }

    console.log('🌐 [UnifiedWallet] Creating multichain wallet:', {
      userId,
      blockchain: chainConfig.name,
      address: walletAddress.substring(0, 10) + '...'
    });

    const { error } = await supabase
      .from('user_wallets')
      .upsert({
        user_id: userId,
        circle_wallet_id: circleWalletId || `${blockchain.toLowerCase()}-${userId}`,
        wallet_address: walletAddress,
        wallet_state: 'LIVE',
        blockchain: chainConfig.blockchain,
        account_type: 'EOA',
        custody_type: 'ENDUSER',
        description: `${chainConfig.name} wallet for user ${userId}`,
        balance_usdc: 0,
        balance_matic: 0,
        is_active: true
      }, {
        onConflict: 'user_id,wallet_address'
      });

    if (error) {
      throw error;
    }

    console.log('✅ [UnifiedWallet] Multichain wallet created successfully');
  } catch (error) {
    console.error('❌ [UnifiedWallet] Error creating multichain wallet:', error);
    throw error;
  }
};

/**
 * Get user's wallet for a specific blockchain
 * @param userId - User ID
 * @param blockchain - Target blockchain
 */
export const getUserWalletForChain = async (userId: string, blockchain: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('blockchain', blockchain.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error getting wallet for chain ${blockchain}:`, error);
    return null;
  }
};

/**
 * Get optimal payment chain based on user preferences and availability
 * @param buyerId - Buyer user ID
 * @param sellerId - Seller user ID
 * @param preferredChain - Optional preferred blockchain
 */
export const getOptimalPaymentChain = async (
  buyerId: string, 
  sellerId: string, 
  preferredChain?: string
): Promise<{ chain: string; config: ChainConfig } | null> => {
  try {
    // Get wallet data for both users
    const [buyerWallets, sellerWallets] = await Promise.all([
      getUserWalletData(buyerId),
      getUserWalletData(sellerId)
    ]);

    // Find common supported chains
    const commonChains = buyerWallets.supportedChains.filter(chain => 
      sellerWallets.supportedChains.includes(chain)
    );

    if (commonChains.length === 0) {
      console.warn('No common chains found between buyer and seller');
      return null;
    }

    // If preferred chain is available and both users support it, use it
    if (preferredChain && commonChains.includes(preferredChain.toUpperCase())) {
      const config = SUPPORTED_CHAINS[preferredChain.toUpperCase()];
      return { chain: preferredChain.toUpperCase(), config };
    }

    // Otherwise, prioritize based on gas costs and transaction speed
    const chainPriority = ['BASE', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'ETHEREUM'];
    for (const preferredChain of chainPriority) {
      if (commonChains.includes(preferredChain)) {
        const config = SUPPORTED_CHAINS[preferredChain];
        return { chain: preferredChain, config };
      }
    }

    // Fallback to first common chain
    const fallbackChain = commonChains[0];
    const config = SUPPORTED_CHAINS[fallbackChain];
    return { chain: fallbackChain, config };

  } catch (error) {
    console.error('Error finding optimal payment chain:', error);
    return null;
  }
};

/**
 * Get token configuration for multichain payments
 * @param blockchain - Target blockchain
 */
export const getChainTokenConfig = (blockchain: string): ChainConfig | null => {
  return SUPPORTED_CHAINS[blockchain.toUpperCase()] || null;
};