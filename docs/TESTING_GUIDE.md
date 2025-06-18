# Admin API Testing Guide

This guide explains how to test the User Management APIs before implementing them in your admin dashboard.

## Overview

We've created comprehensive test scripts to validate all admin API functions:

- **API Function Tests**: Tests all CRUD operations for user management
- **Database Integration**: Validates Supabase database operations
- **Error Handling**: Tests error scenarios and edge cases
- **Service Layer**: Tests the AdminApiService wrapper functions

## Test Files

- `src/tests/adminApiTest.ts` - Main test suite with comprehensive API testing
- `scripts/test-admin-apis.js` - Command-line test runner
- `test-admin-apis.html` - Browser-based test runner (generated)

## Prerequisites

### 1. Database Setup

First, ensure your Supabase database is set up with the required tables:

```bash
# Run the migration to create user verification tables
supabase db push

# Or apply the specific migration
supabase migration up --file 20250615_add_user_verification_tables.sql
```

### 2. Environment Variables

Ensure you have a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

## Running Tests

### Method 1: Command Line (Recommended)

```bash
# Run all tests
node scripts/test-admin-apis.js

# Or use npm script (if added to package.json)
npm run test:admin
```

### Method 2: Browser Environment

```bash
# Generate browser test runner
node scripts/test-admin-apis.js --browser

# Then open the generated test-admin-apis.html in your browser
```

### Method 3: Direct Import (Development)

```typescript
import { AdminApiTester } from './src/tests/adminApiTest';

const tester = new AdminApiTester();
tester.runAllTests();
```

## Test Coverage

The test suite covers the following APIs:

### Core User Management
- ✅ `getAllUsers()` - Fetch users with filtering and pagination
- ✅ `getUserById()` - Get specific user details
- ✅ `verifyUser()` - Approve user verification
- ✅ `rejectUser()` - Reject user with reason
- ✅ `requestInfo()` - Request additional information

### Document Management
- ✅ `getUserDocuments()` - Fetch user verification documents
- ✅ `updateDocumentStatus()` - Update document verification status

### Statistics & Analytics
- ✅ `getUserStats()` - Get user verification statistics

### Service Layer
- ✅ `AdminApiService.getDashboardStats()` - Dashboard statistics
- ✅ `AdminApiService.searchUsers()` - User search functionality

## Test Data

The test suite automatically:

1. **Creates** test data (users, documents)
2. **Runs** all API tests
3. **Cleans up** test data after completion

### Test User Profile
```typescript
{
  id: 'test-user-{timestamp}',
  email: 'test@example.com',
  full_name: 'Test User',
  verification_status: 'pending'
}
```

### Test Document
```typescript
{
  user_id: '{test_user_id}',
  document_type: 'id_card',
  file_name: 'test-id.jpg',
  verification_status: 'pending'
}
```

## Understanding Test Results

### Success Output
```
🚀 Starting Admin API Tests...
==================================================
📋 Setting up test data...
✅ Test data setup complete

🔍 Testing getAllUsers...
✅ getAllUsers: Found 1 users

👤 Testing getUserById...
✅ getUserById: Retrieved user Test User

📊 TEST RESULTS SUMMARY
==================================================
📈 Overall: 10/10 tests passed
✅ Passed: 10
❌ Failed: 0
📊 Success Rate: 100.0%

🎉 All tests passed! APIs are ready for implementation.
```

### Failure Output
```
❌ getAllUsers failed: Error: relation "profiles" does not exist

📊 TEST RESULTS SUMMARY
==================================================
📈 Overall: 5/10 tests passed
✅ Passed: 5
❌ Failed: 5
📊 Success Rate: 50.0%

⚠️ Some tests failed. Please check:
1. Database migration has been run
2. Supabase connection is working
3. Required tables exist
4. RLS policies are configured
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: Invalid API key or URL
```
**Solution**: Check your `.env` file and Supabase credentials.

#### 2. Tables Don't Exist
```
Error: relation "user_documents" does not exist
```
**Solution**: Run the database migration:
```bash
supabase db push
```

#### 3. Permission Denied
```
Error: new row violates row-level security policy
```
**Solution**: Check RLS policies or run tests with admin privileges.

#### 4. TypeScript Compilation Error
```
Error: Cannot find module '@/types/admin'
```
**Solution**: Ensure all TypeScript files are properly created and paths are correct.

### Debug Mode

To run tests with detailed logging:

```typescript
// Add to adminApiTest.ts
console.log('Debug: Supabase URL:', process.env.VITE_SUPABASE_URL);
console.log('Debug: Test User ID:', this.testUserId);
```

## Integration with CI/CD

Add to your `package.json`:

```json
{
  "scripts": {
    "test:admin": "node scripts/test-admin-apis.js",
    "test:admin:browser": "node scripts/test-admin-apis.js --browser",
    "pretest": "npm run test:admin"
  }
}
```

For GitHub Actions:

```yaml
- name: Test Admin APIs
  run: npm run test:admin
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Next Steps

Once all tests pass:

1. **Integrate APIs** into your admin dashboard components
2. **Use React Hooks** from `src/hooks/useAdminApi.ts`
3. **Import Services** from `src/services/adminApi.ts`
4. **Follow Documentation** in `docs/USER_MANAGEMENT_APIS.md`

## Support

If you encounter issues:

1. Check the test output for specific error messages
2. Verify database schema matches the migration file
3. Ensure Supabase connection is working
4. Review RLS policies for proper permissions

The test suite is designed to catch issues early and provide clear feedback on what needs to be fixed before implementation.