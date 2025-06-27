#!/usr/bin/env node

/**
 * Test Web Crypto API encryption locally to verify it matches node-forge results
 */

const crypto = require('crypto');

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

// Convert hex string to Buffer
function hexToBytes(hex) {
  return Buffer.from(hex, 'hex');
}

// Parse PEM public key to get the key data
function parsePemPublicKey(pemKey) {
  const base64Key = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .trim();
  
  return Buffer.from(base64Key, 'base64');
}

async function testWebCryptoEncryption() {
  console.log('🧪 Testing Web Crypto API Encryption (Node.js equivalent)');
  console.log('=' .repeat(60));
  
  try {
    // Convert hex entity secret to bytes
    const entitySecretBytes = hexToBytes(CIRCLE_CONFIG.ENTITY_SECRET_HEX);
    console.log('📝 Entity secret bytes length:', entitySecretBytes.length);
    
    // Parse the PEM public key
    const publicKeyData = parsePemPublicKey(CIRCLE_CONFIG.PUBLIC_KEY_PEM);
    console.log('🔑 Public key data length:', publicKeyData.length);
    
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
    
    console.log('✅ Encryption successful!');
    console.log('📏 Ciphertext length:', ciphertext.length);
    console.log('🔒 Ciphertext preview:', ciphertext.substring(0, 50) + '...');
    
    return ciphertext;
    
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    return null;
  }
}

// Run the test
testWebCryptoEncryption().then(result => {
  if (result) {
    console.log('\n🎉 Web Crypto equivalent encryption working!');
    console.log('🔧 This should work in the Deno Edge Function.');
  } else {
    console.log('\n❌ Encryption test failed.');
  }
}).catch(console.error);