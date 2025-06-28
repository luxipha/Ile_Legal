#!/usr/bin/env node

/**
 * Test the Edge Function CORS and basic connectivity
 */

const https = require('https');

const TEST_CONFIG = {
  EDGE_FUNCTION_URL: 'https://pleuwhgjpjnkqvbemmhl.supabase.co/functions/v1/create-wallet',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXV3aGdqcGpua3F2YmVtbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzQ0NzMsImV4cCI6MjA2NTQxMDQ3M30.lAGzWtcKYtREgCHEU4n15gtPclQrNoBv6tXk836XkeE'
};

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testCORS() {
  console.log('🧪 Testing Edge Function CORS (OPTIONS request)');
  console.log('=' .repeat(50));
  
  const url = new URL(TEST_CONFIG.EDGE_FUNCTION_URL);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'OPTIONS',
    headers: {
      'apikey': TEST_CONFIG.SUPABASE_ANON_KEY,
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization, content-type'
    }
  };
  
  console.log('📡 Making OPTIONS request...');
  
  try {
    const response = await makeRequest(options);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('📝 Response Body:', response.body);
    
    if (response.status === 200) {
      console.log('\n✅ SUCCESS! Edge Function is deployed and responding!');
      console.log('🔧 The Web Crypto encryption deployment worked!');
    } else {
      console.log('\n❌ Unexpected response status');
    }
    
  } catch (error) {
    console.log('💥 Request failed:', error.message);
  }
}

testCORS().catch(console.error);