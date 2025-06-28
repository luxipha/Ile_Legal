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

// Circle configuration - these will be moved to environment variables
const CIRCLE_CONFIG = {
  API_KEY: 'TEST_API_KEY:10a0b7b4cedfaa42d6ce306592fec59f:cfae665cde083f9236de7be92d08f54c',
  API_URL: 'https://api.circle.com',
  WALLET_SET_ID: '4150e7d9-990e-5310-8f10-f2d03ca86d09',
  ENTITY_SECRET_HEX: '728de8dc586450a9d12ed504fb36467364b1442280e422b715e65e88ee9c4391',
  PUBLIC_KEY_PEM: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAswT7jHetVDoX/r3OuFrG
TgQWPprYoKstlRkz6DOPm6CPqY41KOMNhZ0jnlTpyoGhp3yEjhzNFKq6lndZcHa+
5yJ4aeWGJhk153iTDH+TNU0hbY/3A1vAfx49c5IgIG5WxlLoiQjupaeEYE5HFCfk
HmgxYC66KQDoX80/DqeZLIxeJTANEHfsb93LTcdoh0qQqtVa8XnL9AWMgihyxp3L
WPKKrymKSTwuRLA0YvpA8pS0/tP0VMdKrQKJUNCnZakGUhA84HiEga73dgJ7BqFV
j2mWk74T/sFm1ZNU30SRsiCZZeieOgq3sOzL6ketVHTIM5f7FB7xkm05tKtn1W72
/IqveOa35e4H6WVfcK2ghVACLqT8RpDAOYwsz6Q6Ye/84QwG7eMRaFOePqhqXyhV
yS+P7hRvhA86/YSMUf93X1XOrm7t8lA64T5nwKjeytlp16C9oe3lEMtictB/7OUb
assLwdU+Sce50yCbzQFlF4cOFgA6KftEA9xcHMPhuG3BMtaHdFtmeFXZqa9IZCyR
kGAuzgCMrJI16tQgW9nfJwS8cxYvmMiF5LixfyHR10E+GAWkJzxY8ZBD6DloBQGI
ugMWOOZw8j8NSrSMd0/nIzHfiiCf8BdpW6QUADL6y1BlKEXbZf9CUFBwCkZQCNAd
+nY2lo+TGfsXLlzYEvp+RHkCAwEAAQ==
-----END PUBLIC KEY-----`
};

class FrontendWalletService {
  private readonly functionsUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured');
    }
    this.functionsUrl = `${supabaseUrl}/functions/v1`;
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
      throw new Error(`Failed to encrypt entity secret: ${error.message}`);
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
}

// Export singleton instance
export const frontendWalletService = new FrontendWalletService();

// Export types for use in components
export type { FrontendWalletRequest, WalletInfo, FrontendWalletResponse };