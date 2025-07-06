import { supabase } from '../lib/supabase';
import { getUserWalletData, getOptimalPaymentChain, getChainTokenConfig } from './unifiedWalletService';
import { SettingsService } from './settingsService';
import { currencyConversionService, ConversionResult } from './currencyConversionService';
import { fvmContractService } from './fvmContractService';

export interface PaymentRequest {
  taskId: number;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  method: 'wallet' | 'paystack';
  description: string;
  // Phase 4: USDFC on Filecoin support
  preferredToken?: 'USDC' | 'USDFC';
  preferredChain?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string; // For Paystack redirects
  message: string;
  useInline?: boolean; // For Paystack inline payments
  inlineConfig?: PaystackInlineConfig; // Configuration for inline payment
  conversion?: ConversionResult; // Currency conversion details
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
    const debugId = `PAY_${Date.now()}`;
    console.log(`💳 [${debugId}] Starting payment processing:`, {
      taskId: paymentRequest.taskId,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      method: paymentRequest.method,
      buyerId: paymentRequest.buyerId,
      sellerId: paymentRequest.sellerId,
      timestamp: new Date().toISOString()
    });

    try {
      // Log payment attempt
      console.log(`📝 [${debugId}] Logging payment attempt...`);
      await this.logPaymentAttempt(paymentRequest);

      if (paymentRequest.method === 'wallet') {
        console.log(`🔐 [${debugId}] Processing wallet payment...`);
        return await this.processWalletPayment(paymentRequest);
      } else {
        console.log(`💰 [${debugId}] Processing Paystack payment...`);
        return await this.processPaystackPayment(paymentRequest);
      }
    } catch (error) {
      console.error(`❌ [${debugId}] Payment processing failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        paymentMethod: paymentRequest.method,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency
      });
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
      console.log('💳 [PaymentIntegration] Processing wallet payment:', {
        taskId: paymentRequest.taskId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        buyerId: paymentRequest.buyerId,
        sellerId: paymentRequest.sellerId
      });

      // Determine optimal payment chain for multichain support (Phase 4: with USDFC preference)
      const optimalChain = await getOptimalPaymentChain(
        paymentRequest.buyerId, 
        paymentRequest.sellerId, 
        paymentRequest.preferredChain,
        paymentRequest.preferredToken
      );
      console.log('🌐 [PaymentIntegration] Optimal payment chain:', {
        chain: optimalChain?.chain,
        token: optimalChain?.config.symbol,
        preferredChain: paymentRequest.preferredChain,
        preferredToken: paymentRequest.preferredToken
      });
      
      if (!optimalChain) {
        throw new Error('No compatible blockchain found between buyer and seller wallets');
      }
      
      // Get buyer's wallet data
      const walletData = await getUserWalletData(paymentRequest.buyerId);
      
      console.log('💰 [PaymentIntegration] Buyer wallet data:', {
        hasEth: walletData.hasEthWallet,
        hasCircle: walletData.hasCircleWallet,
        balance: walletData.balance,
        currency: walletData.currency
      });
      
      if (!walletData.hasEthWallet && !walletData.hasCircleWallet) {
        throw new Error('No wallet connected for this user');
      }

      // Handle currency conversion for NGN to USDC
      let actualAmount = paymentRequest.amount;
      let conversion: ConversionResult | undefined;
      let paymentCurrency = paymentRequest.currency;

      if (paymentRequest.currency === 'NGN') {
        console.log('💱 [PaymentIntegration] Converting NGN to USDC for wallet payment');
        // Convert NGN to USDC for wallet payment
        conversion = await currencyConversionService.convertNgnToUsdc(paymentRequest.amount);
        actualAmount = conversion.totalAmount; // Include conversion fee
        paymentCurrency = 'USDC';
        
        console.log('✅ [PaymentIntegration] Currency conversion completed:', {
          original: `₦${paymentRequest.amount.toLocaleString()}`,
          converted: `$${conversion.convertedAmount} USDC`,
          fee: `$${conversion.fee} USDC`,
          total: `$${conversion.totalAmount} USDC`,
          rate: `1 USDC = ₦${conversion.exchangeRate.toLocaleString()}`
        });
      }

      // Use appropriate balance based on selected token (Phase 4: USDFC support)
      const walletBalance = optimalChain.config.symbol === 'USDFC' 
        ? parseFloat(walletData.usdfcBalance) 
        : parseFloat(walletData.usdcBalance);
      
      console.log('💰 [PaymentIntegration] Balance check:', {
        selectedToken: optimalChain.config.symbol,
        walletBalance,
        requiredAmount: actualAmount,
        hasSufficientFunds: walletBalance >= actualAmount,
        usdcBalance: walletData.usdcBalance,
        usdfcBalance: walletData.usdfcBalance
      });
      
      if (walletBalance < actualAmount) {
        const tokenSymbol = optimalChain.config.symbol;
        const requiredBalance = currencyConversionService.formatCurrency(actualAmount, tokenSymbol);
        const currentBalance = currencyConversionService.formatCurrency(walletBalance, tokenSymbol);
        console.error('❌ [PaymentIntegration] Insufficient funds:', {
          required: requiredBalance,
          available: currentBalance,
          token: tokenSymbol,
          blockchain: optimalChain.chain
        });
        throw new Error(`Insufficient ${tokenSymbol} balance. Required: ${requiredBalance}, Available: ${currentBalance}`);
      }

      // Create payment record for escrow system (funds held until work completion)
      const transactionId = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Transfer funds from buyer to platform treasury (escrow)
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
          amount: actualAmount.toString(), // Use converted amount
          recipientAddress: await this.getPlatformTreasuryAddress(optimalChain.chain), // Platform treasury for selected chain
          tokenId: optimalChain.config.tokenId, // Use token ID for selected chain
          metadata: {
            type: 'escrow_payment',
            gigId: paymentRequest.taskId,
            sellerId: paymentRequest.sellerId,
            description: paymentRequest.description,
            originalAmount: paymentRequest.amount,
            originalCurrency: paymentRequest.currency,
            conversion: conversion,
            blockchain: optimalChain.chain,
            chainConfig: optimalChain.config
          }
        })
      });

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json();
        throw new Error(`Escrow transfer failed: ${errorData.error || 'Unknown error'}`);
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
          amount: actualAmount, // Store converted amount
          currency: paymentCurrency, // Store actual payment currency (USDC)
          blockchain_network: optimalChain.chain, // Add blockchain network support
          payment_token: optimalChain.config.symbol, // Add payment token (e.g., USDFC)
          is_usdfc_payment: optimalChain.config.symbol === 'USDFC', // Flag for USDFC payments
          original_amount: paymentRequest.amount, // Store original amount
          original_currency: paymentRequest.currency, // Store original currency (NGN)
          payment_method: 'wallet',
          status: 'escrowed',
          description: paymentRequest.description,
          escrow_status: 'held',
          wallet_address: optimalChain.config.symbol === 'USDFC' 
            ? walletData.filecoinAddress 
            : (walletData.ethAddress || walletData.circleWalletAddress),
          transaction_hash: realTransactionHash,
          external_transaction_id: transferData.data.id,
          blockchain_used: optimalChain.chain,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Update task status to payment escrowed
      await this.updateTaskPaymentStatus(paymentRequest.taskId, 'payment_escrowed');

      // Phase 4.2: Create FVM smart contract for USDFC payments
      if (optimalChain.config.symbol === 'USDFC') {
        console.log('🔗 [PaymentIntegration] Creating FVM escrow contract for USDFC payment...');
        const fvmResult = await fvmContractService.createEscrowContract(
          paymentRequest.taskId,
          paymentRequest.buyerId,
          paymentRequest.sellerId,
          actualAmount.toString(),
          {
            expectedSize: 100 * 1024 * 1024, // 100MB
            duration: 30 * 24 * 60 * 60, // 30 days
            replicationFactor: 3
          }
        );

        if (fvmResult.success) {
          console.log('✅ [PaymentIntegration] FVM contract created:', fvmResult.contractAddress);
          // Update payment record with FVM contract address
          await supabase
            .from('Payments')
            .update({
              fvm_contract_address: fvmResult.contractAddress,
              contract_transaction_id: fvmResult.transactionHash
            })
            .eq('id', transactionId);
        } else {
          console.warn('⚠️ [PaymentIntegration] FVM contract creation failed:', fvmResult.error);
        }
      }

      // Create escrow transaction record in transactions table
      await this.createEscrowTransaction(paymentRequest, actualAmount, paymentCurrency, transactionId);

      // Update seller's earnings summary to reflect pending earnings
      await this.updateSellerEarningsSummary(paymentRequest.sellerId, actualAmount, 'pending');

      return {
        success: true,
        transactionId,
        message: 'Payment escrowed successfully - funds will be released when work is completed',
        conversion: conversion
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
        // Force inline payment even without keys for testing
        const inlineConfig: PaystackInlineConfig = {
          publicKey: 'pk_test_your_test_key_here', // Use test key
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

        console.log('Using test Paystack inline payment (no keys configured in admin)');

        return {
          success: true,
          transactionId,
          useInline: true,
          inlineConfig,
          message: 'Test payment ready. Please complete payment in the popup.'
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
    console.log('🔍 [PaymentIntegration] Getting wallet address for seller:', sellerId);
    
    // Get all active wallets for the seller from unified user_wallets table
    const { data: wallets, error } = await supabase
      .from('user_wallets')
      .select('circle_wallet_id, wallet_address, blockchain, wallet_type')
      .eq('user_id', sellerId)
      .eq('is_active', true);

    console.log('📊 [PaymentIntegration] Found wallets:', wallets?.length || 0);
    
    if (error) {
      console.error('❌ [PaymentIntegration] Database error:', error);
      throw new Error(`Database error fetching seller wallet: ${error.message}`);
    }

    if (!wallets || wallets.length === 0) {
      console.error('❌ [PaymentIntegration] No wallets found for seller:', sellerId);
      throw new Error('Seller wallet address not found');
    }

    // Separate Circle and Ethereum wallets
    const circleWallet = wallets.find(w => 
      w.blockchain !== 'ETHEREUM' && !w.circle_wallet_id.startsWith('eth-')
    );
    const ethWallet = wallets.find(w => 
      w.blockchain === 'ETHEREUM' || w.circle_wallet_id.startsWith('eth-')
    );

    // Prefer Circle wallet address, fallback to ETH address
    const walletAddress = circleWallet?.wallet_address || ethWallet?.wallet_address;
    
    console.log('💰 [PaymentIntegration] Selected wallet:', {
      type: circleWallet ? 'Circle' : 'Ethereum',
      address: walletAddress?.substring(0, 10) + '...',
      hasCircle: !!circleWallet,
      hasEth: !!ethWallet
    });
    
    if (!walletAddress) {
      console.error('❌ [PaymentIntegration] No valid wallet address found for seller:', sellerId);
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

  /**
   * Get platform treasury wallet address for escrow (multichain support)
   */
  private async getPlatformTreasuryAddress(blockchain?: string): Promise<string> {
    // Treasury addresses for different blockchains
    const treasuryAddresses: { [key: string]: string } = {
      'ETHEREUM': '0x742d35cc6634c0532925a3b8d521e24c1c6f6e6c',
      'POLYGON': '0x742d35cc6634c0532925a3b8d521e24c1c6f6e6c',
      'BASE': '0x742d35cc6634c0532925a3b8d521e24c1c6f6e6c',
      'ARBITRUM': '0x742d35cc6634c0532925a3b8d521e24c1c6f6e6c',
      'OPTIMISM': '0x742d35cc6634c0532925a3b8d521e24c1c6f6e6c'
    };

    // In production, these would be different addresses for each chain
    // For now, using the same address across chains
    return treasuryAddresses[blockchain || 'ETHEREUM'] || treasuryAddresses['ETHEREUM'];
  }

  /**
   * Create escrow transaction record in transactions table
   */
  private async createEscrowTransaction(
    paymentRequest: PaymentRequest,
    amount: number,
    currency: string,
    paymentId: string
  ): Promise<void> {
    try {
      // Create transaction record for buyer (payment sent)
      await supabase.rpc('create_transaction', {
        p_user_id: paymentRequest.buyerId,
        p_type: 'payment_sent',
        p_amount: amount,
        p_description: `Payment for: ${paymentRequest.description}`,
        p_gig_id: paymentRequest.taskId.toString(),
        p_counterparty_id: paymentRequest.sellerId,
        p_payment_method: 'wallet',
        p_metadata: {
          payment_id: paymentId,
          escrow_status: 'held',
          currency: currency,
          original_amount: paymentRequest.amount,
          original_currency: paymentRequest.currency
        }
      });

      // Create pending earnings record for seller
      await supabase.rpc('create_transaction', {
        p_user_id: paymentRequest.sellerId,
        p_type: 'payment_received',
        p_amount: amount,
        p_description: `Pending payment for: ${paymentRequest.description}`,
        p_gig_id: paymentRequest.taskId.toString(),
        p_counterparty_id: paymentRequest.buyerId,
        p_payment_method: 'wallet',
        p_metadata: {
          payment_id: paymentId,
          escrow_status: 'pending_release',
          currency: currency,
          status: 'pending'
        }
      });

      console.log('✅ [PaymentIntegration] Escrow transaction records created');
    } catch (error) {
      console.error('❌ [PaymentIntegration] Error creating escrow transactions:', error);
      throw new Error(`Failed to create escrow transaction records: ${error}`);
    }
  }

  /**
   * Release escrowed funds to seller when work is completed
   */
  async releaseEscrowFunds(paymentId: string, completedBy: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔓 [PaymentIntegration] Releasing escrow funds for payment:', paymentId);

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('Payments')
        .select('*')
        .eq('id', paymentId)
        .eq('status', 'escrowed')
        .single();

      if (paymentError || !payment) {
        throw new Error('Escrowed payment not found');
      }

      // Get seller wallet address
      const sellerWalletAddress = await this.getSellerWalletAddress(payment.seller_id);

      // Transfer funds from platform treasury to seller
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession.session) {
        throw new Error('Authentication required for escrow release');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pleuwhgjpjnkqvbemmhl.supabase.co';
      const releaseResponse = await fetch(`${supabaseUrl}/functions/v1/wallet-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSession.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'transfer',
          walletId: 'platform_treasury', // Platform treasury wallet ID
          amount: payment.amount.toString(),
          recipientAddress: sellerWalletAddress,
          tokenId: this.getCurrencyTokenId(payment.currency),
          metadata: {
            type: 'escrow_release',
            paymentId: paymentId,
            gigId: payment.task_id,
            completedBy: completedBy
          }
        })
      });

      if (!releaseResponse.ok) {
        const errorData = await releaseResponse.json();
        throw new Error(`Escrow release failed: ${errorData.error || 'Unknown error'}`);
      }

      const releaseData = await releaseResponse.json();

      // Update payment status to completed
      await supabase
        .from('Payments')
        .update({
          status: 'completed',
          escrow_status: 'released',
          escrow_released_at: new Date().toISOString(),
          escrow_release_tx: releaseData.data.transactionHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      // Update task status to paid
      await this.updateTaskPaymentStatus(payment.task_id, 'completed');

      // Update transaction records
      await this.updateEscrowTransactionStatus(paymentId, 'completed');

      // Update seller's earnings summary to move from pending to available
      await this.updateSellerEarningsSummary(payment.seller_id, payment.amount, 'completed');

      console.log('✅ [PaymentIntegration] Escrow funds released successfully');
      return {
        success: true,
        message: 'Escrow funds released to seller successfully'
      };

    } catch (error) {
      console.error('❌ [PaymentIntegration] Error releasing escrow funds:', error);
      return {
        success: false,
        message: `Failed to release escrow funds: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update escrow transaction status when funds are released
   */
  private async updateEscrowTransactionStatus(paymentId: string, status: string): Promise<void> {
    try {
      // Update the pending seller transaction to completed
      const { error } = await supabase
        .from('transactions')
        .update({
          status: status,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('metadata->>payment_id', paymentId)
        .eq('type', 'payment_received');

      if (error) {
        console.error('Error updating escrow transaction status:', error);
      }

      // Trigger earnings summary update for the seller
      const { data: payment } = await supabase
        .from('Payments')
        .select('seller_id')
        .eq('id', paymentId)
        .single();

      if (payment) {
        await supabase.rpc('update_earnings_summary', {
          target_user_id: payment.seller_id
        });
      }
    } catch (error) {
      console.error('Error updating escrow transaction status:', error);
    }
  }

  /**
   * Update seller's earnings summary when payments are escrowed or completed
   */
  private async updateSellerEarningsSummary(
    sellerId: string, 
    amount: number, 
    status: 'pending' | 'completed'
  ): Promise<void> {
    try {
      console.log('📊 [PaymentIntegration] Updating earnings summary:', {
        sellerId,
        amount,
        status
      });

      // Use the database function to recalculate earnings
      await supabase.rpc('update_earnings_summary', {
        target_user_id: sellerId
      });

      console.log('✅ [PaymentIntegration] Earnings summary updated');
    } catch (error) {
      console.error('❌ [PaymentIntegration] Error updating earnings summary:', error);
      // Don't throw - earnings summary update failures shouldn't block payments
    }
  }

  /**
   * Mark gig as completed and trigger payment release
   */
  async markGigCompleted(gigId: number, completedBy: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('✅ [PaymentIntegration] Marking gig completed:', { gigId, completedBy });

      // Find escrowed payment for this gig
      const { data: payment, error: paymentError } = await supabase
        .from('Payments')
        .select('*')
        .eq('task_id', gigId)
        .eq('status', 'escrowed')
        .single();

      if (paymentError || !payment) {
        return {
          success: false,
          message: 'No escrowed payment found for this gig'
        };
      }

      // Release escrow funds
      const releaseResult = await this.releaseEscrowFunds(payment.id, completedBy);

      if (releaseResult.success) {
        // Update gig status to completed
        await supabase
          .from('Gigs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by: completedBy
          })
          .eq('id', gigId);

        return {
          success: true,
          message: 'Gig marked as completed and payment released to seller'
        };
      } else {
        return releaseResult;
      }
    } catch (error) {
      console.error('❌ [PaymentIntegration] Error marking gig completed:', error);
      return {
        success: false,
        message: `Failed to complete gig: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const paymentIntegrationService = new PaymentIntegrationService();