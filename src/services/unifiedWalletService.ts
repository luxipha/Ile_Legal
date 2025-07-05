import { supabase } from '../lib/supabase';
import { frontendWalletService } from './frontendWalletService';

export interface UnifiedWalletData {
  ethAddress?: string;
  circleWalletId?: string;
  circleWalletAddress?: string;
  filecoinAddress?: string;
  balance: string;
  usdcBalance: string;
  usdfcBalance: string;
  currency: string;
  hasEthWallet: boolean;
  hasCircleWallet: boolean;
  hasFilecoinWallet: boolean;
  supportedChains: string[];
  chainBalances: { [chain: string]: string };
  multiTokenBalances: { [token: string]: string };
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

// Supported blockchain configurations for multichain USDC and USDFC
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
  'FILECOIN': {
    name: 'Filecoin',
    chainId: '314',
    blockchain: 'FILECOIN',
    tokenId: 'usd-coin-filecoin',
    symbol: 'USDFC',
    rpcUrl: 'https://api.node.glif.io',
    explorerUrl: 'https://filfox.info',
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
    
    // Get all wallet data from unified user_wallets table (multichain support with USDFC)
    const { data: wallets, error: walletError } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, balance_usdc, blockchain, filecoin_address, usdfc_balance, supported_networks, network_balances')
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

    // Separate Circle, Ethereum, and Filecoin wallets, collect multichain data
    const circleWallet = wallets?.find(w => w.blockchain !== 'ETHEREUM' && w.blockchain !== 'FILECOIN' && !w.circle_wallet_id.startsWith('eth-'));
    const ethWallet = wallets?.find(w => w.blockchain === 'ETHEREUM' || w.circle_wallet_id.startsWith('eth-'));
    const filecoinWallet = wallets?.find(w => w.blockchain === 'FILECOIN');
    
    // Get supported chains from user's wallets (remove duplicates)
    const supportedChains = Array.from(new Set(wallets?.map(w => w.blockchain).filter(Boolean))) || [];
    
    // Extract USDFC balance from Filecoin wallet
    const usdfcBalance = filecoinWallet?.usdfc_balance || '0.00';
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

    // Validate Circle wallet ID format (should be a proper UUID)
    const isValidCircleId = circleWallet?.circle_wallet_id && 
                           !circleWallet.circle_wallet_id.startsWith('eth-') &&
                           !circleWallet.circle_wallet_id.includes('-demo-') &&
                           /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(circleWallet.circle_wallet_id);

    // For real Circle wallets, prioritize API data; for demo wallets, use stored balance
    let circleBalance = '0.00';
    
    if (isValidCircleId) {
      try {
        console.log('💰 [UnifiedWallet] Fetching real-time balance from Circle API for wallet:', circleWallet.circle_wallet_id);
        // Try to get real-time balance from Circle API (only for actual Circle wallets)
        const balanceData = await frontendWalletService.getWalletBalance(circleWallet.circle_wallet_id);
        if (balanceData?.tokenBalances?.length > 0) {
          const usdcBalance = balanceData.tokenBalances.find((b: any) => b.token.symbol === 'USDC');
          const newBalance = usdcBalance?.amount || '0.00';
          console.log('✅ [UnifiedWallet] Balance updated from API:', {
            fromAPI: newBalance,
            tokenCount: balanceData.tokenBalances.length,
            fullBalanceData: balanceData.tokenBalances
          });
          circleBalance = newBalance;
        } else {
          console.log('✅ [UnifiedWallet] Real Circle wallet has no token balances (empty wallet):', balanceData);
          circleBalance = '0.00'; // Real wallet with no tokens = $0.00
        }
      } catch (error) {
        console.log('⚠️  [UnifiedWallet] Could not fetch Circle wallet balance, defaulting to 0.00:', error);
        circleBalance = '0.00'; // API error for real wallet = $0.00
      }
    } else {
      // For demo wallets or invalid IDs, use stored balance
      circleBalance = circleWallet?.balance_usdc?.toString() || '0.00';
      if (circleWallet?.circle_wallet_id) {
        console.log('⚠️  [UnifiedWallet] Using stored demo balance for invalid wallet ID:', circleWallet.circle_wallet_id);
      } else {
        console.log('ℹ️  [UnifiedWallet] Using stored balance for ETH wallet or missing Circle wallet');
      }
    }

    const result = {
      ethAddress: ethWallet?.wallet_address || undefined,
      circleWalletId: circleWallet?.circle_wallet_id || undefined,
      circleWalletAddress: circleWallet?.wallet_address || undefined,
      filecoinAddress: filecoinWallet?.filecoin_address || undefined,
      balance: circleBalance, // Legacy field for backward compatibility
      usdcBalance: circleBalance,
      usdfcBalance: usdfcBalance.toString(),
      currency: 'USDC', // Primary currency for backward compatibility
      hasEthWallet: !!ethWallet?.wallet_address,
      hasCircleWallet: !!circleWallet?.circle_wallet_id,
      hasFilecoinWallet: !!filecoinWallet?.filecoin_address,
      supportedChains: supportedChains,
      chainBalances: chainBalances,
      multiTokenBalances: {
        'USDC': circleBalance,
        'USDFC': usdfcBalance.toString()
      }
    };
    
    console.log('✅ [UnifiedWallet] Final wallet data:', {
      hasEth: result.hasEthWallet,
      hasCircle: result.hasCircleWallet,
      hasFilecoin: result.hasFilecoinWallet,
      usdcBalance: result.usdcBalance,
      usdfcBalance: result.usdfcBalance,
      supportedChains: result.supportedChains,
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

    // Check if wallet already exists for this user and blockchain
    const { data: existingWallet } = await supabase
      .from('user_wallets')
      .select('id, circle_wallet_id')
      .eq('user_id', userId)
      .eq('blockchain', chainConfig.blockchain)
      .single();

    let error;
    if (existingWallet) {
      // Update existing wallet including the circle_wallet_id to reflect real vs demo status
      const updatedCircleWalletId = circleWalletId || existingWallet.circle_wallet_id;
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          circle_wallet_id: updatedCircleWalletId,
          wallet_address: walletAddress,
          wallet_state: 'LIVE',
          is_active: true,
          description: `${chainConfig.name} wallet for user ${userId}`,
          ...(chainConfig.blockchain === 'FILECOIN' && { filecoin_address: walletAddress })
        })
        .eq('id', existingWallet.id);
      error = updateError;
      console.log('✅ [UnifiedWallet] Updated existing wallet:', updatedCircleWalletId);
    } else {
      // Generate unique circle_wallet_id to avoid conflicts
      const uniqueCircleWalletId = circleWalletId || `${blockchain.toLowerCase()}-${userId}-${Date.now()}`;
      
      // Insert new wallet
      const { error: insertError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          circle_wallet_id: uniqueCircleWalletId,
          wallet_address: walletAddress,
          wallet_state: 'LIVE',
          blockchain: chainConfig.blockchain,
          account_type: 'EOA',
          custody_type: 'ENDUSER',
          description: `${chainConfig.name} wallet for user ${userId}`,
          balance_usdc: 0,
          balance_matic: 0,
          is_active: true,
          supported_networks: JSON.stringify([chainConfig.blockchain]),
          ...(chainConfig.blockchain === 'FILECOIN' && { 
            filecoin_address: walletAddress,
            usdfc_balance: 0
          })
        });
      error = insertError;
      console.log('✅ [UnifiedWallet] Created new wallet:', uniqueCircleWalletId);
    }

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
    // FILECOIN prioritized for USDFC native payments and storage integration
    const chainPriority = ['FILECOIN', 'BASE', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'ETHEREUM'];
    for (const preferredChain of chainPriority) {
      if (commonChains.includes(preferredChain)) {
        const config = SUPPORTED_CHAINS[preferredChain];
        console.log(`💎 [UnifiedWallet] Selected optimal chain: ${preferredChain} (${config.symbol})`);
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

/**
 * Set default wallet for user by storing preference
 * Since table doesn't have is_default field, we'll use a simpler approach
 */
export const setDefaultWallet = async (userId: string, walletId: string): Promise<void> => {
  try {
    // Get all user wallets to update their descriptions
    const { data: userWallets } = await supabase
      .from('user_wallets')
      .select('id, description')
      .eq('user_id', userId);

    if (userWallets) {
      // Update all wallets to remove (Default) and add it to selected one
      for (const wallet of userWallets) {
        const cleanDescription = wallet.description?.replace(' (Default)', '') || '';
        const newDescription = wallet.id === walletId 
          ? `${cleanDescription} (Default)` 
          : cleanDescription;

        await supabase
          .from('user_wallets')
          .update({ description: newDescription })
          .eq('id', wallet.id);
      }
    }
    
    console.log('✅ [UnifiedWallet] Default wallet updated:', walletId);
  } catch (error) {
    console.error('❌ [UnifiedWallet] Error setting default wallet:', error);
    throw error;
  }
};

/**
 * Get default wallet for user
 */
export const getDefaultWallet = async (userId: string): Promise<any | null> => {
  try {
    // Look for wallet with (Default) in description
    const { data: defaultWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .like('description', '%(Default)%')
      .single();

    if (defaultWallet) return defaultWallet;

    // If no default found, return first active wallet
    const { data: firstWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    return firstWallet;
  } catch (error) {
    console.error('Error getting default wallet:', error);
    return null;
  }
};

/**
 * Unified Wallet Service - Service instance for blockchain operations
 */
class UnifiedWalletService {
  /**
   * Get the active wallet for current user
   */
  async getActiveWallet(): Promise<{ 
    network: string; 
    address?: string; 
    balance?: string; 
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const walletData = await getUserWalletData(user.id);
      
      // Return most suitable wallet based on priority
      if (walletData.hasFilecoinWallet) {
        return {
          network: 'filecoin',
          address: walletData.filecoinAddress,
          balance: walletData.usdfcBalance
        };
      }
      
      if (walletData.hasEthWallet) {
        return {
          network: 'algorand', // For blockchain verification
          address: walletData.ethAddress,
          balance: walletData.usdcBalance
        };
      }
      
      if (walletData.hasCircleWallet) {
        return {
          network: 'algorand', // Default to algorand for verification
          address: walletData.circleWalletAddress,
          balance: walletData.usdcBalance
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active wallet:', error);
      return null;
    }
  }

  /**
   * Get wallet data for user
   */
  async getUserWalletData(userId: string) {
    return getUserWalletData(userId);
  }

  /**
   * Get primary wallet address
   */
  async getPrimaryWalletAddress(userId: string) {
    return getPrimaryWalletAddress(userId);
  }

  /**
   * Update ETH address
   */
  async updateEthAddress(userId: string, ethAddress: string) {
    return updateEthAddress(userId, ethAddress);
  }
}

export const unifiedWalletService = new UnifiedWalletService();