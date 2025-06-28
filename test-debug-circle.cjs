#!/usr/bin/env node

/**
 * Test the debug Circle API version (no auth required)
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

async function testDebugCircleAPI() {
  console.log('🧪 Testing Debug Circle API (No Auth Required)');
  console.log('=' .repeat(50));
  
  const url = new URL(TEST_CONFIG.EDGE_FUNCTION_URL);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.SUPABASE_ANON_KEY}`,
      'apikey': TEST_CONFIG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength('{}')
    }
  };
  
  console.log('📡 Making request to debug function...');
  console.log('🔗 URL:', TEST_CONFIG.EDGE_FUNCTION_URL);
  
  try {
    const response = await makeRequest(options, '{}');
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.json) {
      console.log('\n📋 Parsed Response:');
      console.log(JSON.stringify(response.json, null, 2));
    }
    
    if (response.status >= 200 && response.status < 300) {
      console.log('\n✅ SUCCESS! Web Crypto encryption works with Circle API!');
      console.log('🎉 The Edge Function can create wallets successfully!');
    } else if (response.status === 500) {
      if (response.body.includes('Circle API failed')) {
        console.log('\n❌ Circle API rejected the request');
        if (response.json && response.json.status === 401) {
          console.log('🔑 Still getting 401 from Circle - encryption or credentials issue');
        }
      }
    }
    
  } catch (error) {
    console.log('💥 Request failed:', error.message);
  }
}

testDebugCircleAPI().catch(console.error);