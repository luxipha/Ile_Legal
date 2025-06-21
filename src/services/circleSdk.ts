import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

// Circle SDK configuration
const CIRCLE_API_KEY = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CIRCLE_TEST_API_KEY : process.env.VITE_CIRCLE_TEST_API_KEY) || '';

// Initialize Circle SDK
const circle = new Circle({
  apiKey: CIRCLE_API_KEY,
  basePath: CircleEnvironments.sandbox
});

/**
 * Create a new Circle wallet using SDK
 */
export const createWallet = async (userId: string, description: string) => {
  try {
    const response = await circle.wallets.createWallet({
      idempotencyKey: `wallet-${userId}-${Date.now()}`,
      description
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error creating Circle wallet with SDK:', error);
    throw error;
  }
};

/**
 * Generate wallet address using SDK
 */
export const generateWalletAddress = async (walletId: string, currency = 'USD', chain = 'ETH') => {
  try {
    const response = await circle.addresses.generateAddress({
      idempotencyKey: `address-${walletId}-${chain}-${currency}-${Date.now()}`,
      walletId,
      currency,
      chain
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error generating wallet address with SDK:', error);
    throw error;
  }
};

/**
 * Get wallet details using SDK
 */
export const getWallet = async (walletId: string) => {
  try {
    const response = await circle.wallets.getWallet({ walletId });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching wallet with SDK:', error);
    throw error;
  }
};

/**
 * Get wallet balance using SDK
 */
export const getWalletBalance = async (walletId: string) => {
  try {
    const response = await circle.balances.listBalances({ walletId });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching wallet balance with SDK:', error);
    throw error;
  }
};

/**
 * Test Circle SDK connection
 */
export const testCircleConnection = async () => {
  try {
    // Test with a simple call that doesn't require specific resources
    const response = await circle.management.getConfiguration();
    console.log('Circle SDK connection successful:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Circle SDK connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};