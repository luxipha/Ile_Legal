#!/usr/bin/env node

/**
 * Test the Edge Function with a real JWT from browser session
 * Run this while your browser is open with the logged-in session
 */

const https = require('https');

const TEST_CONFIG = {
  EDGE_FUNCTION_URL: 'https://pleuwhgjpjnkqvbemmhl.supabase.co/functions/v1/create-wallet',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXV3aGdqcGpua3F2YmVtbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzQ0NzMsImV4cCI6MjA2NTQxMDQ3M30.lAGzWtcKYtREgCHEU4n15gtPclQrNoBv6tXk836XkeE',
  // You need to copy the full JWT from browser console
  USER_JWT: process.argv[2] || 'PROVIDE_JWT_AS_ARGUMENT'
};

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    console.log('📡 Making request with options:', {
      hostname: options.hostname,
      path: options.path,
      method: options.method,
      headers: Object.keys(options.headers)
    });
    
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

async function testEdgeFunctionWithRealJWT() {
  console.log('🧪 Testing Edge Function with Real JWT');
  console.log('=' .repeat(50));
  
  if (TEST_CONFIG.USER_JWT === 'PROVIDE_JWT_AS_ARGUMENT') {
    console.log('❌ Please provide JWT as argument:');
    console.log('   node test-edge-function-live.cjs "your-jwt-token-here"');
    console.log('');
    console.log('📋 To get JWT:');
    console.log('   1. Open browser dev tools (F12)');
    console.log('   2. Go to Console tab');
    console.log('   3. Look for the access_token in the session logs');
    console.log('   4. Copy the full token and pass it as argument');
    return;
  }
  
  const requestBody = {
    userId: '46f305a1-370b-4a7a-98ea-f909d7666e57', // From your logs
    userType: 'buyer',
    name: 'Sabeoria Team',
    email: 'abisoye744@gmail.com'
  };
  
  const url = new URL(TEST_CONFIG.EDGE_FUNCTION_URL);
  const postData = JSON.stringify(requestBody);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.USER_JWT}`,
      'apikey': TEST_CONFIG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('🔗 URL:', TEST_CONFIG.EDGE_FUNCTION_URL);
  console.log('👤 User ID:', requestBody.userId);
  console.log('🔑 JWT Preview:', TEST_CONFIG.USER_JWT.substring(0, 50) + '...');
  
  try {
    const response = await makeRequest(options, postData);
    console.log('\n📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.json) {
      console.log('\n📋 Parsed Response:');
      console.log(JSON.stringify(response.json, null, 2));
    }
    
    if (response.status === 401) {
      console.log('\n🔍 401 Analysis:');
      if (response.body.includes('Invalid JWT')) {
        console.log('❌ JWT token is invalid or expired');
      } else if (response.body.includes('Invalid credentials')) {
        console.log('❌ Circle API credentials issue');
      }
    } else if (response.status === 500) {
      console.log('\n🔍 500 Analysis:');
      if (response.body.includes('Circle API error: 401')) {
        console.log('❌ Circle API rejecting our encryption');
        console.log('🔧 Web Crypto implementation may not match node-forge output');
      } else if (response.body.includes('encrypt')) {
        console.log('❌ Encryption error in Edge Function');
      }
    } else if (response.status >= 200 && response.status < 300) {
      console.log('\n✅ SUCCESS! Wallet creation worked!');
    }
    
  } catch (error) {
    console.log('💥 Request failed:', error.message);
  }
}

console.log('🎯 Live Edge Function Tester');
console.log('📝 This will test with your current browser session JWT');
console.log('');

testEdgeFunctionWithRealJWT().catch(console.error);