import { supabase } from '../lib/supabase';

export interface BackendWalletRequest {
  userId: string;
  userType: 'buyer' | 'seller';
  name: string;
  email: string;
}

export interface WalletInfo {
  id: string;
  user_id: string;
  circle_wallet_id: string;
  wallet_address: string | null;
  wallet_state: string;
  blockchain: string;
  account_type: string;
  custody_type: string;
  wallet_set_id: string | null;
  description: string | null;
  balance_usdc: number;
  balance_matic: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendWalletResponse {
  success: boolean;
  wallet?: WalletInfo;
  circle_wallet?: any;
  message?: string;
  error?: string;
  details?: string;
}

class BackendWalletService {
  private readonly functionsUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured');
    }
    this.functionsUrl = `${supabaseUrl}/functions/v1`;
  }

  /**
   * Create a new wallet using backend Edge Function
   */
  async createWallet(request: BackendWalletRequest): Promise<BackendWalletResponse> {
    try {
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No valid authentication session');
      }

      console.log('Creating wallet via backend for user:', request.userId);

      const response = await fetch(`${this.functionsUrl}/create-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      const data: BackendWalletResponse = await response.json();

      if (!response.ok) {
        console.error('Backend wallet creation failed:', data);
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('Backend wallet creation successful:', data);
      return data;

    } catch (error: any) {
      console.error('Wallet creation error:', error);
      return {
        success: false,
        error: 'Failed to create wallet',
        details: error.message
      };
    }
  }

  /**
   * Get user's wallet information from database
   */
  async getUserWallet(userId: string): Promise<WalletInfo | null> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No wallet found
          return null;
        }
        throw error;
      }

      return data as WalletInfo;

    } catch (error: any) {
      console.error('Error fetching user wallet:', error);
      throw new Error(`Failed to fetch wallet: ${error.message}`);
    }
  }

  /**
   * Update wallet balance (called by webhooks or balance sync)
   */
  async updateWalletBalance(
    walletId: string, 
    balanceUsdc: number, 
    balanceMatic: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_wallets')
        .update({
          balance_usdc: balanceUsdc,
          balance_matic: balanceMatic,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      if (error) {
        throw error;
      }

      console.log(`Updated wallet ${walletId} balance: USDC=${balanceUsdc}, MATIC=${balanceMatic}`);
      return true;

    } catch (error: any) {
      console.error('Error updating wallet balance:', error);
      throw new Error(`Failed to update balance: ${error.message}`);
    }
  }

  /**
   * Get wallet activity/transaction history
   */
  async getWalletActivity(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .in('activity_type', ['wallet_created', 'wallet_funded', 'payment_sent', 'payment_received'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error: any) {
      console.error('Error fetching wallet activity:', error);
      throw new Error(`Failed to fetch activity: ${error.message}`);
    }
  }

  /**
   * Check if wallet exists for user
   */
  async hasWallet(userId: string): Promise<boolean> {
    try {
      const wallet = await this.getUserWallet(userId);
      return wallet !== null;
    } catch (error) {
      console.error('Error checking wallet existence:', error);
      return false;
    }
  }

  /**
   * Log wallet activity
   */
  async logActivity(
    userId: string,
    activityType: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          description,
          metadata: metadata || null,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

    } catch (error: any) {
      console.error('Error logging wallet activity:', error);
      // Don't throw - activity logging is non-critical
    }
  }
}

// Export singleton instance
export const backendWalletService = new BackendWalletService();

// Export types for use in components
export type { BackendWalletRequest, WalletInfo, BackendWalletResponse };