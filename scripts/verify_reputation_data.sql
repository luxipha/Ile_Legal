-- Quick Reputation System Verification Script
-- Run this to verify all reputation data is properly set up

\echo '🔍 REPUTATION SYSTEM VERIFICATION'
\echo ''

\echo '1️⃣ REPUTATION SCORES OVERVIEW:'
SELECT 
    p.first_name || ' ' || p.last_name as "Lawyer Name",
    rs.reputation_type as "Specialization",
    rs.score as "Score (/100)",
    rs.total_reviews as "Reviews",
    rs.successful_completions as "Completions",
    rs.average_rating as "Avg Rating"
FROM reputation_scores rs
JOIN profiles p ON rs.user_id = p.id
ORDER BY rs.score DESC;

\echo ''
\echo '2️⃣ LEGAL CREDENTIALS SUMMARY:'
SELECT 
    p.first_name || ' ' || p.last_name as "Lawyer Name",
    lc.credential_type as "Type",
    lc.credential_name as "Credential",
    lc.issuing_authority as "Authority",
    lc.verification_status as "Status"
FROM legal_credentials lc
JOIN profiles p ON lc.user_id = p.id
ORDER BY p.last_name, lc.credential_type;

\echo ''
\echo '3️⃣ USER TYPES BREAKDOWN:'
SELECT 
    user_type as "User Type",
    COUNT(*) as "Count",
    STRING_AGG(first_name || ' ' || last_name, ', ') as "Names"
FROM profiles 
GROUP BY user_type
ORDER BY 
    CASE user_type 
        WHEN 'super_admin' THEN 1 
        WHEN 'admin' THEN 2 
        WHEN 'seller' THEN 3 
        WHEN 'buyer' THEN 4 
    END;

\echo ''
\echo '4️⃣ SAMPLE GIGS CREATED:'
SELECT 
    title as "Gig Title",
    price as "Price ($)",
    status as "Status",
    p.first_name || ' ' || p.last_name as "Posted By"
FROM gigs g
JOIN profiles p ON g.seller_id = p.id
ORDER BY price DESC;

\echo ''
\echo '5️⃣ REPUTATION CALCULATION TEST:'
WITH reputation_calc AS (
    SELECT 
        p.id,
        p.first_name || ' ' || p.last_name as lawyer_name,
        COALESCE(AVG(CASE WHEN rs.reputation_type = 'legal_review' THEN rs.score END), 0) as legal_review,
        COALESCE(AVG(CASE WHEN rs.reputation_type = 'property_approval' THEN rs.score END), 0) as property_approval,
        COALESCE(AVG(CASE WHEN rs.reputation_type = 'dispute_resolution' THEN rs.score END), 0) as dispute_resolution,
        COALESCE(SUM(rs.successful_completions), 0) as total_completions
    FROM profiles p
    LEFT JOIN reputation_scores rs ON p.id = rs.user_id
    WHERE p.user_type = 'seller'
    GROUP BY p.id, p.first_name, p.last_name
)
SELECT 
    lawyer_name as "Lawyer",
    ROUND((
        (legal_review * 0.35) + 
        (property_approval * 0.30) + 
        (dispute_resolution * 0.25) +
        (LEAST(total_completions * 2, 20) * 0.10)
    ), 2) as "Overall Score",
    legal_review as "Legal Review",
    property_approval as "Property",
    dispute_resolution as "Dispute Res",
    total_completions as "Completions"
FROM reputation_calc
ORDER BY "Overall Score" DESC;

\echo ''
\echo '6️⃣ DATABASE TABLES STATUS:'
SELECT 
    'reputation_scores' as "Table",
    COUNT(*) as "Records"
FROM reputation_scores
UNION ALL
SELECT 'legal_credentials', COUNT(*) FROM legal_credentials
UNION ALL  
SELECT 'reputation_events', COUNT(*) FROM reputation_events
UNION ALL
SELECT 'reputation_config', COUNT(*) FROM reputation_config
UNION ALL
SELECT 'profiles (sellers)', COUNT(*) FROM profiles WHERE user_type = 'seller'
UNION ALL
SELECT 'profiles (buyers)', COUNT(*) FROM profiles WHERE user_type = 'buyer'
UNION ALL
SELECT 'gigs', COUNT(*) FROM gigs;

\echo ''
\echo '✅ REPUTATION SYSTEM READY FOR TESTING!'
\echo ''
\echo '🎯 NEXT STEPS:'
\echo '1. Start your app: npm run dev'
\echo '2. Login as: sarah.martinez@lawfirm.com / seller123'
\echo '3. Go to Profile page to see reputation display'
\echo '4. Run browser console tests from test_reputation_system.js'
\echo '5. Check REPUTATION_TESTING_GUIDE.md for comprehensive testing'
\echo ''