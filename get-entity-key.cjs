#!/usr/bin/env node

/**
 * Get Entity Public Key from Circle API
 * We need this to encrypt the entity secret
 */

const https = require('https');

const CIRCLE_CONFIG = {
  API_KEY: 'TEST_API_KEY:10a0b7b4cedfaa42d6ce306592fec59f:cfae665cde083f9236de7be92d08f54c',
  API_URL: 'https://api.circle.com'
};

// Helper function to make HTTP requests
function makeRequest(options) {
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
    req.end();
  });
}

// Get entity public key
async function getEntityPublicKey() {
  console.log('🔑 Getting Entity Public Key from Circle API...');
  console.log('='.repeat(50));
  
  const url = new URL('/v1/w3s/config/entity/publicKey', CIRCLE_CONFIG.API_URL);
  
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
  
  try {
    const response = await makeRequest(options);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.status === 200 && response.json) {
      console.log('✅ Public key retrieved successfully!');
      return response.json.data;
    } else {
      console.log('❌ Failed to get public key');
      return null;
    }
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return null;
  }
}

// Run the test
getEntityPublicKey().then(publicKey => {
  if (publicKey) {
    console.log('\n🎯 Next Steps:');
    console.log('1. Use this public key to encrypt your entity secret');
    console.log('2. Generate fresh ciphertext for each wallet creation');
    console.log('\n📝 Entity Secret to encrypt:', '728de8dc586450a9d12ed504fb36467364b1442280e422b715e65e88ee9c4391');
    console.log('🔐 Public Key:', JSON.stringify(publicKey, null, 2));
  } else {
    console.log('\n❌ Could not retrieve entity public key');
  }
}).catch(console.error);