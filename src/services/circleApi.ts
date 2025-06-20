import axios from 'axios';

// Circle API configuration from environment variables
const CIRCLE_API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CIRCLE_API_URL : process.env.VITE_CIRCLE_API_URL) || 'https://api-sandbox.circle.com';
const CIRCLE_MODULAR_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CIRCLE_MODULAR_URL : process.env.VITE_CIRCLE_MODULAR_URL) || 'https://modular-sdk.circle.com/v1/rpc/w3s/buidl';
const CIRCLE_WALLET_ADDRESS = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CIRCLE_WALLET_ADDRESS : process.env.VITE_CIRCLE_WALLET_ADDRESS) || '';
const CIRCLE_API_KEY = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CIRCLE_TEST_API_KEY : process.env.VITE_CIRCLE_TEST_API_KEY) || '';

/**
 * Create axios instance for Circle API
 */
const createCircleClient = () => {
  if (!CIRCLE_API_KEY) {
    throw new Error('Circle API key not configured');
  }
  
  return axios.create({
    baseURL: CIRCLE_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CIRCLE_API_KEY}`
    }
  });
};

/**
 * Create axios instance for Circle Modular SDK
 */
const createCircleModularClient = () => {
  if (!CIRCLE_API_KEY) {
    throw new Error('Circle API key not configured');
  }
  
  return axios.create({
    baseURL: CIRCLE_MODULAR_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CIRCLE_API_KEY}`
    }
  });
};

/**
 * Test the Circle API connection
 * @returns Promise with connection status
 */
export const testCircleConnection = async () => {
  try {
    const circleModularClient = createCircleModularClient();
    
    // Test the connection by getting wallet balance
    const response = await circleModularClient.post('', {
      jsonrpc: '2.0',
      id: 1,
      method: 'w3s_getBalance',
      params: {
        accountAddress: CIRCLE_WALLET_ADDRESS,
        tokenAddress: '0x0000000000000000000000000000000000000000' // ETH
      }
    });
    
    console.log('Circle API connection successful:', response.data);
    return {
      success: true,
      data: response.data,
      walletAddress: CIRCLE_WALLET_ADDRESS
    };
  } catch (error) {
    console.error('Circle API connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      walletAddress: CIRCLE_WALLET_ADDRESS
    };
  }
};

/**
 * Create a new Circle wallet for a user
 * @param userId - The user's ID in our system
 * @param description - Description for the wallet (e.g., "User Wallet for John Doe")
 */
export const createWallet = async (userId: string, description: string) => {
  try {
    const circleClient = createCircleClient();
    const response = await circleClient.post('/v1/wallets', {
      idempotencyKey: `wallet-${userId}-${Date.now()}`,
      description
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error creating Circle wallet:', error);
    throw error;
  }
};

/**
 * Generate a blockchain address for a wallet
 * @param walletId - The Circle wallet ID
 * @param chain - The blockchain (e.g., "ETH", "AVAX", "MATIC")
 * @param currency - The currency (e.g., "USD", "BTC", "ETH")
 */
export const generateWalletAddress = async (walletId: string, chain = 'ETH', currency = 'USD') => {
  try {
    const circleClient = createCircleClient();
    const response = await circleClient.post(`/v1/wallets/${walletId}/addresses`, {
      idempotencyKey: `address-${walletId}-${chain}-${currency}-${Date.now()}`,
      chain,
      currency
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error generating wallet address:', error);
    throw error;
  }
};

/**
 * Get wallet details
 * @param walletId - The Circle wallet ID
 */
export const getWallet = async (walletId: string) => {
  try {
    const circleClient = createCircleClient();
    const response = await circleClient.get(`/v1/wallets/${walletId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    throw error;
  }
};

/**
 * Get wallet balance
 * @param walletId - The Circle wallet ID
 */
export const getWalletBalance = async (walletId: string) => {
  try {
    const circleClient = createCircleClient();
    const response = await circleClient.get(`/v1/wallets/${walletId}/balances`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
};

/**
 * Transfer USDC between wallets
 * @param sourceWalletId - Source wallet ID
 * @param destinationWalletId - Destination wallet ID
 * @param amount - Amount to transfer (in USD cents, e.g., 1000 = $10.00)
 * @param idempotencyKey - Unique key to prevent duplicate transfers
 */
export const transferBetweenWallets = async (
  sourceWalletId: string,
  destinationWalletId: string,
  amount: number,
  idempotencyKey = `transfer-${Date.now()}`
) => {
  try {
    const circleClient = createCircleClient();
    const response = await circleClient.post('/v1/transfers', {
      idempotencyKey,
      source: {
        type: 'wallet',
        id: sourceWalletId
      },
      destination: {
        type: 'wallet',
        id: destinationWalletId
      },
      amount: {
        amount: amount.toString(),
        currency: 'USD'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error transferring between wallets:', error);
    throw error;
  }
};

/**
 * Get transaction history for a wallet
 * @param walletId - The Circle wallet ID
 * @param pageSize - Number of transactions per page
 * @param pageNumber - Page number
 */
export const getTransactionHistory = async (walletId: string, pageSize = 50, pageNumber = 1) => {
  try {
    const circleClient = createCircleClient();
    const response = await circleClient.get(`/v1/wallets/${walletId}/transactions`, {
      params: {
        pageSize,
        pageNumber
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};
