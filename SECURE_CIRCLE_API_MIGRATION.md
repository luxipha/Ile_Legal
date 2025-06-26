# Secure Circle API Migration Guide

## Overview
This guide covers the complete migration from frontend Circle API integration to a secure backend-only architecture with automatic API key rotation.

## ✅ What Was Implemented

### 1. Backend Edge Functions
- **`create-wallet`** - Secure wallet creation
- **`wallet-operations`** - All wallet operations (balance, transfer, transactions)
- **`manage-api-keys`** - API key rotation and management

### 2. Database Schema
- **`user_wallets`** - Wallet information storage
- **`user_activities`** - Audit trail
- **`circle_api_keys`** - API key management and rotation
- **`api_key_usage_logs`** - Usage analytics and monitoring

### 3. Security Improvements
- **API keys removed from frontend** - No longer in environment variables
- **Backend-only API calls** - All Circle API calls proxied through Edge Functions
- **Automatic key rotation** - Scheduled rotation with health monitoring
- **Usage logging** - Complete audit trail of API usage

## 🔒 Security Architecture

### Before (Insecure)
```
Frontend → Circle API (with exposed keys)
```

### After (Secure)
```
Frontend → Edge Functions → Circle API (keys in database)
```

## 📦 Deployment Steps

### 1. Deploy Database Migrations

```bash
# Deploy wallet tables
supabase db push

# This creates:
# - user_wallets table
# - user_activities table  
# - circle_api_keys table
# - api_key_usage_logs table
# - API key rotation functions
```

### 2. Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy create-wallet
supabase functions deploy wallet-operations
supabase functions deploy manage-api-keys

# Or deploy all at once
supabase functions deploy
```

### 3. Configure Environment Variables in Supabase

In **Supabase Dashboard > Settings > Edge Functions**, add:

```bash
# Circle API Configuration
CIRCLE_API_KEY=SAND_API_KEY:your_api_key:your_secret
CIRCLE_API_URL=https://api-sandbox.circle.com
CIRCLE_WALLET_SET_ID=your_wallet_set_id
CIRCLE_ENVIRONMENT=sandbox

# Supabase (automatically available)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Initialize API Key in Database

```sql
-- Add your first Circle API key to the database
INSERT INTO circle_api_keys (
    key_name,
    api_key,
    environment,
    is_active,
    expires_at
) VALUES (
    'initial_sandbox_key',
    'SAND_API_KEY:your_api_key:your_secret',
    'sandbox',
    true,
    NOW() + INTERVAL '30 days'
);
```

### 5. Remove Frontend API Keys

✅ **Already done** - Removed from:
- `.env`
- `.env.local`
- All frontend services

### 6. Update Frontend Services

✅ **Already implemented**:
- `secureCircleService.ts` - New secure service
- `backendWalletService.ts` - Backend wallet creation
- Updated `AuthContext.tsx` and `walletService.ts`

## 🔄 API Key Rotation Strategy

### Automatic Rotation Triggers

1. **Time-based**: Keys expire after 30 days
2. **Error rate**: > 10% error rate in 24 hours
3. **Manual**: Admin-triggered rotation

### Rotation Process

```typescript
// Check if rotation is needed
const rotationStatus = await supabase.rpc('check_rotation_needed', {
  environment_name: 'sandbox'
});

if (rotationStatus.needs_rotation) {
  // Rotate the key
  const newKeyId = await supabase.rpc('rotate_api_key', {
    environment_name: 'sandbox',
    new_key_name: 'rotated_key_' + Date.now(),
    new_api_key: 'new_circle_api_key'
  });
  
  // Activate new key
  await supabase.rpc('activate_api_key', {
    key_id: newKeyId,
    environment_name: 'sandbox'
  });
}
```

### Monitoring & Alerts

```sql
-- Check API key health
SELECT * FROM get_api_key_health('sandbox');

-- Check if rotation is needed
SELECT * FROM check_rotation_needed('sandbox');

-- View usage logs
SELECT 
    endpoint,
    method,
    status_code,
    COUNT(*) as requests,
    AVG(response_time_ms) as avg_response_time
FROM api_key_usage_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method, status_code
ORDER BY requests DESC;
```

## 🛠️ Frontend API Usage

### Old (Insecure) Way
```typescript
// ❌ Direct Circle SDK usage with exposed keys
const wallet = await circleSdk.createWallet(userId, description);
const balance = await circleSdk.getWalletBalance(walletId);
```

### New (Secure) Way
```typescript
// ✅ Secure backend proxy
const walletResponse = await backendWalletService.createWallet({
  userId, userType, name, email
});

const balances = await secureCircleService.getWalletBalance(walletId);
```

### Available Operations

```typescript
// Wallet operations via secure backend
await secureCircleService.getWalletBalance(walletId);
await secureCircleService.getWalletAddresses(walletId);
await secureCircleService.createWalletAddress(walletId);
await secureCircleService.initiateTransfer({
  walletId,
  amount,
  recipientAddress,
  tokenId
});
await secureCircleService.getWalletTransactions(walletId);
```

## 🔍 Testing & Verification

### Test Wallet Creation
```typescript
// In browser console after login
import('./src/utils/testBackendWallet.js').then(test => {
  test.default(); // Runs full wallet test suite
});
```

### Test Secure Circle Service
```typescript
// Test wallet operations
const wallet = await secureCircleService.getUserWallet();
const balances = await secureCircleService.getWalletBalance(wallet.circle_wallet_id);
console.log('Wallet balances:', balances);
```

### Admin API Key Management
```typescript
// Check API key health (admin only)
const response = await fetch('/functions/v1/manage-api-keys', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + session.access_token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'get_health',
    environment: 'sandbox'
  })
});
```

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

1. **API Key Health**
   - Days until expiration
   - Error rate (should be < 5%)
   - Average response time
   - Usage count

2. **Wallet Operations**
   - Successful wallet creations
   - Failed operations
   - Transfer success rate

3. **System Health**
   - Edge Function response times
   - Database query performance
   - Active user wallets

### Sample Monitoring Queries

```sql
-- API Key Status
SELECT 
    key_name,
    is_active,
    usage_count,
    last_used_at,
    EXTRACT(DAY FROM expires_at - NOW()) as days_until_expiry
FROM circle_api_keys 
WHERE environment = 'sandbox'
ORDER BY is_active DESC;

-- Recent API Usage
SELECT 
    endpoint,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    AVG(response_time_ms) as avg_response_time
FROM api_key_usage_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY endpoint
ORDER BY total_requests DESC;

-- Wallet Creation Activity
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as wallets_created
FROM user_activities 
WHERE activity_type = 'wallet_created'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

## 🚨 Troubleshooting

### Common Issues

1. **Edge Function Errors**
   ```bash
   # Check function logs
   supabase functions logs create-wallet
   supabase functions logs wallet-operations
   ```

2. **API Key Issues**
   ```sql
   -- Check active keys
   SELECT * FROM circle_api_keys WHERE is_active = true;
   
   -- Check recent errors
   SELECT * FROM api_key_usage_logs 
   WHERE status_code >= 400 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Wallet Creation Failures**
   ```sql
   -- Check failed wallet activities
   SELECT * FROM user_activities 
   WHERE activity_type LIKE '%wallet%' 
   AND metadata->>'error' IS NOT NULL;
   ```

### Recovery Procedures

1. **Rotate Compromised Key**
   ```typescript
   await fetch('/functions/v1/manage-api-keys', {
     method: 'POST',
     body: JSON.stringify({
       action: 'rotate',
       environment: 'sandbox',
       keyName: 'emergency_key_' + Date.now(),
       apiKey: 'new_secure_key'
     })
   });
   ```

2. **Manual Key Activation**
   ```sql
   -- Activate backup key
   SELECT activate_api_key('backup_key_id', 'sandbox');
   ```

## ✅ Production Checklist

- [ ] All Edge Functions deployed and tested
- [ ] Database migrations applied
- [ ] Production Circle API keys added to database
- [ ] Environment variables configured in Supabase
- [ ] Frontend API keys completely removed
- [ ] API key rotation schedule configured
- [ ] Monitoring and alerting set up
- [ ] Backup API keys prepared
- [ ] Team trained on new security procedures

## 🎯 Benefits Achieved

1. **Security**: API keys never exposed to frontend
2. **Reliability**: Automatic key rotation prevents expiration issues
3. **Monitoring**: Complete visibility into API usage
4. **Performance**: Reduced frontend bundle size
5. **Compliance**: Better audit trail and access controls
6. **Scalability**: Centralized API management

The migration is now complete with enterprise-grade security for Circle API integration! 🔒