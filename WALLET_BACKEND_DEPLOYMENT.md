# Backend Wallet Service Deployment Guide

## Overview
This guide explains how to deploy the backend wallet creation service using Supabase Edge Functions. The backend handles Circle API calls securely on the server-side instead of exposing API keys to the client.

## Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Circle API credentials (sandbox or production)
3. Supabase project with proper environment variables

## Deployment Steps

### 1. Set up Supabase Environment Variables

In your Supabase dashboard, go to **Settings > Edge Functions** and add these environment variables:

```bash
# Circle API Configuration
CIRCLE_API_KEY=SAND_API_KEY:your_actual_api_key_here
CIRCLE_API_URL=https://api-sandbox.circle.com
CIRCLE_WALLET_SET_ID=your_wallet_set_id_here

# Supabase Configuration (automatically available)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Deploy the Database Migration

Run the wallet tables migration:

```bash
# From project root
supabase db push
```

This creates the following tables:
- `user_wallets` - Stores wallet information
- `user_activities` - Audit trail for wallet operations

### 3. Deploy the Edge Function

```bash
# From project root
supabase functions deploy create-wallet

# Or deploy all functions
supabase functions deploy
```

### 4. Test the Edge Function

```bash
# Test locally first
supabase start
supabase functions serve

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/create-wallet' \
  -H 'Authorization: Bearer your_anon_key' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test-user-id",
    "userType": "buyer", 
    "name": "Test User",
    "email": "test@example.com"
  }'
```

### 5. Environment Variables for Production

Update your production `.env` file to use the backend service:

```bash
# Frontend keeps minimal Circle config for fallback
VITE_CIRCLE_API_URL=https://api-sandbox.circle.com
VITE_CIRCLE_TEST_API_KEY=SAND_API_KEY:your_public_test_key

# Supabase configuration
VITE_SUPABASE_URL=https://pleuwhgjpjnkqvbemmhl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Security Benefits

### Before (Frontend Circle Integration)
```typescript
// ❌ API keys exposed to client
const wallet = await circleSdk.createWallet(userId, description);
```

### After (Backend Integration)
```typescript
// ✅ API keys stay on server
const response = await backendWalletService.createWallet({
  userId, userType, name, email
});
```

## API Usage

### Create Wallet Endpoint

**POST** `/functions/v1/create-wallet`

**Headers:**
```
Authorization: Bearer {user_session_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "uuid",
  "userType": "buyer" | "seller",
  "name": "User Name",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "uuid",
    "circle_wallet_id": "wallet_id",
    "wallet_address": "0x...",
    "wallet_state": "LIVE",
    "balance_usdc": 0,
    "balance_matic": 0
  },
  "message": "Wallet created successfully"
}
```

## Frontend Integration

The frontend automatically uses the backend service:

```typescript
// In AuthContext.tsx
const walletResponse = await backendWalletService.createWallet({
  userId: newUser.id,
  userType: newUser.role as 'buyer' | 'seller',
  name: newUser.name,
  email: newUser.email
});
```

## Monitoring & Logging

### Check Edge Function Logs
```bash
# View function logs
supabase functions logs create-wallet

# Real-time logs
supabase functions logs create-wallet --follow
```

### Database Monitoring
```sql
-- Check wallet creation activity
SELECT * FROM user_activities 
WHERE activity_type = 'wallet_created' 
ORDER BY created_at DESC;

-- Check wallet status
SELECT user_id, circle_wallet_id, wallet_state, created_at 
FROM user_wallets 
ORDER BY created_at DESC;
```

## Error Handling

The backend service includes comprehensive error handling:

1. **Authentication Errors**: Invalid session tokens
2. **Validation Errors**: Missing required fields
3. **Circle API Errors**: API failures or rate limits
4. **Database Errors**: Failed wallet storage

All errors are logged and return user-friendly messages.

## Production Checklist

- [ ] Edge Function deployed to Supabase
- [ ] Environment variables configured in Supabase dashboard
- [ ] Database migration applied
- [ ] Frontend updated to use backend service
- [ ] Circle API credentials configured (production keys)
- [ ] Error monitoring set up
- [ ] Wallet creation flow tested end-to-end

## Troubleshooting

### Common Issues

1. **Edge Function Not Found**
   ```bash
   # Redeploy function
   supabase functions deploy create-wallet
   ```

2. **Environment Variables Missing**
   - Check Supabase dashboard > Settings > Edge Functions
   - Ensure all required vars are set

3. **Circle API Errors**
   - Verify API key format: `SAND_API_KEY:key:secret`
   - Check API endpoint URLs
   - Ensure wallet set ID is correct

4. **Database Permission Errors**
   - Check RLS policies on `user_wallets` table
   - Ensure service role has proper permissions

### Logs to Check

```bash
# Edge function logs
supabase functions logs create-wallet

# Database logs
SELECT * FROM user_activities WHERE activity_type LIKE '%wallet%';

# Frontend console logs
# Look for "Backend wallet creation" messages
```

This backend implementation provides enhanced security, better error handling, and centralized wallet management for your ile-legal platform.