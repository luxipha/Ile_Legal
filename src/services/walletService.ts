import { supabase } from '../lib/supabase';
import { frontendWalletService } from './frontendWalletService';
import { SettingsService } from './settingsService';
import { User } from '../types';

/**
 * Create a wallet for a new user
 * @param user - The user object
 * @returns The created wallet data
 */
export const createUserWallet = async (user: User) => {
  try {
    console.log('🏦 [WalletService] Creating wallet for user:', user.id);
    
    // Check if user already has a Circle wallet in user_wallets table
    const { data: existingWallets, error: walletError } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, blockchain')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (walletError && walletError.code !== 'PGRST116') {
      console.log('📊 [WalletService] Wallet query error (continuing):', walletError);
    }
    
    // Check if user already has a Circle wallet
    const existingCircleWallet = existingWallets?.find(w => 
      w.blockchain !== 'ETHEREUM' && !w.circle_wallet_id.startsWith('eth-')
    );
    
    if (existingCircleWallet) {
      console.log('✅ [WalletService] User already has Circle wallet:', existingCircleWallet.circle_wallet_id);
      return { 
        walletId: existingCircleWallet.circle_wallet_id, 
        address: existingCircleWallet.wallet_address 
      };
    }
    
    console.log('🔨 [WalletService] Creating new Circle wallet...');
    
    // Create a new wallet using frontend service (with node-forge encryption)
    const walletResponse = await frontendWalletService.createWallet({
      userId: user.id,
      userType: user.role as 'buyer' | 'seller',
      name: user.name,
      email: user.email
    });
    
    if (!walletResponse.success || !walletResponse.wallet) {
      console.error('❌ [WalletService] Wallet creation failed:', walletResponse.error);
      throw new Error(`Frontend wallet creation failed: ${walletResponse.error || 'Unknown error'}`);
    }
    
    const wallet = walletResponse.wallet;
    
    console.log('✅ [WalletService] Circle wallet created successfully:', {
      walletId: wallet.circle_wallet_id,
      address: wallet.wallet_address?.substring(0, 10) + '...'
    });
    
    // Wallet is already stored in user_wallets by frontendWalletService
    return {
      walletId: wallet.circle_wallet_id,
      address: wallet.wallet_address
    };
  } catch (error) {
    console.error('❌ [WalletService] Error creating user wallet:', error);
    throw error;
  }
};

/**
 * Get wallet details for a user
 * @param userId - The user's ID
 * @returns Wallet details including balance
 */
export const getUserWallet = async (userId: string) => {
  try {
    console.log('💰 [WalletService] Getting wallet details for user:', userId);
    
    // Get all active wallets from unified user_wallets table
    const { data: wallets, error } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, blockchain, balance_usdc, balance_matic, wallet_state')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ [WalletService] Database error:', error);
      // Return mock wallet data when query fails
      return {
        walletId: `wallet_${userId}`,
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        balances: [
          { currency: 'USD', amount: '1250.00' }
        ],
        status: 'mock',
        type: 'mock'
      };
    }
    
    console.log('📊 [WalletService] Found wallets:', wallets?.length || 0);
    
    if (!wallets || wallets.length === 0) {
      console.log('⚠️  [WalletService] No wallets found for user');
      throw new Error('User does not have a wallet');
    }
    
    // Separate Circle and Ethereum wallets
    const circleWallet = wallets.find(w => 
      w.blockchain !== 'ETHEREUM' && !w.circle_wallet_id.startsWith('eth-')
    );
    const ethWallet = wallets.find(w => 
      w.blockchain === 'ETHEREUM' || w.circle_wallet_id.startsWith('eth-')
    );
    
    console.log('🔍 [WalletService] Wallet types found:', {
      hasCircle: !!circleWallet,
      hasEth: !!ethWallet
    });
    
    // Prefer Circle wallet if available
    if (circleWallet) {
      console.log('✅ [WalletService] Using Circle wallet:', circleWallet.circle_wallet_id);
      
      // Get wallet details from frontend wallet service for real-time data
      let walletData = null;
      try {
        walletData = await frontendWalletService.getUserWallet(userId);
      } catch (serviceError) {
        console.log('⚠️  [WalletService] Frontend service failed, using stored data:', serviceError);
      }
      
      return {
        walletId: circleWallet.circle_wallet_id,
        address: circleWallet.wallet_address,
        status: circleWallet.wallet_state,
        type: 'circle',
        balances: [
          { currency: 'USDC', amount: walletData?.balance_usdc?.toString() || circleWallet.balance_usdc?.toString() || '0.00' },
          { currency: 'MATIC', amount: walletData?.balance_matic?.toString() || circleWallet.balance_matic?.toString() || '0.00' }
        ],
        availableToWithdraw: walletData?.balance_usdc || circleWallet.balance_usdc || 0
      };
    }
    
    // Fallback to Ethereum wallet
    if (ethWallet) {
      console.log('✅ [WalletService] Using Ethereum wallet:', ethWallet.wallet_address);
      return {
        walletId: ethWallet.circle_wallet_id,
        address: ethWallet.wallet_address,
        balances: [
          { currency: 'ETH', amount: '0.00' }
        ],
        status: 'connected',
        type: 'metamask'
      };
    }
    
    throw new Error('No valid wallet found for user');
  } catch (error) {
    console.error('❌ [WalletService] Error getting user wallet:', error);
    throw error;
  }
};

/**
 * Get transaction history for a user's wallet
 * @param userId - The user's ID
 * @param pageSize - Number of transactions per page
 * @param pageNumber - Page number
 * @returns Transaction history
 */
export const getWalletTransactions = async (userId: string) => {
  try {
    console.log('📜 [WalletService] Getting transaction history for user:', userId);
    
    // Get Circle wallet ID from user_wallets table
    const { data: wallets, error } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, blockchain')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ [WalletService] Error fetching wallets:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Find Circle wallet for transactions
    const circleWallet = wallets?.find(w => 
      w.blockchain !== 'ETHEREUM' && !w.circle_wallet_id.startsWith('eth-')
    );
    
    if (!circleWallet) {
      console.log('⚠️  [WalletService] No Circle wallet found for transactions');
      return [];
    }
    
    console.log('🔍 [WalletService] Fetching transactions for wallet:', circleWallet.circle_wallet_id);
    
    // Get transaction history from frontend wallet service
    // TODO: Implement transaction history in frontendWalletService
    const transactions: any[] = [];
    
    console.log('📊 [WalletService] Transaction count:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('❌ [WalletService] Error getting wallet transactions:', error);
    throw error;
  }
};

/**
 * Create an escrow transaction for a gig
 * @param gigId - The gig ID
 * @param buyerId - The buyer's user ID
 * @param sellerId - The seller's user ID
 * @param amount - The amount to escrow (in USD)
 * @returns The created escrow transaction
 */
export const createEscrowTransaction = async (
  gigId: string,
  buyerId: string,
  sellerId: string,
  amount: number
) => {
  try {
    console.log('🔒 [WalletService] Creating escrow transaction for gig:', gigId);
    console.log('💰 [WalletService] Buyer:', buyerId, 'Seller:', sellerId, 'Amount:', amount);
    
    // Get buyer's wallet ID from user_wallets table
    const { data: buyerWallets, error: buyerError } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, blockchain')
      .eq('user_id', buyerId)
      .eq('is_active', true);
    
    if (buyerError) {
      console.error('❌ [WalletService] Error fetching buyer wallet:', buyerError);
      throw new Error(`Database error: ${buyerError.message}`);
    }
    
    // Find Circle wallet for the buyer
    const buyerCircleWallet = buyerWallets?.find(w => 
      w.blockchain !== 'ETHEREUM' && !w.circle_wallet_id.startsWith('eth-')
    );
    
    if (!buyerCircleWallet?.circle_wallet_id) {
      console.error('❌ [WalletService] Buyer does not have a Circle wallet');
      throw new Error('Buyer does not have a wallet');
    }
    
    console.log('✅ [WalletService] Found buyer wallet:', buyerCircleWallet.circle_wallet_id);
    
    // Get platform escrow wallet ID from settings
    const circleConfig = await SettingsService.getCircleConfig();
    const escrowWalletId = circleConfig?.escrowWalletId;
    
    if (!escrowWalletId) {
      throw new Error('Escrow wallet ID not configured. Please configure Circle payment settings.');
    }
    
    // Transfer funds from buyer to escrow wallet
    // TODO: Implement transfer functionality
    const transfer = { id: `transfer-${Date.now()}` };
    
    // Create escrow transaction record
    const { data: escrowTransaction, error } = await supabase
      .from('escrow_transactions')
      .insert({
        gig_id: gigId,
        buyer_id: buyerId,
        seller_id: sellerId,
        transaction_id: transfer.id,
        amount: amount,
        status: 'funded',
        release_condition: 'completion',
        metadata: {
          transfer_details: transfer
        }
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Record the transaction in wallet_transactions table
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: buyerId,
        transaction_id: transfer.id,
        transaction_type: 'escrow_funding',
        amount: amount,
        currency: 'USD',
        status: 'completed',
        source_id: buyerCircleWallet.circle_wallet_id,
        destination_id: escrowWalletId,
        metadata: {
          gig_id: gigId,
          escrow_transaction_id: escrowTransaction.id
        }
      });
    
    return escrowTransaction;
  } catch (error) {
    console.error('Error creating escrow transaction:', error);
    throw error;
  }
};

/**
 * Release funds from escrow to seller
 * @param escrowTransactionId - The escrow transaction ID
 * @returns The updated escrow transaction
 */
export const releaseEscrowFunds = async (escrowTransactionId: string) => {
  try {
    console.log('🔓 [WalletService] Releasing escrow funds for transaction:', escrowTransactionId);
    
    // Get escrow transaction details
    const { data: escrowTransaction } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowTransactionId)
      .single();
    
    if (!escrowTransaction) {
      console.error('❌ [WalletService] Escrow transaction not found:', escrowTransactionId);
      throw new Error('Escrow transaction not found');
    }
    
    console.log('📊 [WalletService] Escrow transaction details:', {
      id: escrowTransaction.id,
      amount: escrowTransaction.amount,
      status: escrowTransaction.status,
      sellerId: escrowTransaction.seller_id
    });
    
    // Get seller's wallet from user_wallets table
    const { data: sellerWallets, error: sellerError } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, blockchain')
      .eq('user_id', escrowTransaction.seller_id)
      .eq('is_active', true);
    
    if (sellerError) {
      console.error('❌ [WalletService] Error fetching seller wallet:', sellerError);
      throw new Error(`Database error: ${sellerError.message}`);
    }
    
    // Find Circle wallet for the seller
    const sellerCircleWallet = sellerWallets?.find(w => 
      w.blockchain !== 'ETHEREUM' && !w.circle_wallet_id.startsWith('eth-')
    );
    
    if (!sellerCircleWallet?.circle_wallet_id) {
      console.error('❌ [WalletService] Seller does not have a Circle wallet');
      throw new Error('Seller does not have a wallet');
    }
    
    console.log('✅ [WalletService] Found seller wallet:', sellerCircleWallet.circle_wallet_id);
    
    if (escrowTransaction.status !== 'funded') {
      throw new Error(`Cannot release funds from escrow with status: ${escrowTransaction.status}`);
    }
    
    // Get platform escrow wallet ID from settings
    const circleConfig = await SettingsService.getCircleConfig();
    const escrowWalletId = circleConfig?.escrowWalletId;
    
    if (!escrowWalletId) {
      throw new Error('Escrow wallet ID not configured. Please configure Circle payment settings.');
    }
    
    // Transfer funds from escrow wallet to seller
    // TODO: Implement transfer functionality  
    const transfer = { id: `release-${Date.now()}` };
    
    // Update escrow transaction status
    const { data: updatedEscrow, error } = await supabase
      .from('escrow_transactions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        metadata: {
          ...escrowTransaction.metadata,
          release_details: transfer
        }
      })
      .eq('id', escrowTransactionId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Record the transaction in wallet_transactions table
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: escrowTransaction.seller_id,
        transaction_id: transfer.id,
        transaction_type: 'escrow_release',
        amount: escrowTransaction.amount,
        currency: 'USD',
        status: 'completed',
        source_id: escrowWalletId,
        destination_id: sellerCircleWallet.circle_wallet_id,
        metadata: {
          gig_id: escrowTransaction.gig_id,
          escrow_transaction_id: escrowTransactionId
        }
      });
    
    return updatedEscrow;
  } catch (error) {
    console.error('Error releasing escrow funds:', error);
    throw error;
  }
};
