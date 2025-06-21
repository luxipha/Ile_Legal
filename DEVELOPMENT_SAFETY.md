# 🛡️ Development Safety Guide

## ⚠️ **User Data Protection**

Your users keep getting wiped because of these operations:

### **Commands That Wipe Data:**
```bash
# 🚨 DANGEROUS - Resets entire database
npx supabase db reset --local

# 🚨 DANGEROUS - Drops all tables
psql -c "DROP SCHEMA public CASCADE;"

# 🚨 DANGEROUS - Truncates user tables
TRUNCATE auth.users CASCADE;
```

### **Safe Commands to Use:**
```bash
# ✅ SAFE - Apply new migrations only
npx supabase db push

# ✅ SAFE - Apply specific migration
npx supabase migration up

# ✅ SAFE - Check migration status
npx supabase migration list

# ✅ SAFE - Create new migration
npx supabase migration new migration_name
```

## 🔄 **Safe Migration Process**

### 1. **Always Backup First**
```bash
# Backup users before any changes
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/backup_users.sql
```

### 2. **Use Incremental Migrations**
```sql
-- Use IF NOT EXISTS for tables
CREATE TABLE IF NOT EXISTS new_table (...);

-- Use IF NOT EXISTS for policies  
CREATE POLICY IF NOT EXISTS "policy_name" ON table_name ...;

-- Use DO blocks for conditional operations
DO $$
BEGIN
    IF NOT EXISTS (...) THEN
        -- Safe operation
    END IF;
END $$;
```

### 3. **Test Migrations Safely**
```bash
# Create a test migration first
npx supabase migration new test_reputation_system

# Apply and test
npx supabase db push

# If issues, rollback
npx supabase migration down
```

## 📊 **Current Database State**

To check your current users:
```sql
-- Check user count
SELECT COUNT(*) as user_count FROM auth.users;
SELECT COUNT(*) as profile_count FROM profiles;

-- Check recent users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

## 🚨 **Recovery Steps**

If users get wiped again:

### 1. **Check for Backups**
```sql
-- Look for backup tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%backup%';

-- Restore from backup if available
INSERT INTO auth.users SELECT * FROM user_backup_auth;
INSERT INTO profiles SELECT * FROM user_backup_profiles;
```

### 2. **Check Git History**
```bash
# Look for database dumps in git
git log --oneline --grep="database\|users\|dump"
```

### 3. **Recreate Test Users**
```sql
-- Create a test admin user
INSERT INTO auth.users (id, email, created_at, email_confirmed_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'admin@test.com', NOW(), NOW());

INSERT INTO profiles (id, email, first_name, last_name, user_type)
VALUES ('11111111-1111-1111-1111-111111111111', 'admin@test.com', 'Test', 'Admin', 'admin');
```

## 🎯 **Going Forward**

1. **Always use the safe migration**: `supabase/migrations/20250620_add_reputation_system.sql`
2. **Never use `db reset`** unless you want to lose all data
3. **Always backup before schema changes**
4. **Use incremental migrations with IF NOT EXISTS**
5. **Test on a separate database first**

## 📞 **Quick Recovery Command**

If you need to restore the reputation system without losing users:

```bash
# Apply the safe migration
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/20250620_add_reputation_system.sql
```

This will add reputation tables without touching existing user data.