/**
 * Utility to test Circle API configuration and connection
 */

import { testCircleConnection } from '../services/circleApi';
import { SettingsService } from '../services/settingsService';

export const testCircleApiConfiguration = async () => {
  console.log('🔍 Testing Circle API Configuration...');
  
  try {
    // Test 1: Check if Circle config is loaded correctly
    console.log('1. Loading Circle configuration from settings...');
    const circleConfig = await SettingsService.getCircleConfig();
    
    if (!circleConfig) {
      console.error('❌ Circle configuration not found');
      return false;
    }
    
    console.log('✅ Circle configuration loaded:', {
      name: circleConfig.name,
      enabled: circleConfig.enabled,
      testMode: circleConfig.testMode,
      hasApiKey: !!circleConfig.apiKey,
      hasEscrowWallet: !!circleConfig.escrowWalletId,
      apiKeyLength: circleConfig.apiKey?.length || 0
    });
    
    // Test 2: Validate API key format
    console.log('2. Validating API key format...');
    if (!circleConfig.apiKey) {
      console.error('❌ No API key found');
      return false;
    }
    
    // Check if it's Base64 encoded
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(circleConfig.apiKey);
    console.log(`API key appears to be Base64: ${isBase64}`);
    
    // Try to decode if it looks like Base64
    if (isBase64) {
      try {
        const decoded = atob(circleConfig.apiKey);
        console.log('✅ API key successfully decoded from Base64');
        console.log('Decoded format:', decoded.substring(0, 20) + '...');
      } catch (error) {
        console.error('❌ Failed to decode Base64 API key:', error);
      }
    }
    
    // Test 3: Test API connection
    console.log('3. Testing Circle API connection...');
    const connectionResult = await testCircleConnection();
    
    if (connectionResult.success) {
      console.log('✅ Circle API connection successful!');
      console.log('Response data:', connectionResult.data);
    } else {
      console.error('❌ Circle API connection failed:', connectionResult.error);
      
      // Provide specific troubleshooting based on error
      if (connectionResult.error?.includes('401')) {
        console.log('💡 Troubleshooting 401 Unauthorized:');
        console.log('   - Check if API key is correct');
        console.log('   - Verify if API key is properly formatted');
        console.log('   - Ensure you\'re using the right environment (sandbox vs production)');
      }
    }
    
    return connectionResult.success;
    
  } catch (error) {
    console.error('❌ Error during Circle API testing:', error);
    return false;
  }
};

/**
 * Test different API key formats
 */
export const testApiKeyFormats = async (rawApiKey: string) => {
  console.log('🔧 Testing different API key formats...');
  
  const formats = [
    { name: 'Raw (as provided)', value: rawApiKey },
    { name: 'Base64 Encoded', value: btoa(rawApiKey) },
    { name: 'Base64 Decoded', value: (() => {
      try {
        return atob(rawApiKey);
      } catch {
        return null;
      }
    })() }
  ];
  
  for (const format of formats) {
    if (!format.value) continue;
    
    console.log(`Testing format: ${format.name}`);
    console.log(`Key length: ${format.value.length}`);
    console.log(`Key preview: ${format.value.substring(0, 20)}...`);
    
    // Here you could temporarily update the settings and test
    // For now, just log the format analysis
  }
};