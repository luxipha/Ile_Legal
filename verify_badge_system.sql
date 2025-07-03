-- Badge System Verification Queries
-- Run these in your Supabase SQL Editor to verify everything is working

-- 1. Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('badge_definitions', 'user_badges', 'badge_progress');

-- 2. Verify all 18 Phase 1 badges were inserted
SELECT type, count(*) as badge_count 
FROM badge_definitions 
GROUP BY type 
ORDER BY type;

-- Expected results:
-- achievement: 6
-- quality: 4  
-- reputation: 5
-- verification: 3

-- 3. View all badge definitions
SELECT id, name, type, rarity, requirements 
FROM badge_definitions 
ORDER BY type, rarity, name;

-- 4. Check if database functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('award_badge', 'get_user_badges', 'user_has_badge', 'update_badge_progress');

-- 5. Test awarding a badge (replace 'your-user-id' with actual user ID)
-- SELECT award_badge('your-user-id', 'tier_novice', 'novice', '{"test": true}');

-- 6. Test getting user badges (replace 'your-user-id' with actual user ID)  
-- SELECT * FROM get_user_badges('your-user-id');

-- 7. Check RLS policies are active
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('badge_definitions', 'user_badges', 'badge_progress');

-- 8. Test badge checking function (replace 'your-user-id' with actual user ID)
-- SELECT user_has_badge('your-user-id', 'tier_novice') as has_novice_badge;