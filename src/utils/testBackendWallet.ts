/**
 * Test utility for backend wallet service
 * Use this to test wallet creation functionality
 */

import { backendWalletService } from '../services/backendWalletService';
import { supabase } from '../lib/supabase';

export interface TestWalletResult {
  success: boolean;
  message: string;
  walletId?: string;
  error?: string;
}

/**
 * Test wallet creation for a logged-in user
 */
export async function testWalletCreation(
  userType: 'buyer' | 'seller' = 'buyer'
): Promise<TestWalletResult> {
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return {
        success: false,
        message: 'No authenticated user found. Please log in first.',
        error: sessionError?.message || 'No session'
      };
    }

    const user = session.user;
    console.log('Testing wallet creation for user:', user.id);

    // Check if wallet already exists
    const existingWallet = await backendWalletService.getUserWallet(user.id);
    
    if (existingWallet) {
      return {
        success: true,
        message: 'User already has a wallet',
        walletId: existingWallet.circle_wallet_id
      };
    }

    // Test wallet creation
    const walletResponse = await backendWalletService.createWallet({
      userId: user.id,
      userType,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Test User',
      email: user.email || 'test@example.com'
    });

    if (walletResponse.success && walletResponse.wallet) {
      return {
        success: true,
        message: 'Wallet created successfully via backend',
        walletId: walletResponse.wallet.circle_wallet_id
      };
    } else {
      return {
        success: false,
        message: 'Backend wallet creation failed',
        error: walletResponse.error || 'Unknown error'
      };
    }

  } catch (error: any) {
    console.error('Test wallet creation error:', error);
    return {
      success: false,
      message: 'Test failed with exception',
      error: error.message
    };
  }
}

/**
 * Test wallet retrieval
 */
export async function testWalletRetrieval(): Promise<TestWalletResult> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return {
        success: false,
        message: 'No authenticated user found',
        error: 'No session'
      };
    }

    const wallet = await backendWalletService.getUserWallet(session.user.id);

    if (wallet) {
      return {
        success: true,
        message: `Wallet found: ${wallet.circle_wallet_id}`,
        walletId: wallet.circle_wallet_id
      };
    } else {
      return {
        success: false,
        message: 'No wallet found for user',
        error: 'Wallet not found'
      };
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve wallet',
      error: error.message
    };
  }
}

/**
 * Complete wallet test suite
 */
export async function runWalletTests(): Promise<void> {
  console.log('🧪 Starting Backend Wallet Service Tests...\n');

  // Test 1: Wallet Retrieval
  console.log('Test 1: Wallet Retrieval');
  const retrievalResult = await testWalletRetrieval();
  console.log(`${retrievalResult.success ? '✅' : '❌'} ${retrievalResult.message}`);
  if (retrievalResult.error) console.log(`   Error: ${retrievalResult.error}`);
  console.log('');

  // Test 2: Wallet Creation (only if no wallet exists)
  if (!retrievalResult.success) {
    console.log('Test 2: Wallet Creation');
    const creationResult = await testWalletCreation('buyer');
    console.log(`${creationResult.success ? '✅' : '❌'} ${creationResult.message}`);
    if (creationResult.error) console.log(`   Error: ${creationResult.error}`);
    if (creationResult.walletId) console.log(`   Wallet ID: ${creationResult.walletId}`);
    console.log('');
  } else {
    console.log('Test 2: Skipped (wallet already exists)');
    console.log('');
  }

  // Test 3: Activity Logging
  console.log('Test 3: Activity Logging');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const activities = await backendWalletService.getWalletActivity(session.user.id, 5);
      console.log(`✅ Retrieved ${activities.length} activity records`);
      if (activities.length > 0) {
        console.log(`   Latest: ${activities[0].activity_type} - ${activities[0].description}`);
      }
    }
  } catch (error: any) {
    console.log(`❌ Activity test failed: ${error.message}`);
  }

  console.log('\n🏁 Wallet tests completed');
}

// Helper function to run tests from browser console
(window as any).testBackendWallet = {
  runTests: runWalletTests,
  createWallet: testWalletCreation,
  getWallet: testWalletRetrieval
};

export { runWalletTests as default };