import { supabase } from '../lib/supabase';
import { getUserWalletData } from './unifiedWalletService';
import { SettingsService } from './settingsService';

export interface PaymentRequest {
  taskId: number;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  method: 'wallet' | 'paystack';
  description: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string; // For Paystack redirects
  message: string;
  useInline?: boolean; // For Paystack inline payments
  inlineConfig?: PaystackInlineConfig; // Configuration for inline payment
}

export interface PaystackInlineConfig {
  publicKey: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  metadata: any;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  method: 'bank' | 'wallet';
  bankAccountId?: string;
  walletAddress?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  withdrawalId: string;
  message: string;
  estimatedTime?: string;
}

class PaymentIntegrationService {
  /**
   * Process payment using selected method (wallet or Paystack)
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Log payment attempt
      await this.logPaymentAttempt(paymentRequest);

      if (paymentRequest.method === 'wallet') {
        return await this.processWalletPayment(paymentRequest);
      } else {
        return await this.processPaystackPayment(paymentRequest);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        transactionId: '',
        message: `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process wallet payment (crypto)
   */
  private async processWalletPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Get buyer's wallet data
      const walletData = await getUserWalletData(paymentRequest.buyerId);
      
      if (!walletData.hasEthWallet && !walletData.hasCircleWallet) {
        throw new Error('No wallet connected for this user');
      }

      const walletBalance = parseFloat(walletData.balance);
      if (walletBalance < paymentRequest.amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Create payment record with real blockchain transaction
      const transactionId = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Call the backend Edge Function for real blockchain transaction
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession.session) {
        throw new Error('Authentication required for wallet operations');
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
          amount: paymentRequest.amount.toString(),
          recipientAddress: await this.getSellerWalletAddress(paymentRequest.sellerId),
          tokenId: this.getCurrencyTokenId(paymentRequest.currency),
          metadata: {
            gigId: paymentRequest.taskId,
            description: paymentRequest.description
          }
        })
      });

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json();
        throw new Error(`Wallet transfer failed: ${errorData.error || 'Unknown error'}`);
      }

      const transferData = await transferResponse.json();
      const realTransactionHash = transferData.data.transactionHash;

      const { error } = await supabase
        .from('Payments')
        .insert({
          id: transactionId,
          task_id: paymentRequest.taskId,
          buyer_id: paymentRequest.buyerId,
          seller_id: paymentRequest.sellerId,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          payment_method: 'wallet',
          status: 'completed',
          description: paymentRequest.description,
          wallet_address: walletData.ethAddress || walletData.circleWalletAddress,
          transaction_hash: realTransactionHash,
          external_transaction_id: transferData.data.id,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Update task status to paid
      await this.updateTaskPaymentStatus(paymentRequest.taskId, 'paid');

      return {
        success: true,
        transactionId,
        message: 'Wallet payment completed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process Paystack payment
   */
  private async processPaystackPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Get Paystack configuration from admin settings
      const paystackConfig = await this.getPaystackConfig();
      
      console.log('Paystack config loaded:', {
        enabled: paystackConfig.enabled,
        hasPublicKey: !!paystackConfig.publicKey,
        hasSecretKey: !!paystackConfig.secretKey
      });
      
      if (!paystackConfig.enabled) {
        throw new Error('Paystack payment method is not enabled. Please enable Paystack in Admin Settings → Payment Processing.');
      }

      // Create payment record with pending status
      const transactionId = `paystack_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const { error } = await supabase
        .from('Payments')
        .insert({
          id: transactionId,
          task_id: paymentRequest.taskId,
          buyer_id: paymentRequest.buyerId,
          seller_id: paymentRequest.sellerId,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          payment_method: 'paystack',
          status: 'pending',
          description: paymentRequest.description,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Use Paystack Inline for better UX
      if (paystackConfig.publicKey && paystackConfig.secretKey) {
        // Return inline configuration instead of redirect URL
        const inlineConfig: PaystackInlineConfig = {
          publicKey: paystackConfig.publicKey,
          email: 'buyer@ile-legal.com', // TODO: Get buyer's actual email from user profile
          amount: paymentRequest.amount * 100, // Paystack expects amount in kobo
          currency: paymentRequest.currency,
          reference: transactionId,
          metadata: {
            task_id: paymentRequest.taskId,
            buyer_id: paymentRequest.buyerId,
            seller_id: paymentRequest.sellerId,
            description: paymentRequest.description
          }
        };

        console.log('Paystack inline payment configured:', {
          publicKey: paystackConfig.publicKey?.substring(0, 8) + '...',
          amount: inlineConfig.amount,
          reference: transactionId
        });

        return {
          success: true,
          transactionId,
          useInline: true,
          inlineConfig,
          message: 'Payment ready. Please complete payment in the popup.'
        };
      } else {
        // Mock Paystack for testing without keys
        const paymentUrl = `https://paystack-demo.ile-legal.com/pay?amount=${paymentRequest.amount}&ref=${transactionId}`;
        console.log('Mock Paystack payment initialized (no keys configured)');
        
        return {
          success: true,
          transactionId,
          paymentUrl,
          message: 'Demo Paystack payment initialized (configure keys for real payments).'
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process withdrawal request
   */
  async processWithdrawal(withdrawalRequest: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      if (withdrawalRequest.method === 'bank') {
        return await this.processBankWithdrawal(withdrawalRequest, withdrawalId);
      } else {
        return await this.processWalletWithdrawal(withdrawalRequest, withdrawalId);
      }
    } catch (error) {
      console.error('Withdrawal processing error:', error);
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
    withdrawalRequest: WithdrawalRequest,
    withdrawalId: string
  ): Promise<WithdrawalResponse> {
    try {
      const { error } = await supabase
        .from('Withdrawals')
        .insert({
          id: withdrawalId,
          user_id: withdrawalRequest.userId,
          amount: withdrawalRequest.amount,
          method: 'bank',
          bank_account_id: withdrawalRequest.bankAccountId,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        withdrawalId,
        message: 'Bank withdrawal request submitted successfully',
        estimatedTime: '1-3 business days'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process wallet withdrawal using real blockchain transaction
   */
  private async processWalletWithdrawal(
    withdrawalRequest: WithdrawalRequest,
    withdrawalId: string
  ): Promise<WithdrawalResponse> {
    try {
      // Get user's wallet data
      const walletData = await getUserWalletData(withdrawalRequest.userId);
      
      if (!walletData.hasCircleWallet) {
        throw new Error('User does not have a Circle wallet for withdrawal');
      }

      // Call the backend Edge Function for real withdrawal transaction
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession.session) {
        throw new Error('Authentication required for withdrawal');
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
          amount: withdrawalRequest.amount.toString(),
          recipientAddress: withdrawalRequest.walletAddress,
          tokenId: 'usd-coin', // Default to USDC for withdrawals
          metadata: {
            type: 'withdrawal',
            withdrawalId: withdrawalId
          }
        })
      });

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json();
        throw new Error(`Withdrawal transfer failed: ${errorData.error || 'Unknown error'}`);
      }

      const transferData = await transferResponse.json();
      const realTransactionHash = transferData.data.transactionHash;

      const { error } = await supabase
        .from('Withdrawals')
        .insert({
          id: withdrawalId,
          user_id: withdrawalRequest.userId,
          amount: withdrawalRequest.amount,
          method: 'wallet',
          wallet_address: withdrawalRequest.walletAddress,
          status: 'completed',
          transaction_hash: realTransactionHash,
          external_transaction_id: transferData.data.id,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        withdrawalId,
        message: 'Wallet withdrawal completed successfully',
        estimatedTime: '5-15 minutes (blockchain confirmation)'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('Payments')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) {
        throw new Error(`Error fetching payment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Update payment status after successful payment
   */
  async updatePaymentStatus(transactionId: string, status: string, transactionData?: any): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add transaction details if provided
      if (transactionData) {
        updateData.paystack_reference = transactionData.reference;
        updateData.transaction_hash = transactionData.trans || transactionData.transaction;
      }

      const { error } = await supabase
        .from('Payments')
        .update(updateData)
        .eq('id', transactionId);

      if (error) {
        throw new Error(`Error updating payment status: ${error.message}`);
      }

      console.log('Payment status updated successfully:', { transactionId, status });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(withdrawalId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('Withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (error) {
        throw new Error(`Error fetching withdrawal: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting withdrawal status:', error);
      throw error;
    }
  }

  /**
   * Update task payment status
   */
  private async updateTaskPaymentStatus(taskId: number, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('Gigs')
        .update({ payment_status: status })
        .eq('id', taskId);

      if (error) {
        throw new Error(`Error updating task status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating task payment status:', error);
      throw error;
    }
  }

  /**
   * Log payment attempt for audit
   */
  private async logPaymentAttempt(paymentRequest: PaymentRequest): Promise<void> {
    try {
      await supabase
        .from('PaymentLogs')
        .insert({
          task_id: paymentRequest.taskId,
          buyer_id: paymentRequest.buyerId,
          amount: paymentRequest.amount,
          method: paymentRequest.method,
          attempt_time: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log payment attempt:', error);
      // Don't throw here as logging failures shouldn't block payments
    }
  }

  /**
   * Get Paystack configuration from admin settings
   */
  private async getPaystackConfig(): Promise<{ enabled: boolean; publicKey?: string; secretKey?: string }> {
    try {
      const settings = await SettingsService.getSettings();
      console.log('All payment providers in settings:', settings.paymentProviders);
      
      const paystackProvider = settings.paymentProviders.find(p => p.name === 'Paystack');
      
      if (!paystackProvider) {
        console.warn('Paystack provider not found in settings. Available providers:', 
          settings.paymentProviders.map(p => p.name));
        return { enabled: false };
      }

      console.log('Found Paystack provider:', paystackProvider);
      
      return {
        enabled: paystackProvider.enabled,
        publicKey: paystackProvider.apiKey,
        secretKey: paystackProvider.secretKey
      };
    } catch (error) {
      console.warn('Failed to get Paystack config:', error);
      return { enabled: false };
    }
  }

  /**
   * Get seller's wallet address for transfers
   */
  private async getSellerWalletAddress(sellerId: string): Promise<string> {
    const { data: sellerProfile, error } = await supabase
      .from('Profiles')
      .select('circle_wallet_address, eth_address')
      .eq('id', sellerId)
      .single();

    if (error || !sellerProfile) {
      throw new Error('Seller wallet address not found');
    }

    // Prefer Circle wallet address, fallback to ETH address
    const walletAddress = sellerProfile.circle_wallet_address || sellerProfile.eth_address;
    
    if (!walletAddress) {
      throw new Error('Seller does not have a valid wallet address');
    }

    return walletAddress;
  }

  /**
   * Get token ID for currency
   */
  private getCurrencyTokenId(currency: string): string {
    const tokenMap: { [key: string]: string } = {
      'USD': 'usd-coin', // USDC
      'USDC': 'usd-coin',
      'ETH': 'ethereum',
      'MATIC': 'matic-network'
    };

    return tokenMap[currency.toUpperCase()] || 'usd-coin';
  }
}

export const paymentIntegrationService = new PaymentIntegrationService();