import { supabase } from '../lib/supabase';
import forge from 'node-forge';

export interface FrontendWalletRequest {
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

export interface FrontendWalletResponse {
  success: boolean;
  wallet?: WalletInfo;
  circle_wallet?: any;
  message?: string;
  error?: string;
  details?: string;
}

// Circle configuration from environment variables
const CIRCLE_CONFIG = {
  API_KEY: import.meta.env.VITE_CIRCLE_API_KEY,
  API_URL: import.meta.env.VITE_CIRCLE_API_URL,
  WALLET_SET_ID: import.meta.env.VITE_CIRCLE_WALLET_SET_ID,
  ENTITY_SECRET_HEX: import.meta.env.VITE_CIRCLE_ENTITY_SECRET_HEX,
  PUBLIC_KEY_PEM: import.meta.env.VITE_CIRCLE_PUBLIC_KEY_PEM
};

class FrontendWalletService {
  constructor() {
    // Validate required environment variables
    if (!CIRCLE_CONFIG.API_KEY) {
      throw new Error('VITE_CIRCLE_API_KEY is not configured');
    }
    if (!CIRCLE_CONFIG.ENTITY_SECRET_HEX) {
      throw new Error('VITE_CIRCLE_ENTITY_SECRET_HEX is not configured');
    }
    if (!CIRCLE_CONFIG.PUBLIC_KEY_PEM) {
      throw new Error('VITE_CIRCLE_PUBLIC_KEY_PEM is not configured');
    }
  }

  /**
   * Generate fresh entity secret ciphertext using node-forge (Circle's proven method)
   */
  private generateFreshEntitySecretCiphertext(): string {
    try {
      console.log('🔐 Generating fresh ciphertext using node-forge...');
      
      // Convert hex entity secret to bytes (Circle's way)
      const entitySecret = forge.util.hexToBytes(CIRCLE_CONFIG.ENTITY_SECRET_HEX);
      console.log('📝 Entity secret bytes length:', entitySecret.length);
      
      // Parse the public key (Circle's way)  
      const publicKey = forge.pki.publicKeyFromPem(CIRCLE_CONFIG.PUBLIC_KEY_PEM);
      console.log('🔑 Public key loaded successfully');
      
      // Encrypt using RSA-OAEP with SHA-256 (Circle's exact method)
      const encryptedData = publicKey.encrypt(entitySecret, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create(),
        },
      });
      
      // Encode to base64 (Circle's way)
      const ciphertext = forge.util.encode64(encryptedData);
      
      console.log('✅ Frontend encryption successful!');
      console.log('📏 Ciphertext length:', ciphertext.length);
      
      return ciphertext;
      
    } catch (error) {
      console.error('❌ Frontend encryption failed:', error);
      throw new Error(`Failed to encrypt entity secret: ${(error as Error).message}`);
    }
  }

  /**
   * Generate UUID v4 for idempotency
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Create Circle wallet via API only (no database operations)
   * Used when we want to handle database operations separately
   */
  async createCircleWalletOnly(request: Omit<FrontendWalletRequest, 'userId'> & { 
    blockchains?: string[];
    accountType?: string;
    walletSetId?: string;
  }): Promise<{ wallet: any }> {
    try {
      console.log('🏦 Creating Circle wallet via API only...');

      // Validate required parameters
      const walletSetId = request.walletSetId || CIRCLE_CONFIG.WALLET_SET_ID;
      if (!walletSetId) {
        throw new Error('walletSetId is required but not provided in request or environment variables');
      }

      // Generate fresh ciphertext using node-forge
      const entitySecretCiphertext = this.generateFreshEntitySecretCiphertext();
      
      // Generate proper UUID for idempotency key (Circle API requirement)
      const idempotencyKey = this.generateUUID();
      
      console.log('🆔 Generated UUID idempotency key:', idempotencyKey);
      console.log('🔒 Generated ciphertext preview:', entitySecretCiphertext.substring(0, 50) + '...');
      console.log('🏢 Using wallet set ID:', walletSetId);

      // Create wallet description
      const walletDescription = `${request.userType.charAt(0).toUpperCase() + request.userType.slice(1)} wallet for ${request.name}`;

      // Prepare request body
      const requestBody = {
        idempotencyKey: idempotencyKey,
        blockchains: request.blockchains || ['MATIC-AMOY'],
        entitySecretCiphertext: entitySecretCiphertext,
        accountType: request.accountType || 'EOA',
        walletSetId: walletSetId,
        metadata: [{
          name: 'description',
          value: walletDescription
        }]
      };

      console.log('📡 Circle API request body:', {
        ...requestBody,
        entitySecretCiphertext: '[HIDDEN]',
        idempotencyKey: idempotencyKey
      });

      // Call Circle API directly from frontend
      const circleResponse = await fetch(`${CIRCLE_CONFIG.API_URL}/v1/w3s/developer/wallets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CIRCLE_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const circleData = await circleResponse.json();
      
      console.log('📬 Circle API response status:', circleResponse.status);
      console.log('📬 Circle API response data:', circleData);
      
      if (!circleResponse.ok) {
        console.error('❌ Circle API error details:', {
          status: circleResponse.status,
          statusText: circleResponse.statusText,
          data: circleData,
          requestBody: {
            ...requestBody,
            entitySecretCiphertext: '[HIDDEN]'
          }
        });
        throw new Error(`Circle API error: ${circleResponse.status} - ${JSON.stringify(circleData)}`);
      }

      // Extract wallet from Circle response - multiple possible response formats
      let wallet;
      
      // Check different possible response structures from Circle API
      if (circleData.data?.wallet) {
        wallet = circleData.data.wallet;
      } else if (circleData.data?.wallets && circleData.data.wallets.length > 0) {
        wallet = circleData.data.wallets[0];
      } else if (circleData.wallet) {
        wallet = circleData.wallet;
      } else if (circleData.wallets && circleData.wallets.length > 0) {
        wallet = circleData.wallets[0];
      } else {
        // Log the full response to debug the structure
        console.log('🔍 Full Circle API response structure:', JSON.stringify(circleData, null, 2));
        console.warn('⚠️ Unable to extract wallet from Circle response, trying direct data access');
        wallet = circleData.data || circleData;
      }
      
      console.log('✅ Circle wallet created successfully:', {
        walletId: wallet?.id,
        address: wallet?.address,
        blockchain: wallet?.blockchain,
        state: wallet?.state,
        fullResponse: circleData
      });

      if (!wallet?.id || !wallet?.address) {
        console.error('❌ Invalid wallet data from Circle API:', circleData);
        throw new Error('Circle API returned invalid wallet data');
      }

      return {
        wallet: wallet
      };

    } catch (error) {
      console.error('❌ Circle wallet creation failed:', error);
      throw error;
    }
  }

  /**
   * Create a new wallet using frontend encryption + Circle API directly
   */
  async createWallet(request: FrontendWalletRequest): Promise<FrontendWalletResponse> {
    try {
      console.log('🏦 Creating wallet via frontend for user:', request.userId);

      // Generate fresh ciphertext using node-forge (the working method)
      const entitySecretCiphertext = this.generateFreshEntitySecretCiphertext();
      
      // Generate UUID v4 for idempotency
      const idempotencyKey = this.generateUUID();
      
      console.log('🆔 Generated idempotency key:', idempotencyKey);
      console.log('🔒 Generated ciphertext preview:', entitySecretCiphertext.substring(0, 50) + '...');

      // Create wallet description
      const walletDescription = `${request.userType.charAt(0).toUpperCase() + request.userType.slice(1)} wallet for ${request.name}`;

      // Call Circle API directly from frontend
      console.log('📡 Making direct Circle API request...');
      const circleResponse = await fetch(`${CIRCLE_CONFIG.API_URL}/v1/w3s/developer/wallets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CIRCLE_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey,
          blockchains: ['MATIC-AMOY'],
          entitySecretCiphertext: entitySecretCiphertext,
          walletSetId: CIRCLE_CONFIG.WALLET_SET_ID
        })
      });

      if (!circleResponse.ok) {
        const errorText = await circleResponse.text();
        console.error('Circle API Error:', errorText);
        throw new Error(`Circle API error: ${circleResponse.status} - ${errorText}`);
      }

      const circleData = await circleResponse.json();
      const wallet = circleData.data.wallets[0]; // Circle returns array for developer wallets

      console.log('✅ Circle wallet created:', wallet);

      // Store wallet in database using Supabase
      const { data: savedWallet, error: dbError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: request.userId,
          circle_wallet_id: wallet.id,
          wallet_address: wallet.address || null,
          wallet_state: wallet.state,
          blockchain: wallet.blockchain,
          account_type: wallet.accountType,
          custody_type: wallet.custodyType,
          wallet_set_id: wallet.walletSetId,
          description: walletDescription,
          balance_usdc: 0,
          balance_matic: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save wallet to database');
      }

      // Log wallet creation activity
      await supabase
        .from('user_activities')
        .insert({
          user_id: request.userId,
          activity_type: 'wallet_created',
          description: `Created ${request.userType} wallet`,
          metadata: {
            wallet_id: wallet.id,
            wallet_address: wallet.address
          },
          created_at: new Date().toISOString()
        });

      console.log('🎉 Frontend wallet creation completed successfully!');

      return {
        success: true,
        wallet: savedWallet,
        circle_wallet: wallet,
        message: 'Wallet created successfully'
      };

    } catch (error: any) {
      console.error('Frontend wallet creation error:', error);
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
   * Get wallet balance from Circle API
   */
  async getWalletBalance(walletId: string): Promise<any> {
    try {
      console.log('💰 Fetching wallet balance for:', walletId);
      
      const response = await fetch(`${CIRCLE_CONFIG.API_URL}/v1/w3s/wallets/${walletId}/balances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CIRCLE_CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Circle balance API error:', errorText);
        throw new Error(`Circle balance API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Balance fetched:', result.data);
      console.log('✅ Full balance response structure:', result);
      
      return result.data;
    } catch (error: any) {
      console.error('Error fetching wallet balance:', error);
      throw new Error(`Failed to fetch wallet balance: ${error.message}`);
    }
  }
}

// Export singleton instance
export const frontendWalletService = new FrontendWalletService();

