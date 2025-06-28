#!/usr/bin/env node

/**
 * Compare node-forge vs Node.js crypto (Web Crypto equivalent) encryption outputs
 * to debug why Circle API is rejecting Web Crypto encryption
 */

const crypto = require('crypto');

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

// Node-forge encryption (Circle's working method)
function generateCiphertextForge() {
  console.log('🔐 Node-forge Encryption (Known Working):');
  
  try {
    // Convert hex entity secret to bytes (Circle's way)
    const entitySecret = forge.util.hexToBytes(CIRCLE_CONFIG.ENTITY_SECRET_HEX);
    console.log('📝 Entity secret length:', entitySecret.length);
    
    // Parse the public key (Circle's way)  
    const publicKey = forge.pki.publicKeyFromPem(CIRCLE_CONFIG.PUBLIC_KEY_PEM);
    console.log('🔑 Public key loaded');
    
    // Encrypt using RSA-OAEP with SHA-256 (Circle's exact method)
    const encryptedData = publicKey.encrypt(entitySecret, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });
    
    // Encode to base64 (Circle's way)
    const ciphertext = forge.util.encode64(encryptedData);
    
    console.log('✅ Forge encryption successful');
    console.log('📏 Ciphertext length:', ciphertext.length);
    console.log('🔒 First 100 chars:', ciphertext.substring(0, 100));
    console.log('');
    
    return ciphertext;
    
  } catch (error) {
    console.error('❌ Forge encryption failed:', error.message);
    return null;
  }
}

// Node.js crypto encryption (Web Crypto equivalent)
function generateCiphertextNodeCrypto() {
  console.log('🔐 Node.js Crypto Encryption (Web Crypto Equivalent):');
  
  try {
    // Convert hex entity secret to bytes
    const entitySecretBytes = Buffer.from(CIRCLE_CONFIG.ENTITY_SECRET_HEX, 'hex');
    console.log('📝 Entity secret length:', entitySecretBytes.length);
    
    // Use Node.js crypto for RSA-OAEP encryption (equivalent to Web Crypto API)
    const encryptedData = crypto.publicEncrypt(
      {
        key: CIRCLE_CONFIG.PUBLIC_KEY_PEM,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      entitySecretBytes
    );
    
    // Convert to base64
    const ciphertext = encryptedData.toString('base64');
    
    console.log('✅ Node crypto encryption successful');
    console.log('📏 Ciphertext length:', ciphertext.length);
    console.log('🔒 First 100 chars:', ciphertext.substring(0, 100));
    console.log('');
    
    return ciphertext;
    
  } catch (error) {
    console.error('❌ Node crypto encryption failed:', error.message);
    return null;
  }
}

// Compare the outputs
async function compareEncryption() {
  console.log('🔍 Encryption Method Comparison');
  console.log('=' .repeat(60));
  console.log('');
  
  const forgeCiphertext = generateCiphertextForge();
  const nodeCiphertext = generateCiphertextNodeCrypto();
  
  if (forgeCiphertext && nodeCiphertext) {
    console.log('📊 Comparison Results:');
    console.log('🔢 Forge length:', forgeCiphertext.length);
    console.log('🔢 Node length:', nodeCiphertext.length);
    console.log('📏 Length match:', forgeCiphertext.length === nodeCiphertext.length);
    console.log('');
    
    // Compare first 100 characters
    const forgeFirst100 = forgeCiphertext.substring(0, 100);
    const nodeFirst100 = nodeCiphertext.substring(0, 100);
    console.log('🔤 First 100 chars match:', forgeFirst100 === nodeFirst100);
    
    if (forgeFirst100 !== nodeFirst100) {
      console.log('');
      console.log('❌ OUTPUTS ARE DIFFERENT:');
      console.log('🟢 Forge:', forgeFirst100);
      console.log('🔴 Node: ', nodeFirst100);
      console.log('');
      console.log('💡 This explains why Circle API rejects Web Crypto encryption!');
      console.log('🔧 RSA-OAEP with random padding produces different outputs each time');
      console.log('🎯 Both should work with Circle API, but let\'s verify...');
    } else {
      console.log('✅ Both methods produce identical output');
    }
    
    // Return both for testing
    return { forge: forgeCiphertext, node: nodeCiphertext };
  }
  
  return null;
}

// Test both ciphertexts with Circle API
async function testBothWithCircle(ciphertexts) {
  console.log('');
  console.log('🧪 Testing Both Ciphertexts with Circle API');
  console.log('=' .repeat(50));
  
  const https = require('https');
  
  const CIRCLE_TEST_CONFIG = {
    API_KEY: 'TEST_API_KEY:10a0b7b4cedfaa42d6ce306592fec59f:cfae665cde083f9236de7be92d08f54c',
    API_URL: 'https://api.circle.com',
    WALLET_SET_ID: '4150e7d9-990e-5310-8f10-f2d03ca86d09'
  };
  
  function makeRequest(ciphertext, label) {
    return new Promise((resolve) => {
      const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const requestBody = {
        idempotencyKey: idempotencyKey,
        blockchains: ['MATIC-AMOY'],
        entitySecretCiphertext: ciphertext,
        walletSetId: CIRCLE_TEST_CONFIG.WALLET_SET_ID
      };
      
      const url = new URL('/v1/w3s/developer/wallets', CIRCLE_TEST_CONFIG.API_URL);
      const postData = JSON.stringify(requestBody);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CIRCLE_TEST_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`${label} Result: ${res.statusCode} - ${data.substring(0, 100)}...`);
          resolve({ status: res.statusCode, body: data });
        });
      });
      
      req.on('error', (error) => {
        console.log(`${label} Error:`, error.message);
        resolve({ error: error.message });
      });
      
      req.write(postData);
      req.end();
    });
  }
  
  // Test forge ciphertext
  await makeRequest(ciphertexts.forge, '🟢 Forge');
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test node ciphertext  
  await makeRequest(ciphertexts.node, '🔴 Node ');
}

// Main execution
compareEncryption().then(async (ciphertexts) => {
  if (ciphertexts) {
    await testBothWithCircle(ciphertexts);
  }
}).catch(console.error);