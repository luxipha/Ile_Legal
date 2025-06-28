#!/usr/bin/env node

/**
 * Test wallet creation with dynamically generated fresh ciphertext
 */

const https = require('https');
const crypto = require('crypto');

// Circle configuration
const CIRCLE_CONFIG = {
  API_KEY: 'TEST_API_KEY:10a0b7b4cedfaa42d6ce306592fec59f:cfae665cde083f9236de7be92d08f54c',
  API_URL: 'https://api.circle.com',
  WALLET_SET_ID: '4150e7d9-990e-5310-8f10-f2d03ca86d09',
  ENTITY_SECRET: '728de8dc586450a9d12ed504fb36467364b1442280e422b715e65e88ee9c4391',
  PUBLIC_KEY: `-----BEGIN PUBLIC KEY-----
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

// Helper functions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateFreshCiphertext() {
  try {
    // Use original entity secret - RSA encryption with random padding should make each result unique
    const secretBuffer = Buffer.from(CIRCLE_CONFIG.ENTITY_SECRET, 'utf8');
    
    const encrypted = crypto.publicEncrypt({
      key: CIRCLE_CONFIG.PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, secretBuffer);
    
    return encrypted.toString('base64');
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    return null;
  }
}

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

// Test wallet creation with fresh ciphertext
async function testWalletCreation() {
  console.log('🧪 Testing Wallet Creation with Dynamic Fresh Ciphertext');
  console.log('='.repeat(60));
  
  const idempotencyKey = generateUUID();
  const freshCiphertext = generateFreshCiphertext();
  
  if (!freshCiphertext) {
    console.log('❌ Failed to generate fresh ciphertext');
    return false;
  }
  
  console.log('🔑 Generated fresh ciphertext:', freshCiphertext.substring(0, 50) + '...');
  console.log('🆔 Idempotency Key:', idempotencyKey);
  
  const requestBody = {
    idempotencyKey: idempotencyKey,
    blockchains: ['MATIC-AMOY'],
    entitySecretCiphertext: freshCiphertext,
    walletSetId: CIRCLE_CONFIG.WALLET_SET_ID
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
  
  console.log('📡 Making request to:', `${CIRCLE_CONFIG.API_URL}${url.pathname}`);
  
  try {
    const response = await makeRequest(options, postData);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Wallet creation successful!');
      if (response.json && response.json.data) {
        console.log('🏦 Created Wallet Details:');
        console.log(JSON.stringify(response.json.data, null, 2));
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

// Run the test
console.log('🚀 Starting Dynamic Wallet Creation Test');
console.log('🎯 This test generates fresh ciphertext for each request');
console.log('='.repeat(70));

testWalletCreation().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS! Wallet creation worked with fresh ciphertext!');
    console.log('🔧 Now we can apply this to the Edge Function.');
  } else {
    console.log('\n❌ Test failed. Need to investigate further.');
  }
}).catch(console.error);