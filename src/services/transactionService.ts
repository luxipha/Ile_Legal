import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  user_id: string;
  gig_id?: string;
  type: 'payment_sent' | 'payment_received' | 'withdrawal' | 'deposit' | 'refund' | 'escrow_release';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  counterparty_id?: string;
  counterparty_name?: string;
  payment_method?: 'wallet' | 'paystack' | 'bank_transfer' | 'circle';
  transaction_hash?: string;
  external_transaction_id?: string;
  reference_number?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  bank_code?: string;
  routing_number?: string;
  account_type: 'checking' | 'savings';
  currency: string;
  is_default: boolean;
  is_verified: boolean;
  verification_data?: any;
  created_at: string;
  updated_at: string;
}

export interface EarningSummary {
  id: string;
  user_id: string;
  total_earned: number;
  total_withdrawn: number;
  available_balance: number;
  pending_earnings: number;
  this_month_earnings: number;
  last_month_earnings: number;
  gigs_completed: number;
  avg_gig_value: number;
  last_updated: string;
}

export interface CreateTransactionRequest {
  type: Transaction['type'];
  amount: number;
  description: string;
  gig_id?: string;
  counterparty_id?: string;
  counterparty_name?: string;
  payment_method?: Transaction['payment_method'];
  metadata?: any;
}

class TransactionService {
  /**
   * Get user transactions with pagination and filtering
   */
  async getUserTransactions(
    userId?: string,
    limit: number = 50,
    offset: number = 0,
    type?: Transaction['type']
  ): Promise<Transaction[]> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        userId = user.id;
      }

      const { data, error } = await supabase.rpc('get_user_transactions', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_type: type
      });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching user transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(request: CreateTransactionRequest): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase.rpc('create_transaction', {
        p_user_id: user.id,
        p_type: request.type,
        p_amount: request.amount,
        p_description: request.description,
        p_gig_id: request.gig_id,
        p_counterparty_id: request.counterparty_id,
        p_counterparty_name: request.counterparty_name,
        p_payment_method: request.payment_method,
        p_metadata: request.metadata || {}
      });

      if (error) throw error;

      return data; // Returns transaction ID
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string, 
    status: Transaction['status'],
    completedAt?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed' && completedAt) {
        updateData.completed_at = completedAt;
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (error) throw error;

      // If transaction completed, update earnings summary
      if (status === 'completed') {
        const { data: transaction } = await supabase
          .from('transactions')
          .select('user_id, counterparty_id')
          .eq('id', transactionId)
          .single();

        if (transaction) {
          await supabase.rpc('update_earnings_summary', {
            target_user_id: transaction.user_id
          });

          if (transaction.counterparty_id) {
            await supabase.rpc('update_earnings_summary', {
              target_user_id: transaction.counterparty_id
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error updating transaction status:', error);
      throw new Error(`Failed to update transaction status: ${error.message}`);
    }
  }

  /**
   * Get user's earning summary
   */
  async getEarningSummary(userId?: string): Promise<EarningSummary | null> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('earnings_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No earnings summary found, create one
          await supabase.rpc('update_earnings_summary', {
            target_user_id: userId
          });

          // Try to fetch again
          const { data: newData, error: newError } = await supabase
            .from('earnings_summary')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (newError) throw newError;
          return newData;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching earning summary:', error);
      throw new Error(`Failed to fetch earning summary: ${error.message}`);
    }
  }

  /**
   * Get user bank accounts
   */
  async getUserBankAccounts(userId?: string): Promise<BankAccount[]> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching bank accounts:', error);
      throw new Error(`Failed to fetch bank accounts: ${error.message}`);
    }
  }

  /**
   * Add a bank account
   */
  async addBankAccount(accountData: Omit<BankAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<BankAccount> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // If this is set as default, update other accounts
      if (accountData.is_default) {
        await supabase
          .from('bank_accounts')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          ...accountData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error adding bank account:', error);
      throw new Error(`Failed to add bank account: ${error.message}`);
    }
  }

  /**
   * Update bank account
   */
  async updateBankAccount(accountId: string, updates: Partial<BankAccount>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // If setting as default, update other accounts
      if (updates.is_default) {
        await supabase
          .from('bank_accounts')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', accountId);
      }

      const { error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating bank account:', error);
      throw new Error(`Failed to update bank account: ${error.message}`);
    }
  }

  /**
   * Delete bank account
   */
  async deleteBankAccount(accountId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting bank account:', error);
      throw new Error(`Failed to delete bank account: ${error.message}`);
    }
  }

  /**
   * Get transaction analytics
   */
  async getTransactionAnalytics(userId?: string, days: number = 30): Promise<any> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, created_at, status')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data for analytics
      const analytics = {
        totalTransactions: data?.length || 0,
        totalAmount: data?.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0) || 0,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        dailyAmounts: {} as Record<string, number>
      };

      data?.forEach(transaction => {
        // By type
        analytics.byType[transaction.type] = (analytics.byType[transaction.type] || 0) + 1;
        
        // By status
        analytics.byStatus[transaction.status] = (analytics.byStatus[transaction.status] || 0) + 1;
        
        // Daily amounts (only completed transactions)
        if (transaction.status === 'completed') {
          const date = new Date(transaction.created_at).toISOString().split('T')[0];
          analytics.dailyAmounts[date] = (analytics.dailyAmounts[date] || 0) + transaction.amount;
        }
      });

      return analytics;
    } catch (error: any) {
      console.error('Error fetching transaction analytics:', error);
      throw new Error(`Failed to fetch transaction analytics: ${error.message}`);
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService();

// Types are already exported above, no need to re-export

export default transactionService;