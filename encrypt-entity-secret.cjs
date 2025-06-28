#!/usr/bin/env node

/**
 * Encrypt Entity Secret with Circle's Public Key
 * This generates fresh ciphertext that can be used for wallet creation
 */

const crypto = require('crypto');

// Circle's entity public key (from API)
const ENTITY_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
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
-----END PUBLIC KEY-----`;

// Your entity secret (the raw secret value)
const ENTITY_SECRET = '728de8dc586450a9d12ed504fb36467364b1442280e422b715e65e88ee9c4391';

function encryptEntitySecret() {
  console.log('🔐 Encrypting Entity Secret with Circle Public Key...');
  console.log('='.repeat(60));
  
  try {
    // Convert entity secret to buffer
    const secretBuffer = Buffer.from(ENTITY_SECRET, 'utf8');
    
    console.log('📝 Entity Secret (plaintext):', ENTITY_SECRET);
    console.log('📏 Secret Length:', ENTITY_SECRET.length, 'characters');
    
    // Encrypt using RSA-OAEP with SHA-256
    const encrypted = crypto.publicEncrypt({
      key: ENTITY_PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, secretBuffer);
    
    // Convert to base64
    const encryptedBase64 = encrypted.toString('base64');
    
    console.log('\n✅ Encryption successful!');
    console.log('🔒 Encrypted Ciphertext (base64):');
    console.log(encryptedBase64);
    console.log('\n📏 Ciphertext Length:', encryptedBase64.length, 'characters');
    
    return encryptedBase64;
    
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    return null;
  }
}

// Generate multiple fresh ciphertexts
function generateMultipleCiphertexts(count = 3) {
  console.log(`\n🔄 Generating ${count} Fresh Ciphertexts...`);
  console.log('='.repeat(60));
  
  const ciphertexts = [];
  
  for (let i = 1; i <= count; i++) {
    console.log(`\n🔢 Ciphertext #${i}:`);
    const ciphertext = encryptEntitySecret();
    if (ciphertext) {
      ciphertexts.push(ciphertext);
      console.log('✅ Generated successfully');
    } else {
      console.log('❌ Generation failed');
    }
  }
  
  return ciphertexts;
}

// Main execution
console.log('🧪 Circle Entity Secret Encryption Tool');
console.log('🎯 Purpose: Generate fresh entity secret ciphertext for wallet creation');
console.log('=' .repeat(70));

const freshCiphertexts = generateMultipleCiphertexts(3);

if (freshCiphertexts.length > 0) {
  console.log('\n🎉 Success! You now have fresh entity secret ciphertexts.');
  console.log('\n📋 Usage Instructions:');
  console.log('1. Use any of these ciphertexts for your next wallet creation request');
  console.log('2. Each ciphertext can only be used ONCE');
  console.log('3. Generate new ciphertext for each subsequent request');
  
  console.log('\n🔐 Fresh Ciphertexts for Testing:');
  freshCiphertexts.forEach((ciphertext, index) => {
    console.log(`\n${index + 1}. ${ciphertext}`);
  });
  
  console.log('\n🧪 Ready to test wallet creation with fresh ciphertext!');
} else {
  console.log('\n❌ Failed to generate any ciphertexts');
}