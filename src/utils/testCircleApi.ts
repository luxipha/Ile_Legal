/**
 * Utility to test Circle API configuration and connection
 * Updated to use secure backend service
 */

import { secureCircleService } from '../services/secureCircleService';
import { backendWalletService } from '../services/backendWalletService';

export const testCircleApiConfiguration = async () => {
  console.log('🔍 Testing Secure Circle API Backend Service...');
  
  try {
    // Test 1: Check if user has a wallet
    console.log('1. Checking user wallet...');
    const userWallet = await secureCircleService.getUserWallet();
    
    if (!userWallet) {
      console.log('No wallet found. Testing wallet creation...');
      
      // Test wallet creation via backend
      try {
        const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());
        
        if (!session) {
          console.error('❌ No authenticated session for wallet creation test');
          return false;
        }

        const walletResponse = await backendWalletService.createWallet({
          userId: session.user.id,
          userType: 'buyer',
          name: session.user.user_metadata?.name || 'Test User',
          email: session.user.email || 'test@example.com'
        });

        if (walletResponse.success) {
          console.log('✅ Wallet created successfully via backend service');
        } else {
          console.error('❌ Wallet creation failed:', walletResponse.error);
          return false;
        }
      } catch (error: any) {
        console.error('❌ Wallet creation test failed:', error.message);
        return false;
      }
    } else {
      console.log('✅ User wallet found:', {
        wallet_id: userWallet.circle_wallet_id,
        wallet_state: userWallet.wallet_state,
        created_at: userWallet.created_at
      });
    }
    
    // Test 2: Test wallet balance retrieval via secure backend
    console.log('2. Testing wallet balance retrieval...');
    try {
      const finalWallet = userWallet || await secureCircleService.getUserWallet();
      
      if (!finalWallet) {
        throw new Error('No wallet available for balance test');
      }

      const balances = await secureCircleService.getWalletBalance(finalWallet.circle_wallet_id);
      console.log('✅ Wallet balance retrieved successfully:', {
        wallet_id: finalWallet.circle_wallet_id,
        balances_count: balances.length,
        balances: balances
      });
    } catch (error: any) {
      console.error('❌ Balance retrieval failed:', error.message);
      return false;
    }
    
    // Test 3: Test wallet addresses retrieval
    console.log('3. Testing wallet addresses retrieval...');
    try {
      const finalWallet = userWallet || await secureCircleService.getUserWallet();
      const addresses = await secureCircleService.getWalletAddresses(finalWallet.circle_wallet_id);
      console.log('✅ Wallet addresses retrieved successfully:', {
        addresses_count: addresses.length,
        addresses: addresses
      });
    } catch (error: any) {
      console.error('❌ Addresses retrieval failed:', error.message);
      return false;
    }
    
    console.log('✅ All secure Circle API backend tests passed!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Error during secure Circle API testing:', error.message);
    return false;
  }
};

/**
 * Test secure backend service connectivity
 */
export const testBackendConnectivity = async () => {
  console.log('🔧 Testing backend Edge Function connectivity...');
  
  try {
    const { supabase } = await import('../lib/supabase');
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!baseUrl) {
      console.error('❌ VITE_SUPABASE_URL not configured');
      return false;
    }

    const functions = [
      'create-wallet',
      'wallet-operations', 
      'manage-api-keys'
    ];
    
    const results: any = {};
    
    for (const func of functions) {
      try {
        const response = await fetch(`${baseUrl}/functions/v1/${func}`, {
          method: 'OPTIONS', // CORS preflight
        });
        
        results[func] = {
          reachable: response.ok || response.status === 405, // 405 = Method Not Allowed is OK for OPTIONS
          status: response.status
        };
        
        const status = results[func].reachable ? '✅' : '❌';
        console.log(`${status} ${func}: ${results[func].reachable ? 'Reachable' : 'Unreachable'} (Status: ${response.status})`);
        
      } catch (error: any) {
        results[func] = {
          reachable: false,
          error: error.message
        };
        console.log(`❌ ${func}: ${error.message}`);
      }
    }
    
    const allReachable = Object.values(results).every((r: any) => r.reachable);
    
    if (allReachable) {
      console.log('✅ All backend Edge Functions are reachable');
    } else {
      console.log('❌ Some backend Edge Functions are unreachable');
    }
    
    return allReachable;
    
  } catch (error: any) {
    console.error('❌ Backend connectivity test failed:', error.message);
    return false;
  }
};