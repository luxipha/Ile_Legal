-- User Data Backup Script
-- Run this before any database operations to backup user data

-- Backup auth.users table
CREATE TABLE IF NOT EXISTS user_backup_auth AS 
SELECT * FROM auth.users;

-- Backup profiles table  
CREATE TABLE IF NOT EXISTS user_backup_profiles AS
SELECT * FROM profiles;

-- Backup any other user-related data
CREATE TABLE IF NOT EXISTS user_backup_gigs AS
SELECT * FROM gigs;

CREATE TABLE IF NOT EXISTS user_backup_bids AS
SELECT * FROM bids;

-- Add timestamp to backup
INSERT INTO user_backup_profiles (id, email, created_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'backup_timestamp', NOW())
ON CONFLICT (id) DO UPDATE SET created_at = NOW();

-- Query to check backup status
SELECT 
    'auth.users' as table_name, 
    COUNT(*) as backup_count,
    MAX(created_at) as latest_backup
FROM user_backup_auth
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as backup_count, 
    MAX(created_at) as latest_backup
FROM user_backup_profiles
UNION ALL
SELECT 
    'gigs' as table_name,
    COUNT(*) as backup_count,
    MAX(created_at) as latest_backup  
FROM user_backup_gigs;