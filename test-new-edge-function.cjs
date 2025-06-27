#!/usr/bin/env node

/**
 * Test the new Edge Function with Web Crypto encryption
 */

const https = require('https');

const TEST_CONFIG = {
  EDGE_FUNCTION_URL: 'https://pleuwhgjpjnkqvbemmhl.supabase.co/functions/v1/create-wallet',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXV3aGdqcGpua3F2YmVtbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzQ0NzMsImV4cCI6MjA2NTQxMDQ3M30.lAGzWtcKYtREgCHEU4n15gtPclQrNoBv6tXk836XkeE',
  // Using debug token from previous conversation
  USER_JWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM2MjY4NzM0LCJpYXQiOjE3MzYyNjUxMzQsImlzcyI6Imh0dHBzOi8vcGxldXdoZ2pwam5rcXZiZW1taGwuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjQxMmJjN2JkLWJhZGQtNGE5MS1hNjliLWRkMTlhNTlkNmE5ZCIsImVtYWlsIjoiYWJpc295ZTc0NEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVycyI6WyJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tBM3hyX21OcU5xOUJIZm01R0hzbXFSbUdLN2xZVXpjdU1XelFzUTk5LV9lRT1zOTYtYyIsImVtYWlsIjoiYWJpc295ZTc0NEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiQWJpc295ZSBEYW11bm4iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiQWJpc295ZSBEYW11bm4iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS0EzeHJfbU5xTnE5QkhmejVHSHNtcVJtR0s3bFlVemN1TVd6UXNROTlfZWU9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwNTc1MDQ0NjA2MDY1OTM4MzAzNCIsInN1YiI6IjEwNTc1MDQ0NjA2MDY1OTM4MzAzNCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzM2MjY1MTM0fV0sInNlc3Npb25faWQiOiI0MDU0N2Y5MC05MjkzLTQ4NDQtODY4OS0xNjllMjY1NWY4NzEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.z8o3ztTNNgWMm2DZqsKOgPp_rP0i1ZdQgV7oQ7JaZUk'
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
  console.log('🧪 Testing Updated Edge Function with Web Crypto');
  console.log('=' .repeat(50));
  
  const requestBody = {
    userId: '412bc7bd-badd-4a91-a69b-dd19a59d6a9d',
    userType: 'buyer',
    name: 'Test User',
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
  
  console.log('📡 Making request to Edge Function...');
  console.log('🔗 URL:', TEST_CONFIG.EDGE_FUNCTION_URL);
  
  try {
    const response = await makeRequest(options, postData);
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', response.body);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('\n✅ SUCCESS! Edge Function working!');
      if (response.json) {
        console.log('📋 Response Details:');
        console.log(JSON.stringify(response.json, null, 2));
      }
    } else if (response.status === 401) {
      console.log('\n🔍 401 Unauthorized - JWT might be expired');
    } else if (response.status === 500) {
      console.log('\n❌ 500 Server Error - Check function logs');
      if (response.body.includes('encrypt')) {
        console.log('🔧 Possible encryption issue');
      }
    }
    
  } catch (error) {
    console.log('💥 Request failed:', error.message);
  }
}

testEdgeFunction().catch(console.error);