/**
 * Comprehensive test suite for secure Circle API migration
 * Tests all backend Edge Functions and security measures
 */

import { supabase } from '../lib/supabase';
import { backendWalletService } from '../services/backendWalletService';
import { secureCircleService } from '../services/secureCircleService';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

class SecureCircleMigrationTest {
  private results: TestResult[] = [];

  /**
   * Run all migration tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🔐 Starting Secure Circle API Migration Tests...\n');

    this.results = [];

    // Test 1: Environment Security
    await this.testEnvironmentSecurity();

    // Test 2: Authentication
    await this.testAuthentication();

    // Test 3: Backend Wallet Service
    await this.testBackendWalletService();

    // Test 4: Secure Circle Service
    await this.testSecureCircleService();

    // Test 5: API Key Management (admin only)
    await this.testApiKeyManagement();

    // Test 6: Edge Function Connectivity
    await this.testEdgeFunctionConnectivity();

    // Print summary
    this.printTestSummary();

    return this.results;
  }

  /**
   * Test 1: Verify no Circle API keys are exposed in frontend
   */
  private async testEnvironmentSecurity(): Promise<void> {
    const testName = 'Environment Security';
    
    try {
      // Check that Circle API keys are not in environment
      const hasCircleApiKey = !!(
        import.meta.env.VITE_CIRCLE_API_KEY ||
        import.meta.env.VITE_CIRCLE_TEST_API_KEY ||
        import.meta.env.CIRCLE_API_KEY
      );

      if (hasCircleApiKey) {
        this.addResult(testName, false, 'Circle API keys found in frontend environment', {
          found_keys: Object.keys(import.meta.env).filter(key => 
            key.includes('CIRCLE') && key.includes('KEY')
          )
        });
        return;
      }

      // Verify Supabase config exists
      const hasSupabaseConfig = !!(
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      if (!hasSupabaseConfig) {
        this.addResult(testName, false, 'Missing Supabase configuration');
        return;
      }

      this.addResult(testName, true, 'Environment is secure - no Circle API keys exposed');

    } catch (error: any) {
      this.addResult(testName, false, 'Environment security test failed', null, error.message);
    }
  }

  /**
   * Test 2: Verify authentication works
   */
  private async testAuthentication(): Promise<void> {
    const testName = 'Authentication';
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        this.addResult(testName, false, 'Authentication error', null, error.message);
        return;
      }

      if (!session) {
        this.addResult(testName, false, 'No active session - please log in first');
        return;
      }

      this.addResult(testName, true, 'Authentication successful', {
        user_id: session.user.id,
        expires_at: session.expires_at
      });

    } catch (error: any) {
      this.addResult(testName, false, 'Authentication test failed', null, error.message);
    }
  }

  /**
   * Test 3: Backend wallet service
   */
  private async testBackendWalletService(): Promise<void> {
    const testName = 'Backend Wallet Service';
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        this.addResult(testName, false, 'No session for wallet test');
        return;
      }

      // Check if user has a wallet
      const wallet = await backendWalletService.getUserWallet(session.user.id);

      if (wallet) {
        this.addResult(testName, true, 'Wallet found in database', {
          wallet_id: wallet.circle_wallet_id,
          wallet_state: wallet.wallet_state,
          created_at: wallet.created_at
        });
      } else {
        // Try to create wallet via backend
        const walletResponse = await backendWalletService.createWallet({
          userId: session.user.id,
          userType: 'buyer',
          name: session.user.user_metadata?.name || 'Test User',
          email: session.user.email || 'test@example.com'
        });

        if (walletResponse.success) {
          this.addResult(testName, true, 'Wallet created via backend service', {
            wallet_id: walletResponse.wallet?.circle_wallet_id
          });
        } else {
          this.addResult(testName, false, 'Backend wallet creation failed', null, walletResponse.error);
        }
      }

    } catch (error: any) {
      this.addResult(testName, false, 'Backend wallet service test failed', null, error.message);
    }
  }

  /**
   * Test 4: Secure Circle service operations
   */
  private async testSecureCircleService(): Promise<void> {
    const testName = 'Secure Circle Service';
    
    try {
      // Test getting user wallet
      const userWallet = await secureCircleService.getUserWallet();

      if (!userWallet) {
        this.addResult(testName, false, 'No wallet found for secure Circle service test');
        return;
      }

      // Test wallet balance retrieval
      const balances = await secureCircleService.getWalletBalance(userWallet.circle_wallet_id);

      // Test wallet addresses
      const addresses = await secureCircleService.getWalletAddresses(userWallet.circle_wallet_id);

      this.addResult(testName, true, 'Secure Circle service operational', {
        wallet_id: userWallet.circle_wallet_id,
        balances_count: balances.length,
        addresses_count: addresses.length,
        wallet_state: userWallet.wallet_state
      });

    } catch (error: any) {
      this.addResult(testName, false, 'Secure Circle service test failed', null, error.message);
    }
  }

  /**
   * Test 5: API Key Management (admin only)
   */
  private async testApiKeyManagement(): Promise<void> {
    const testName = 'API Key Management';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_health',
          environment: 'sandbox'
        }),
      });

      if (response.status === 403) {
        this.addResult(testName, true, 'API key management properly restricted to admins');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.addResult(testName, true, 'API key management accessible (admin user)', {
          api_keys_found: data.data?.length || 0
        });
      } else {
        this.addResult(testName, false, 'API key management failed', null, data.error);
      }

    } catch (error: any) {
      this.addResult(testName, false, 'API key management test failed', null, error.message);
    }
  }

  /**
   * Test 6: Edge Function connectivity
   */
  private async testEdgeFunctionConnectivity(): Promise<void> {
    const testName = 'Edge Function Connectivity';
    
    try {
      const functions = ['create-wallet', 'wallet-operations', 'manage-api-keys'];
      const results: any = {};

      for (const func of functions) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${func}`, {
            method: 'OPTIONS', // CORS preflight
          });

          results[func] = {
            reachable: response.ok || response.status === 405, // 405 = Method Not Allowed is OK for OPTIONS
            status: response.status
          };
        } catch (error) {
          results[func] = {
            reachable: false,
            error: error.message
          };
        }
      }

      const allReachable = Object.values(results).every((r: any) => r.reachable);

      this.addResult(testName, allReachable, 
        allReachable ? 'All Edge Functions are reachable' : 'Some Edge Functions unreachable',
        results
      );

    } catch (error: any) {
      this.addResult(testName, false, 'Edge Function connectivity test failed', null, error.message);
    }
  }

  /**
   * Add test result
   */
  private addResult(name: string, success: boolean, message: string, details?: any, error?: string): void {
    this.results.push({ name, success, message, details, error });
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${name}: ${message}`);
    
    if (details) {
      console.log(`   Details:`, details);
    }
    
    if (error) {
      console.log(`   Error: ${error}`);
    }
    
    console.log('');
  }

  /**
   * Print test summary
   */
  private printTestSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;

    console.log('📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Secure Circle API migration is successful.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the issues above.');
    }
  }
}

// Export for use in components or console
export const testSecureCircleMigration = async (): Promise<TestResult[]> => {
  const tester = new SecureCircleMigrationTest();
  return await tester.runAllTests();
};

// Make available in browser console
(window as any).testSecureCircleMigration = testSecureCircleMigration;

export default testSecureCircleMigration;