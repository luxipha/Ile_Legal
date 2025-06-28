#!/usr/bin/env node

/**
 * Test Circle API with proper node-forge encryption
 * Following Circle's official documentation
 */

const https = require('https');

// Install node-forge first: npm install node-forge
let forge;
try {
  forge = require('node-forge');
} catch (error) {
  console.error('❌ node-forge not installed. Please run: npm install node-forge');
  process.exit(1);
}

// Circle configuration
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

// Helper functions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateFreshCiphertext() {
  console.log('🔐 Generating fresh ciphertext using Circle\'s method...');
  
  try {
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
    
    console.log('✅ Encryption successful!');
    console.log('📏 Ciphertext length:', ciphertext.length);
    
    return ciphertext;
    
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

// Test wallet creation
async function testWalletCreation() {
  console.log('\n🏦 Testing Wallet Creation with Proper Forge Encryption');
  console.log('='.repeat(60));
  
  const idempotencyKey = generateUUID();
  const freshCiphertext = generateFreshCiphertext();
  
  if (!freshCiphertext) {
    console.log('❌ Failed to generate fresh ciphertext');
    return false;
  }
  
  console.log('🆔 Idempotency Key:', idempotencyKey);
  console.log('🔒 Fresh Ciphertext:', freshCiphertext.substring(0, 50) + '...');
  
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
  
  console.log('\n📡 Making wallet creation request...');
  
  try {
    const response = await makeRequest(options, postData);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('\n✅ SUCCESS! Wallet creation worked!');
      if (response.json && response.json.data) {
        console.log('🏦 Created Wallet Details:');
        console.log(JSON.stringify(response.json.data, null, 2));
      }
      return true;
    } else {
      console.log('\n❌ Wallet creation failed');
      return false;
    }
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return false;
  }
}

// Main execution
console.log('🧪 Circle API Test with Official Node-Forge Method');
console.log('🎯 Using Circle\'s exact encryption method from documentation');
console.log('='.repeat(70));

testWalletCreation().then(success => {
  if (success) {
    console.log('\n🎉 BREAKTHROUGH! The official method works!');
    console.log('🔧 Now we can update the Edge Function with this approach.');
  } else {
    console.log('\n❌ Still having issues. May need to check entity secret or other parameters.');
  }
}).catch(console.error);