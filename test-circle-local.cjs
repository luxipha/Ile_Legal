#!/usr/bin/env node

/**
 * Local Circle API Test Script
 * Tests Circle API credentials and wallet creation locally
 * Helps debug authentication issues before deploying to Edge Functions
 */

const https = require('https');

// Circle API Configuration with FRESH ciphertext
const CIRCLE_CONFIG = {
  API_KEY: 'TEST_API_KEY:10a0b7b4cedfaa42d6ce306592fec59f:cfae665cde083f9236de7be92d08f54c',
  API_URL: 'https://api.circle.com',
  WALLET_SET_ID: '4150e7d9-990e-5310-8f10-f2d03ca86d09', // Valid wallet set from API response
  FRESH_ENTITY_SECRET: 'dsozhAZndKQQL2+JmPwaHegB+ixVR2opZ2G5KyOfHJZ4oSleHK/EevLzEoK0YO1fVkPBIYY6pdDi6NuLvxSSTO9NUtLmH9ujjz2x0arSDbU830WRwjQoMNczimjQxw4jPmVEf2hN5sGunAKmStOieyffq6GUMZeKIOfK6EQbaa6F5WYJyB+juDOGJE34MfbBDJ3bnpm7jrhPQjAAFqqjg8VzhIdRxjXFTsq4hPWrlPKQQePP1RKAR8a7Oan086hsDntTdqvn8wHFqR+wcoJl0OLP412kxnDyr9kSafqUlvX/zYvkARzOoEzRsO9ypDdJZRZD72blHFQPJhSisXaS0d8ea8T8JgMaew6n0q54C1FPh9sO3F15elZoys8Pjju9RjaXSEtY86BTCZrCMkl6hDqCcOtMdc26nc688ZppylEh0+452b1xaSMqM5qfg1TXMY2Bp/jUDHFuJ4FDe+2d1OiFmqiuTvP3k1JSDMFwSJXzzbsdoEfVdMXIodjVvFJ1xUmdo73e8RxYhrWEpY2K4+c5gAUlM2tvt9DFeFCj7z1yYF2LSlBRcgzrMcPiVaqhYGEvsBdJktBcWmRGPS/nkidq/pQ5I4C1naPLzzqy3aInwiCwalme3o7rTIVkz5/NY2lINSo41kUFht2yciRbgcVOwB7gxfMALe7JDiPH3pQ=' // Fresh encrypted ciphertext
};

// Helper function to generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: null,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test 1: Basic API Authentication
async function testAuthentication() {
  console.log('🔐 Testing Circle API Authentication...');
  console.log('='.repeat(50));
  
  const url = new URL('/v1/w3s/walletSets', CIRCLE_CONFIG.API_URL);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CIRCLE_CONFIG.API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  console.log('📡 Request URL:', `${CIRCLE_CONFIG.API_URL}${url.pathname}`);
  console.log('🔑 Authorization:', `Bearer ${CIRCLE_CONFIG.API_KEY.substring(0, 20)}...`);
  
  try {
    const response = await makeRequest(options);
    console.log('📊 Response Status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Authentication successful!');
      console.log('📦 Wallet Sets:', JSON.stringify(response.json, null, 2));
      return true;
    } else {
      console.log('❌ Authentication failed!');
      console.log('📝 Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return false;
  }
}

// Test 2: Wallet Creation with proper UUID and ETH-SEPOLIA
async function testWalletCreation() {
  console.log('\n🏦 Testing Wallet Creation (ETH-SEPOLIA)...');
  console.log('='.repeat(50));
  
  const idempotencyKey = generateUUID(); // Proper UUID v4
  const url = new URL('/v1/w3s/developer/wallets', CIRCLE_CONFIG.API_URL);
  
  const requestBody = {
    walletSetId: CIRCLE_CONFIG.WALLET_SET_ID,
    entitySecretCiphertext: CIRCLE_CONFIG.FRESH_ENTITY_SECRET,
    idempotencyKey: idempotencyKey,
    blockchains: ['ETH-SEPOLIA'] // Required field with valid value
  };
  
  const postData = JSON.stringify(requestBody);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CIRCLE_CONFIG.API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('📡 Request URL:', `${CIRCLE_CONFIG.API_URL}${url.pathname}`);
  console.log('📝 Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('🔑 Authorization:', `Bearer ${CIRCLE_CONFIG.API_KEY.substring(0, 20)}...`);
  
  try {
    const response = await makeRequest(options, postData);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Wallet creation successful!');
      if (response.json) {
        console.log('🏦 Created Wallet:', JSON.stringify(response.json, null, 2));
      }
      return true;
    } else {
      console.log('❌ Wallet creation failed!');
      return false;
    }
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return false;
  }
}

// Test 3: Using your exact working axios parameters with proper UUID
async function testWithAxiosLikeParams() {
  console.log('\n🔄 Testing with Your Working Axios Code (MATIC-AMOY)...');
  console.log('='.repeat(50));
  
  const idempotencyKey = generateUUID(); // Use proper UUID v4
  
  // Using fresh ciphertext with MATIC-AMOY
  const requestBody = {
    idempotencyKey: idempotencyKey,
    blockchains: ['MATIC-AMOY'], // From your working code
    entitySecretCiphertext: CIRCLE_CONFIG.FRESH_ENTITY_SECRET, // Fresh ciphertext
    walletSetId: CIRCLE_CONFIG.WALLET_SET_ID // Valid wallet set
  };
  
  const url = new URL('/v1/w3s/developer/wallets', CIRCLE_CONFIG.API_URL);
  const postData = JSON.stringify(requestBody);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CIRCLE_CONFIG.API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('📝 Request (using your working code structure with proper UUID):');
  console.log(JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await makeRequest(options, postData);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Working axios pattern successful!');
      return true;
    } else {
      console.log('❌ Working axios pattern failed!');
      return false;
    }
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Circle API Local Testing Suite');
  console.log('🎯 Purpose: Debug authentication issues before Edge Function deployment');
  console.log('='.repeat(70));
  
  const results = {
    auth: false,
    walletCreation: false,
    axiosStyle: false
  };
  
  // Test 1: Authentication
  results.auth = await testAuthentication();
  
  // Test 2: Wallet Creation (only if auth works)
  if (results.auth) {
    results.walletCreation = await testWalletCreation();
  } else {
    console.log('\n⏭️  Skipping wallet creation test due to auth failure');
  }
  
  // Test 3: Axios-style test (most important)
  results.axiosStyle = await testWithAxiosLikeParams();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`🔐 Authentication: ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🏦 Wallet Creation: ${results.walletCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔄 Axios-style: ${results.axiosStyle ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.auth && (results.walletCreation || results.axiosStyle)) {
    console.log('\n🎉 Local API test successful! The issue is likely in the Edge Function environment.');
    console.log('🔍 Next steps: Check Supabase secrets and Edge Function logs.');
  } else {
    console.log('\n🚨 Local API test failed! Check your API credentials and configuration.');
  }
  
  return results;
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAuthentication, testWalletCreation, testWithAxiosLikeParams, runTests };