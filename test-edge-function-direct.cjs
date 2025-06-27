#!/usr/bin/env node

/**
 * Test the Edge Function directly to see what's failing
 */

const https = require('https');

const TEST_CONFIG = {
  EDGE_FUNCTION_URL: 'https://pleuwhgjpjnkqvbemmhl.supabase.co/functions/v1/create-wallet',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXV3aGdqcGpua3F2YmVtbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzQ0NzMsImV4cCI6MjA2NTQxMDQ3M30.lAGzWtcKYtREgCHEU4n15gtPclQrNoBv6tXk836XkeE',
  // You'll need to provide a valid user JWT token
  USER_JWT: 'NEED_REAL_JWT_TOKEN'
};

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

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function Directly');
  console.log('=' .repeat(50));
  
  const requestBody = {
    userId: 'test-user-123',
    userType: 'buyer',
    name: 'Test User',
    email: 'test@example.com'
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
  
  console.log('📡 Making request to Edge Function...');
  console.log('🔗 URL:', TEST_CONFIG.EDGE_FUNCTION_URL);
  
  try {
    const response = await makeRequest(options, postData);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('📝 Response Body:', response.body);
    
    if (response.status === 401) {
      console.log('\n🔍 Analysis: 401 Unauthorized');
      if (TEST_CONFIG.USER_JWT === 'NEED_REAL_JWT_TOKEN') {
        console.log('❌ Need real JWT token for testing');
      } else {
        console.log('❌ JWT token might be invalid or expired');
      }
    } else if (response.status === 500) {
      console.log('\n🔍 Analysis: 500 Internal Server Error');
      console.log('❌ There\'s an error in the Edge Function code');
      if (response.body.includes('node-forge')) {
        console.log('🔧 Possible node-forge compatibility issue with Deno');
      }
    }
    
  } catch (error) {
    console.log('💥 Request failed:', error.message);
  }
}

console.log('⚠️  NOTE: This test requires a valid JWT token');
console.log('🔧 You can get one from the browser\'s Network tab when making a real request\n');

testEdgeFunction().catch(console.error);