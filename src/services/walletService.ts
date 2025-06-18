import { supabase } from '../lib/supabase';
import * as circleApi from './circleApi';
import { User } from '../types';

/**
 * Create a wallet for a new user
 * @param user - The user object
 * @returns The created wallet data
 */
export const createUserWallet = async (user: User) => {
  try {
    // Check if user already has a wallet
    const { data: profile } = await supabase
      .from('profiles')
      .select('circle_wallet_id, circle_wallet_address')
      .eq('id', user.id)
      .single();
    
    if (profile?.circle_wallet_id) {
      console.log('User already has a wallet:', profile.circle_wallet_id);
      return { walletId: profile.circle_wallet_id, address: profile.circle_wallet_address };
    }
    
    // Create a new wallet in Circle
    const walletDescription = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} wallet for ${user.name}`;
    const wallet = await circleApi.createWallet(user.id, walletDescription);
    
    // Generate a wallet address
    const addressData = await circleApi.generateWalletAddress(wallet.walletId);
    
    // Update user profile with wallet information
    await supabase
      .from('profiles')
      .update({
        circle_wallet_id: wallet.walletId,
        circle_wallet_address: addressData.address,
        circle_wallet_created_at: new Date().toISOString(),
        circle_wallet_status: 'active'
      })
      .eq('id', user.id);
    
    return {
      walletId: wallet.walletId,
      address: addressData.address
    };
  } catch (error) {
    console.error('Error creating user wallet:', error);
    
    // Update user profile with error status
    await supabase
      .from('profiles')
      .update({
        circle_wallet_status: 'failed'
      })
      .eq('id', user.id);
    
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
    // Get wallet ID from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('circle_wallet_id, circle_wallet_address, circle_wallet_status')
      .eq('id', userId)
      .single();
    
    if (!profile?.circle_wallet_id || profile.circle_wallet_status !== 'active') {
      throw new Error('User does not have an active wallet');
    }
    
    // Get wallet details from Circle
    const wallet = await circleApi.getWallet(profile.circle_wallet_id);
    
    // Get wallet balance
    const balance = await circleApi.getWalletBalance(profile.circle_wallet_id);
    
    return {
      walletId: profile.circle_wallet_id,
      address: profile.circle_wallet_address,
      status: wallet.status,
      balances: balance.balances,
      availableToWithdraw: balance.availableToWithdraw
    };
  } catch (error) {
    console.error('Error getting user wallet:', error);
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
export const getWalletTransactions = async (userId: string, pageSize = 20, pageNumber = 1) => {
  try {
    // Get wallet ID from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('circle_wallet_id')
      .eq('id', userId)
      .single();
    
    if (!profile?.circle_wallet_id) {
      throw new Error('User does not have a wallet');
    }
    
    // Get transaction history from Circle
    const transactions = await circleApi.getTransactionHistory(
      profile.circle_wallet_id,
      pageSize,
      pageNumber
    );
    
    return transactions;
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
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
    // Get buyer's wallet ID
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('circle_wallet_id')
      .eq('id', buyerId)
      .single();
    
    if (!buyerProfile?.circle_wallet_id) {
      throw new Error('Buyer does not have a wallet');
    }
    
    // Get platform escrow wallet ID (this would be a separate wallet managed by the platform)
    // For now, we'll use a placeholder - in production, this would be a real wallet ID
    const escrowWalletId = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CIRCLE_ESCROW_WALLET_ID : process.env.VITE_CIRCLE_ESCROW_WALLET_ID) || 'escrow-wallet-placeholder';
    
    // Transfer funds from buyer to escrow wallet
    const transfer = await circleApi.transferBetweenWallets(
      buyerProfile.circle_wallet_id,
      escrowWalletId,
      amount * 100, // Convert to cents
      `escrow-${gigId}-${Date.now()}`
    );
    
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
        source_id: buyerProfile.circle_wallet_id,
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
    // Get escrow transaction details
    const { data: escrowTransaction } = await supabase
      .from('escrow_transactions')
      .select('*, buyer:buyer_id(circle_wallet_id), seller:seller_id(circle_wallet_id)')
      .eq('id', escrowTransactionId)
      .single();
    
    if (!escrowTransaction) {
      throw new Error('Escrow transaction not found');
    }
    
    if (escrowTransaction.status !== 'funded') {
      throw new Error(`Cannot release funds from escrow with status: ${escrowTransaction.status}`);
    }
    
    // Get platform escrow wallet ID
    const escrowWalletId = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CIRCLE_ESCROW_WALLET_ID : process.env.VITE_CIRCLE_ESCROW_WALLET_ID) || 'escrow-wallet-placeholder';
    
    // Transfer funds from escrow wallet to seller
    const transfer = await circleApi.transferBetweenWallets(
      escrowWalletId,
      escrowTransaction.seller.circle_wallet_id,
      escrowTransaction.amount * 100, // Convert to cents
      `release-${escrowTransactionId}-${Date.now()}`
    );
    
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
        destination_id: escrowTransaction.seller.circle_wallet_id,
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
