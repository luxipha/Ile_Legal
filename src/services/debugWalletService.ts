import { supabase } from '../lib/supabase';

/**
 * Debug service to help troubleshoot wallet creation issues
 */
export class DebugWalletService {
  
  /**
   * Test Circle API credentials by making a simple API call
   */
  async testCircleCredentials(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession.session) {
        return {
          success: false,
          message: 'No authenticated session found'
        };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pleuwhgjpjnkqvbemmhl.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/test-circle-api`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userSession.session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Circle API credentials are valid',
          details: data
        };
      } else {
        return {
          success: false,
          message: `Circle API test failed: ${data.error || 'Unknown error'}`,
          details: data
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error testing Circle API: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check user_wallets table structure and constraints
   */
  async checkUserWalletsTable(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Try to query the table structure
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `user_wallets table error: ${error.message}`,
          details: error
        };
      }

      return {
        success: true,
        message: 'user_wallets table is accessible',
        details: { sampleCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error checking user_wallets table: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check Profiles table structure and RLS policies
   */
  async checkProfilesTable(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Try to query the table structure
      const { data, error } = await supabase
        .from('Profiles')
        .select('*')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Profiles table error: ${error.message}`,
          details: error
        };
      }

      return {
        success: true,
        message: 'Profiles table is accessible',
        details: { sampleCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error checking Profiles table: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Run a comprehensive registration debug test
   */
  async runRegistrationDebug(): Promise<{
    circleAPI: { success: boolean; message: string };
    userWallets: { success: boolean; message: string };
    profiles: { success: boolean; message: string };
    session: { success: boolean; message: string };
  }> {
    console.log('🔍 [Debug] Running comprehensive registration debug...');

    // Check current session
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionCheck = {
      success: !!sessionData.session,
      message: sessionData.session ? 'User session active' : 'No active user session'
    };

    // Check Circle API
    const circleCheck = await this.testCircleCredentials();

    // Check user_wallets table
    const walletTableCheck = await this.checkUserWalletsTable();

    // Check Profiles table
    const profilesCheck = await this.checkProfilesTable();

    const results = {
      session: sessionCheck,
      circleAPI: circleCheck,
      userWallets: walletTableCheck,
      profiles: profilesCheck
    };

    console.log('📊 [Debug] Registration debug results:', results);
    return results;
  }

  /**
   * Create a minimal test wallet entry (for debugging)
   */
  async createTestWallet(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const testWalletId = `debug_${Date.now()}`;
      const testWalletAddress = `0x${Math.random().toString(16).substring(2, 42)}`;

      const { error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          circle_wallet_id: testWalletId,
          wallet_address: testWalletAddress,
          wallet_state: 'LIVE',
          blockchain: 'ETHEREUM',
          account_type: 'EOA',
          custody_type: 'ENDUSER',
          description: 'Debug test wallet',
          balance_usdc: 0,
          balance_matic: 0,
          is_active: true
        });

      if (error) {
        return {
          success: false,
          message: `Failed to create test wallet: ${error.message}`
        };
      }

      return {
        success: true,
        message: `Test wallet created successfully: ${testWalletId}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error creating test wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const debugWalletService = new DebugWalletService();