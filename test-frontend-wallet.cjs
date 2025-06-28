#!/usr/bin/env node

/**
 * Test the frontend wallet service logic using Node.js
 * This simulates what happens in the browser without authentication
 */

// Install node-forge first: npm install node-forge
let forge;
try {
  forge = require('node-forge');
} catch (error) {
  console.error('❌ node-forge not installed. Please run: npm install node-forge');
  process.exit(1);
}

const https = require('https');

// Circle configuration (same as frontend)
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

/**
 * Generate fresh entity secret ciphertext using node-forge (same as frontend)
 */
function generateFreshEntitySecretCiphertext() {
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
 * Generate UUID v4 for idempotency (same as frontend)
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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

// Test the frontend wallet creation logic
async function testFrontendWalletCreation() {
  console.log('🧪 Testing Frontend Wallet Service Logic');
  console.log('🎯 Using exact same code as the frontend service');
  console.log('=' .repeat(60));
  
  try {
    // Simulate frontend wallet creation request
    const request = {
      userId: 'test-frontend-user-12345',
      userType: 'buyer',
      name: 'Frontend Test User',
      email: 'frontend-test@example.com'
    };
    
    console.log('🏦 Creating wallet via frontend logic for user:', request.userId);

    // Generate fresh ciphertext using node-forge (the working method)
    const entitySecretCiphertext = generateFreshEntitySecretCiphertext();
    
    // Generate UUID v4 for idempotency
    const idempotencyKey = generateUUID();
    
    console.log('🆔 Generated idempotency key:', idempotencyKey);
    console.log('🔒 Generated ciphertext preview:', entitySecretCiphertext.substring(0, 50) + '...');

    // Create wallet description
    const walletDescription = `${request.userType.charAt(0).toUpperCase() + request.userType.slice(1)} wallet for ${request.name}`;
    console.log('📝 Wallet description:', walletDescription);

    // Call Circle API directly (same as frontend)
    console.log('\n📡 Making direct Circle API request...');
    
    const url = new URL('/v1/w3s/developer/wallets', CIRCLE_CONFIG.API_URL);
    const requestBody = {
      idempotencyKey: idempotencyKey,
      blockchains: ['MATIC-AMOY'],
      entitySecretCiphertext: entitySecretCiphertext,
      walletSetId: CIRCLE_CONFIG.WALLET_SET_ID
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
    
    const response = await makeRequest(options, postData);
    console.log('📊 Circle API response status:', response.status);
    console.log('📄 Circle API response:', response.body);

    if (response.status >= 200 && response.status < 300 && response.json) {
      const circleData = response.json;
      const wallet = circleData.data.wallets[0]; // Circle returns array for developer wallets

      console.log('\n✅ SUCCESS! Frontend wallet creation logic works!');
      console.log('🏦 Created wallet details:');
      console.log('   - Wallet ID:', wallet.id);
      console.log('   - Address:', wallet.address);
      console.log('   - State:', wallet.state);
      console.log('   - Blockchain:', wallet.blockchain);
      console.log('   - Account Type:', wallet.accountType);
      
      console.log('\n🎉 BREAKTHROUGH! The frontend approach works perfectly!');
      console.log('🔧 This will work in your browser for Google OAuth signup!');
      
      return true;
    } else {
      console.log('\n❌ Circle API request failed');
      if (response.status === 401) {
        console.log('🔑 Authentication issue with Circle API');
      } else if (response.status === 400) {
        console.log('📝 Request validation issue');
      }
      return false;
    }
    
  } catch (error) {
    console.error('\n💥 Frontend wallet test failed:', error.message);
    return false;
  }
}

// Run the test
console.log('🚀 Frontend Wallet Service Test');
console.log('📱 Simulating browser-based wallet creation');
console.log('');

testFrontendWalletCreation().then(success => {
  if (success) {
    console.log('\n🎊 FRONTEND WALLET SERVICE IS READY!');
    console.log('✅ Google OAuth signup should now work successfully');
    console.log('✅ No more Edge Function authentication issues');
    console.log('✅ Using proven node-forge encryption');
  } else {
    console.log('\n❌ Frontend wallet service needs debugging');
  }
}).catch(console.error);