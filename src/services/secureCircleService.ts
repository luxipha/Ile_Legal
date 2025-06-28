/**
 * Secure Circle Service - Backend-Only API Integration
 * All Circle API calls are proxied through secure Edge Functions
 * No API keys exposed to frontend
 */

import { supabase } from '../lib/supabase';

export interface WalletBalance {
  tokenId: string;
  amount: string;
}

export interface WalletAddress {
  address: string;
  blockchain: string;
  addressIndex: number;
}

export interface TransferRequest {
  walletId: string;
  amount: string;
  recipientAddress: string;
  tokenId: string;
  metadata?: any;
}

export interface TransferResult {
  id: string;
  state: string;
  amount: string;
  tokenId: string;
  destinationAddress: string;
  transactionHash?: string;
}

export interface WalletTransaction {
  id: string;
  blockchain: string;
  tokenId: string;
  walletId: string;
  sourceAddress: string;
  destinationAddress: string;
  transactionType: string;
  state: string;
  amount: string;
  transactionHash: string;
  blockHeight: number;
  blockHash: string;
  createDate: string;
  updateDate: string;
}

class SecureCircleService {
  private readonly functionsUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured');
    }
    this.functionsUrl = `${supabaseUrl}/functions/v1`;
  }

  /**
   * Get authentication header for API calls
   */
  private async getAuthHeader(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('No valid authentication session');
    }

    return `Bearer ${session.access_token}`;
  }

  /**
   * Make secure API call to Edge Function
   */
  private async makeSecureCall(operation: string, params: any = {}): Promise<any> {
    try {
      const authHeader = await this.getAuthHeader();

      const response = await fetch(`${this.functionsUrl}/wallet-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          operation,
          ...params
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || `HTTP ${response.status}`);
      }

      return data.data;

    } catch (error: any) {
      console.error(`Secure Circle API call failed (${operation}):`, error);
      throw new Error(`Circle API operation failed: ${error.message}`);
    }
  }

  /**
   * Get wallet balance securely via backend
   */
  async getWalletBalance(walletId: string): Promise<WalletBalance[]> {
    try {
      const result = await this.makeSecureCall('get_balance', { walletId });
      return result.wallet?.balances || [];
    } catch (error: any) {
      console.error('Error getting wallet balance:', error);
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  /**
   * Get wallet addresses securely via backend
   */
  async getWalletAddresses(walletId: string): Promise<WalletAddress[]> {
    try {
      const result = await this.makeSecureCall('get_address', { walletId });
      return result.addresses || [];
    } catch (error: any) {
      console.error('Error getting wallet addresses:', error);
      throw new Error(`Failed to get wallet addresses: ${error.message}`);
    }
  }

  /**
   * Create new wallet address securely via backend
   */
  async createWalletAddress(walletId: string): Promise<WalletAddress> {
    try {
      const result = await this.makeSecureCall('create_address', { walletId });
      return result;
    } catch (error: any) {
      console.error('Error creating wallet address:', error);
      throw new Error(`Failed to create wallet address: ${error.message}`);
    }
  }

  /**
   * Initiate transfer securely via backend
   */
  async initiateTransfer(transferRequest: TransferRequest): Promise<TransferResult> {
    try {
      const result = await this.makeSecureCall('transfer', transferRequest);
      return result;
    } catch (error: any) {
      console.error('Error initiating transfer:', error);
      throw new Error(`Failed to initiate transfer: ${error.message}`);
    }
  }

  /**
   * Get wallet transactions securely via backend
   */
  async getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
    try {
      const result = await this.makeSecureCall('get_transactions', { walletId });
      return result.transactions || [];
    } catch (error: any) {
      console.error('Error getting wallet transactions:', error);
      throw new Error(`Failed to get wallet transactions: ${error.message}`);
    }
  }

  /**
   * Get user's wallet information from local database
   */
  async getUserWallet(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No wallet found
        }
        throw error;
      }

      return data;

    } catch (error: any) {
      console.error('Error getting user wallet:', error);
      throw new Error(`Failed to get user wallet: ${error.message}`);
    }
  }

  /**
   * Check wallet status and sync with Circle API
   */
  async syncWalletStatus(walletId: string): Promise<any> {
    try {
      // Get latest status from Circle API via backend
      const circleWallet = await this.makeSecureCall('get_balance', { walletId });
      
      // Update local database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('user_wallets')
        .update({
          wallet_state: circleWallet.wallet?.state || 'UNKNOWN',
          updated_at: new Date().toISOString()
        })
        .eq('circle_wallet_id', walletId)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Failed to update local wallet status:', error);
      }

      return circleWallet;

    } catch (error: any) {
      console.error('Error syncing wallet status:', error);
      throw new Error(`Failed to sync wallet status: ${error.message}`);
    }
  }
}

// Export singleton instance
export const secureCircleService = new SecureCircleService();


// Replace the old Circle SDK with secure backend calls
export const circleSdk = {
  // Legacy compatibility - redirect to secure service
  createWallet: () => {
    throw new Error('createWallet is now handled by backend service during user registration');
  },
  
  generateWalletAddress: async (walletId: string) => {
    const addresses = await secureCircleService.getWalletAddresses(walletId);
    if (addresses.length === 0) {
      const newAddress = await secureCircleService.createWalletAddress(walletId);
      return { address: newAddress.address };
    }
    return { address: addresses[0].address };
  },
  
  getWalletBalance: async (walletId: string) => {
    const balances = await secureCircleService.getWalletBalance(walletId);
    return { balances };
  },
  
  transferFunds: async (transferRequest: TransferRequest) => {
    return await secureCircleService.initiateTransfer(transferRequest);
  },
  
  getTransactionHistory: async (walletId: string) => {
    const transactions = await secureCircleService.getWalletTransactions(walletId);
    return { transactions };
  }
};

export default secureCircleService;