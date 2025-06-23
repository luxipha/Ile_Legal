# Database Table Verification Guide

## Quick Verification Steps

### 1. Check if all tables exist in your database:

Run this SQL query in your Supabase dashboard or via psql:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Bids', 'Disputes', 'Feedback', 'Work Submissions', 'Gigs', 'Profiles', 'user_documents', 'admin_actions', 'user_notifications')
ORDER BY table_name;
```

**Expected result:** Should return all 9 table names.

### 2. Test API Table Access:

Open your browser console on your app and run:

```javascript
// Test if API can access the tables
console.log("Testing table access...");

// This should not throw errors
fetch('/api/test-tables', {method: 'POST'}).catch(console.log);
```

### 3. Verify Table Structures:

```sql
-- Check Bids table structure
\d "Bids"

-- Check if it has the right columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Bids' AND table_schema = 'public';
```

**Expected columns for Bids:**
- id (integer)
- gig_id (uuid)
- seller_id (uuid)
- buyer_id (uuid)
- amount (numeric)
- description (text)
- status (text)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### 4. Test Sample Data:

```sql
-- Insert test data
INSERT INTO "Bids" (id, amount, description, status) 
VALUES (999, 100.00, 'Test bid', 'pending');

-- Check if it was inserted
SELECT * FROM "Bids" WHERE id = 999;

-- Clean up test data
DELETE FROM "Bids" WHERE id = 999;
```

### 5. Verify RLS Policies:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('Bids', 'Disputes', 'Feedback', 'Work Submissions', 'Gigs', 'Profiles')
AND schemaname = 'public';
```

**Expected:** All should show `rowsecurity = true`

## If Something is Wrong:

### Missing Tables:
```bash
# Re-run the migration
supabase db push
```

### Wrong Table Names:
Check if tables exist with different names:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

### Permission Issues:
```sql
-- Check current user permissions
SELECT current_user, session_user;

-- Check if you're authenticated in the app
SELECT auth.uid();
```

## Success Indicators:

✅ All 9 tables exist with correct names  
✅ Bids table has integer ID column  
✅ Foreign key relationships work  
✅ RLS policies are enabled  
✅ Sample data can be inserted/selected  
✅ No TypeScript errors in API file  

## API Testing:

Once verified, test these API endpoints in your app:

1. **Bids:** Try creating a bid on a gig
2. **Feedback:** Submit feedback after completing a gig
3. **Disputes:** Create a test dispute
4. **Work Submissions:** Submit work deliverables
5. **Admin functions:** Test user management features

If any API calls fail, check the browser network tab for specific error messages.