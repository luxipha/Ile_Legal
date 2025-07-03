import { supabase } from '../lib/supabase';
import { getUserWalletData } from '../services/unifiedWalletService';
import { frontendWalletService } from '../services/frontendWalletService';
import { paymentIntegrationService } from '../services/paymentIntegrationService';

/**
 * Utility functions for testing wallet operations and debugging
 */

export interface WalletTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Test wallet creation flow
 */
export const testWalletCreation = async (userId: string, userType: 'buyer' | 'seller', name: string, email: string): Promise<WalletTestResult> => {
  try {
    console.log('🧪 [WalletTest] Testing wallet creation for user:', userId);
    
    // Check if wallet already exists
    const existingWallet = await frontendWalletService.getUserWallet(userId);
    if (existingWallet) {
      return {
        success: false,
        message: 'Wallet already exists for this user',
        data: existingWallet
      };
    }
    
    // Create new wallet
    const result = await frontendWalletService.createWallet({
      userId,
      userType,
      name,
      email
    });
    
    if (result.success) {
      return {
        success: true,
        message: 'Wallet created successfully',
        data: result.wallet
      };
    } else {
      return {
        success: false,
        message: 'Wallet creation failed',
        error: result.error
      };
    }
  } catch (error: any) {
    console.error('❌ [WalletTest] Wallet creation test failed:', error);
    return {
      success: false,
      message: 'Test failed with exception',
      error: error.message
    };
  }
};

/**
 * Test wallet data retrieval from all services
 */
export const testWalletDataRetrieval = async (userId: string): Promise<WalletTestResult> => {
  try {
    console.log('🧪 [WalletTest] Testing wallet data retrieval for user:', userId);
    
    const results = {
      unifiedService: null as any,
      frontendService: null as any,
      directQuery: null as any
    };
    
    // Test unified service
    try {
      results.unifiedService = await getUserWalletData(userId);
      console.log('✅ [WalletTest] Unified service: SUCCESS');
    } catch (error: any) {
      console.error('❌ [WalletTest] Unified service: FAILED', error.message);
      results.unifiedService = { error: error.message };
    }
    
    // Test frontend service
    try {
      results.frontendService = await frontendWalletService.getUserWallet(userId);
      console.log('✅ [WalletTest] Frontend service: SUCCESS');
    } catch (error: any) {
      console.error('❌ [WalletTest] Frontend service: FAILED', error.message);
      results.frontendService = { error: error.message };
    }
    
    // Test direct database query
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;
      results.directQuery = data;
      console.log('✅ [WalletTest] Direct query: SUCCESS');
    } catch (error: any) {
      console.error('❌ [WalletTest] Direct query: FAILED', error.message);
      results.directQuery = { error: error.message };
    }
    
    return {
      success: true,
      message: 'Wallet data retrieval test completed',
      data: results
    };
  } catch (error: any) {
    console.error('❌ [WalletTest] Wallet data retrieval test failed:', error);
    return {
      success: false,
      message: 'Test failed with exception',
      error: error.message
    };
  }
};

/**
 * Test payment processing flow
 */
export const testPaymentFlow = async (
  buyerId: string,
  sellerId: string,
  amount: number,
  currency: string = 'NGN'
): Promise<WalletTestResult> => {
  try {
    console.log('🧪 [WalletTest] Testing payment flow:', {
      buyerId,
      sellerId,
      amount,
      currency
    });
    
    // Test payment processing
    const paymentRequest = {
      taskId: Math.floor(Math.random() * 1000), // Mock task ID
      amount,
      currency,
      buyerId,
      sellerId,
      method: 'wallet' as const,
      description: 'Test payment'
    };
    
    const result = await paymentIntegrationService.processPayment(paymentRequest);
    
    return {
      success: result.success,
      message: result.message,
      data: {
        transactionId: result.transactionId,
        conversion: result.conversion
      },
      error: result.success ? undefined : result.message
    };
  } catch (error: any) {
    console.error('❌ [WalletTest] Payment flow test failed:', error);
    return {
      success: false,
      message: 'Payment test failed',
      error: error.message
    };
  }
};

/**
 * Test wallet balance retrieval
 */
export const testWalletBalance = async (userId: string): Promise<WalletTestResult> => {
  try {
    console.log('🧪 [WalletTest] Testing wallet balance for user:', userId);
    
    // Get wallet data
    const walletData = await getUserWalletData(userId);
    
    if (!walletData.hasCircleWallet) {
      return {
        success: false,
        message: 'User does not have a Circle wallet',
        data: walletData
      };
    }
    
    // Test direct Circle API balance call
    let apiBalance = null;
    try {
      if (walletData.circleWalletId) {
        apiBalance = await frontendWalletService.getWalletBalance(walletData.circleWalletId);
      }
    } catch (error: any) {
      console.log('⚠️  [WalletTest] Circle API balance call failed:', error.message);
    }
    
    return {
      success: true,
      message: 'Wallet balance test completed',
      data: {
        storedBalance: walletData.balance,
        apiBalance: apiBalance,
        walletInfo: {
          circleWalletId: walletData.circleWalletId,
          hasCircle: walletData.hasCircleWallet,
          hasEth: walletData.hasEthWallet
        }
      }
    };
  } catch (error: any) {
    console.error('❌ [WalletTest] Wallet balance test failed:', error);
    return {
      success: false,
      message: 'Balance test failed',
      error: error.message
    };
  }
};

/**
 * Run comprehensive wallet system test
 */
export const runWalletSystemTest = async (userId: string): Promise<WalletTestResult> => {
  try {
    console.log('🧪 [WalletTest] Running comprehensive wallet system test for user:', userId);
    
    const testResults = {
      dataRetrieval: await testWalletDataRetrieval(userId),
      balanceCheck: await testWalletBalance(userId)
    };
    
    const allTestsPassed = Object.values(testResults).every(result => result.success);
    
    return {
      success: allTestsPassed,
      message: allTestsPassed ? 'All wallet tests passed' : 'Some wallet tests failed',
      data: testResults
    };
  } catch (error: any) {
    console.error('❌ [WalletTest] Comprehensive test failed:', error);
    return {
      success: false,
      message: 'Comprehensive test failed',
      error: error.message
    };
  }
};

/**
 * Debug wallet state for a user
 */
export const debugWalletState = async (userId: string): Promise<WalletTestResult> => {
  try {
    console.log('🔍 [WalletDebug] Debugging wallet state for user:', userId);
    
    // Get all wallet-related data
    const debugData = {
      userWallets: null as any,
      profileData: null as any,
      unifiedData: null as any,
      frontendData: null as any
    };
    
    // Query user_wallets table
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      debugData.userWallets = data;
    } catch (error: any) {
      debugData.userWallets = { error: error.message };
    }
    
    // Query Profiles table for basic user data (not wallet data)
    try {
      const { data, error } = await supabase
        .from('Profiles')
        .select('first_name, last_name, email, user_type')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      debugData.profileData = data;
    } catch (error: any) {
      debugData.profileData = { error: error.message };
    }
    
    // Test unified service
    try {
      debugData.unifiedData = await getUserWalletData(userId);
    } catch (error: any) {
      debugData.unifiedData = { error: error.message };
    }
    
    // Test frontend service
    try {
      debugData.frontendData = await frontendWalletService.getUserWallet(userId);
    } catch (error: any) {
      debugData.frontendData = { error: error.message };
    }
    
    console.log('🔍 [WalletDebug] Debug data collected:', debugData);
    
    return {
      success: true,
      message: 'Wallet debug data collected',
      data: debugData
    };
  } catch (error: any) {
    console.error('❌ [WalletDebug] Debug failed:', error);
    return {
      success: false,
      message: 'Debug failed',
      error: error.message
    };
  }
};