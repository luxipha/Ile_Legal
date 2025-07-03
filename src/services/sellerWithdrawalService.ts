import { supabase } from '../lib/supabase';
import { getUserWalletData } from './unifiedWalletService';

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  method: 'wallet' | 'bank';
  bankAccountId?: string;
  walletAddress?: string;
  description?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  withdrawalId: string;
  message: string;
  estimatedTime?: string;
}

export interface EarningsData {
  totalEarned: number;
  availableBalance: number;
  pendingEarnings: number;
  totalWithdrawn: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  gigsCompleted: number;
}

/**
 * Seller Withdrawal Service
 * Handles seller earnings withdrawals using existing tables:
 * - earnings_summary for balance tracking
 * - transactions for withdrawal records
 * - bank_accounts for bank withdrawal info
 * - user_wallets for crypto withdrawals
 */
export class SellerWithdrawalService {

  /**
   * Get seller's earnings summary and available balance
   */
  async getSellerEarnings(userId: string): Promise<EarningsData> {
    try {
      console.log('📊 [SellerWithdrawal] Getting earnings for user:', userId);

      // Get or create earnings summary
      let { data: earnings, error } = await supabase
        .from('earnings_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No earnings record exists, create one
        console.log('📊 [SellerWithdrawal] No earnings record found, creating new one');
        await supabase.rpc('update_earnings_summary', {
          target_user_id: userId
        });

        // Fetch the newly created record
        const { data: newEarnings, error: newError } = await supabase
          .from('earnings_summary')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (newError) {
          throw newError;
        }
        earnings = newEarnings;
      } else if (error) {
        throw error;
      }

      console.log('✅ [SellerWithdrawal] Earnings retrieved:', {
        totalEarned: earnings?.total_earned || 0,
        availableBalance: earnings?.available_balance || 0,
        pendingEarnings: earnings?.pending_earnings || 0
      });

      return {
        totalEarned: parseFloat(earnings?.total_earned || '0'),
        availableBalance: parseFloat(earnings?.available_balance || '0'),
        pendingEarnings: parseFloat(earnings?.pending_earnings || '0'),
        totalWithdrawn: parseFloat(earnings?.total_withdrawn || '0'),
        thisMonthEarnings: parseFloat(earnings?.this_month_earnings || '0'),
        lastMonthEarnings: parseFloat(earnings?.last_month_earnings || '0'),
        gigsCompleted: earnings?.gigs_completed || 0
      };
    } catch (error) {
      console.error('❌ [SellerWithdrawal] Error getting seller earnings:', error);
      throw error;
    }
  }

  /**
   * Get seller's bank accounts
   */
  async getSellerBankAccounts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [SellerWithdrawal] Error getting bank accounts:', error);
      throw error;
    }
  }

  /**
   * Process seller withdrawal request
   */
  async processWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      console.log('💸 [SellerWithdrawal] Processing withdrawal:', {
        userId: request.userId,
        amount: request.amount,
        method: request.method
      });

      // Check available balance
      const earnings = await this.getSellerEarnings(request.userId);
      if (earnings.availableBalance < request.amount) {
        throw new Error(`Insufficient balance. Available: $${earnings.availableBalance.toFixed(2)}, Requested: $${request.amount.toFixed(2)}`);
      }

      const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      if (request.method === 'bank') {
        return await this.processBankWithdrawal(request, withdrawalId);
      } else {
        return await this.processWalletWithdrawal(request, withdrawalId);
      }
    } catch (error) {
      console.error('❌ [SellerWithdrawal] Error processing withdrawal:', error);
      return {
        success: false,
        withdrawalId: '',
        message: `Withdrawal failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process bank withdrawal
   */
  private async processBankWithdrawal(
    request: WithdrawalRequest,
    withdrawalId: string
  ): Promise<WithdrawalResponse> {
    try {
      if (!request.bankAccountId) {
        throw new Error('Bank account ID required for bank withdrawal');
      }

      // Verify bank account belongs to user
      const { data: bankAccount, error: bankError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', request.bankAccountId)
        .eq('user_id', request.userId)
        .single();

      if (bankError || !bankAccount) {
        throw new Error('Bank account not found or does not belong to user');
      }

      // Create withdrawal transaction record
      const { data: transactionId, error: transactionError } = await supabase
        .rpc('create_transaction', {
          p_user_id: request.userId,
          p_type: 'withdrawal',
          p_amount: request.amount,
          p_description: request.description || `Bank withdrawal to ${bankAccount.bank_name} ****${bankAccount.account_number.slice(-4)}`,
          p_payment_method: 'bank_transfer',
          p_metadata: {
            withdrawal_id: withdrawalId,
            bank_account_id: request.bankAccountId,
            bank_name: bankAccount.bank_name,
            account_number: bankAccount.account_number,
            account_holder_name: bankAccount.account_holder_name,
            withdrawal_method: 'bank'
          }
        });

      if (transactionError) {
        throw new Error(`Failed to create transaction record: ${transactionError.message}`);
      }

      // Update earnings summary to reflect withdrawal
      await supabase.rpc('update_earnings_summary', {
        target_user_id: request.userId
      });

      console.log('✅ [SellerWithdrawal] Bank withdrawal processed:', withdrawalId);

      return {
        success: true,
        withdrawalId,
        message: `Bank withdrawal of $${request.amount.toFixed(2)} initiated to ${bankAccount.bank_name}`,
        estimatedTime: '1-3 business days'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process wallet withdrawal (crypto)
   */
  private async processWalletWithdrawal(
    request: WithdrawalRequest,
    withdrawalId: string
  ): Promise<WithdrawalResponse> {
    try {
      if (!request.walletAddress) {
        throw new Error('Wallet address required for wallet withdrawal');
      }

      // Get user's wallet data to find the platform wallet to withdraw from
      const walletData = await getUserWalletData(request.userId);
      if (!walletData.hasCircleWallet) {
        throw new Error('User does not have a Circle wallet for withdrawal');
      }

      // Process the actual blockchain withdrawal
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession.session) {
        throw new Error('Authentication required for wallet withdrawal');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pleuwhgjpjnkqvbemmhl.supabase.co';
      const transferResponse = await fetch(`${supabaseUrl}/functions/v1/wallet-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSession.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'transfer',
          walletId: walletData.circleWalletId,
          amount: request.amount.toString(),
          recipientAddress: request.walletAddress,
          tokenId: 'usd-coin', // Default to USDC for withdrawals
          metadata: {
            type: 'seller_withdrawal',
            withdrawalId: withdrawalId,
            userId: request.userId
          }
        })
      });

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json();
        throw new Error(`Wallet withdrawal failed: ${errorData.error || 'Unknown error'}`);
      }

      const transferData = await transferResponse.json();
      const transactionHash = transferData.data.transactionHash;

      // Create withdrawal transaction record
      const { data: transactionId, error: transactionError } = await supabase
        .rpc('create_transaction', {
          p_user_id: request.userId,
          p_type: 'withdrawal',
          p_amount: request.amount,
          p_description: request.description || `Crypto withdrawal to ${request.walletAddress.substring(0, 10)}...`,
          p_payment_method: 'wallet',
          p_metadata: {
            withdrawal_id: withdrawalId,
            wallet_address: request.walletAddress,
            transaction_hash: transactionHash,
            external_transaction_id: transferData.data.id,
            withdrawal_method: 'wallet',
            currency: 'USDC'
          }
        });

      if (transactionError) {
        throw new Error(`Failed to create transaction record: ${transactionError.message}`);
      }

      // Update earnings summary to reflect withdrawal
      await supabase.rpc('update_earnings_summary', {
        target_user_id: request.userId
      });

      console.log('✅ [SellerWithdrawal] Wallet withdrawal processed:', withdrawalId);

      return {
        success: true,
        withdrawalId,
        message: `Crypto withdrawal of $${request.amount.toFixed(2)} USDC sent to wallet`,
        estimatedTime: '5-15 minutes (blockchain confirmation)'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get seller's withdrawal history
   */
  async getWithdrawalHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_transactions', {
          p_user_id: userId,
          p_limit: limit,
          p_type: 'withdrawal'
        });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [SellerWithdrawal] Error getting withdrawal history:', error);
      throw error;
    }
  }

  /**
   * Add a new bank account for withdrawals
   */
  async addBankAccount(
    userId: string,
    accountHolderName: string,
    bankName: string,
    accountNumber: string,
    bankCode?: string,
    accountType: 'checking' | 'savings' = 'checking',
    isDefault: boolean = false
  ): Promise<{ success: boolean; bankAccountId?: string; message: string }> {
    try {
      // If this is set as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('bank_accounts')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: userId,
          account_holder_name: accountHolderName,
          bank_name: bankName,
          account_number: accountNumber,
          bank_code: bankCode,
          account_type: accountType,
          is_default: isDefault,
          currency: 'NGN' // Default to NGN for Nigerian banks
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        bankAccountId: data.id,
        message: 'Bank account added successfully'
      };
    } catch (error) {
      console.error('❌ [SellerWithdrawal] Error adding bank account:', error);
      return {
        success: false,
        message: `Failed to add bank account: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Remove a bank account
   */
  async removeBankAccount(userId: string, bankAccountId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', bankAccountId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Bank account removed successfully'
      };
    } catch (error) {
      console.error('❌ [SellerWithdrawal] Error removing bank account:', error);
      return {
        success: false,
        message: `Failed to remove bank account: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get pending earnings that will be available after work completion
   */
  async getPendingEarnings(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          gig:gig_id(title, description)
        `)
        .eq('user_id', userId)
        .eq('type', 'payment_received')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [SellerWithdrawal] Error getting pending earnings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sellerWithdrawalService = new SellerWithdrawalService();