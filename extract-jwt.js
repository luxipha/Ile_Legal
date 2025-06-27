// Copy and paste this into your browser console to get the JWT:

console.log('🔑 JWT Token Extraction:');
console.log('Copy the token below and use it in the test script:');
console.log('');

// Try to get from localStorage
const localStorageKey = Object.keys(localStorage).find(key => key.includes('supabase.auth.token'));
if (localStorageKey) {
  const authData = JSON.parse(localStorage.getItem(localStorageKey));
  if (authData && authData.access_token) {
    console.log('✅ Found JWT in localStorage:');
    console.log(authData.access_token);
  }
}

// Try to get from sessionStorage  
const sessionStorageKey = Object.keys(sessionStorage).find(key => key.includes('supabase.auth.token'));
if (sessionStorageKey) {
  const authData = JSON.parse(sessionStorage.getItem(sessionStorageKey));
  if (authData && authData.access_token) {
    console.log('✅ Found JWT in sessionStorage:');
    console.log(authData.access_token);
  }
}

console.log('');
console.log('📋 If no token found above, look for "session" in the console logs and copy the access_token value.');