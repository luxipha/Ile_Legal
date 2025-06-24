#!/usr/bin/env node

/**
 * Interactive Reputation System Testing Script
 * Run this to test all reputation features with real data
 */

console.log('🧪 Interactive Reputation System Testing\n');

// Test data and helper functions
const testUsers = {
    sarah: '44444444-4444-4444-4444-444444444444',
    james: '55555555-5555-5555-5555-555555555555',
    emily: '66666666-6666-6666-6666-666666666666',
    michael: '77777777-7777-7777-7777-777777777777',
    david: '88888888-8888-8888-8888-888888888888',
    lisa: '99999999-9999-9999-9999-999999999999'
};

console.log('📋 Test Scenarios Available:');
console.log('1. View Current Reputation Scores');
console.log('2. Test Reputation Level Calculation');
console.log('3. Simulate New Reputation Event');
console.log('4. Test Credential Verification');
console.log('5. Record Case Completion');
console.log('6. Add Peer Attestation');
console.log('7. View Complete Reputation History');
console.log('8. Test Blockchain Integration');

console.log('\n🎯 To test the reputation system:');

console.log('\n1️⃣ VIEW REPUTATION SCORES:');
console.log('   - Login to your app at http://localhost:3000');
console.log('   - Use: sarah.martinez@lawfirm.com / seller123');
console.log('   - Go to Profile page');
console.log('   - You should see reputation display with:');
console.log('     • Overall Score: ~90+');
console.log('     • Legal Review: 92.5/100');
console.log('     • Dispute Resolution: 88.0/100');
console.log('     • Star ratings and completion counts');

console.log('\n2️⃣ TEST IN BROWSER CONSOLE:');
console.log(`
// Copy and paste this into your browser console:

// Test 1: Basic reputation calculation
const testBasicReputation = async () => {
    try {
        // You'll need to import the service in your app
        const { reputationService } = await import('./src/services/reputationService');
        
        const userId = '${testUsers.sarah}'; // Sarah Martinez
        const score = await reputationService.calculateReputationScore(userId);
        console.log('✅ Reputation Score:', score);
        
        const level = reputationService.getReputationLevel(score.overall);
        console.log('✅ Reputation Level:', level);
        
        return score;
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

// Test 2: View reputation history
const testReputationHistory = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const history = await reputationService.getReputationHistory('${testUsers.sarah}');
        console.log('✅ Reputation History:', history);
        
        return history;
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

// Test 3: View legal credentials
const testCredentials = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const credentials = await reputationService.getUserCredentials('${testUsers.sarah}');
        console.log('✅ Legal Credentials:', credentials);
        
        return credentials;
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

// Test 4: View case completions
const testCaseCompletions = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const cases = await reputationService.getCaseCompletions('${testUsers.sarah}');
        console.log('✅ Case Completions:', cases);
        
        return cases;
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

// Run all tests
const runAllTests = async () => {
    console.log('🧪 Running Reputation System Tests...');
    
    await testBasicReputation();
    await testReputationHistory();
    await testCredentials();
    await testCaseCompletions();
    
    console.log('✅ All tests completed!');
};

// Run the tests
runAllTests();
`);

console.log('\n3️⃣ TEST DATABASE DIRECTLY:');
console.log('Run these SQL commands to verify data:');
console.log(`
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
-- Check reputation scores
SELECT 
    p.first_name || ' ' || p.last_name as lawyer_name,
    rs.reputation_type,
    rs.score,
    rs.total_reviews,
    rs.successful_completions,
    rs.average_rating
FROM reputation_scores rs
JOIN profiles p ON rs.user_id = p.id
ORDER BY rs.score DESC;
"
`);

console.log('\n4️⃣ TEST NEW REPUTATION EVENT:');
console.log('   - Login as buyer: david.wilson@devco.com / buyer123');
console.log('   - Find a gig or completed work');
console.log('   - Submit 5-star feedback');
console.log('   - Check if reputation event was created with blockchain TX');

console.log('\n5️⃣ TEST CREDENTIAL UPLOAD:');
console.log('   - Login as seller: sarah.martinez@lawfirm.com / seller123');
console.log('   - Go to Profile > Legal Credentials');
console.log('   - Click "Add Credential" (if UI exists)');
console.log('   - Upload a test PDF file');
console.log('   - Verify blockchain recording');

console.log('\n6️⃣ VERIFY BLOCKCHAIN INTEGRATION:');
console.log(`
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
-- Check blockchain transactions
SELECT 
    event_type,
    rating,
    blockchain_tx_id,
    verified_on_chain,
    created_at
FROM reputation_events 
WHERE blockchain_tx_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
"
`);

console.log('\n7️⃣ TEST PEER ATTESTATIONS:');
console.log('   - Login as James Thompson: james.thompson@propertylaw.com / seller123');
console.log('   - Find Sarah Martinez in lawyer directory');
console.log('   - Add peer endorsement/attestation');
console.log('   - Check reputation impact');

console.log('\n8️⃣ COMPREHENSIVE TESTING FLOW:');
console.log(`
# Complete testing workflow:

1. Login as Sarah Martinez (seller)
   - View reputation display (should show 92.5 Legal Review score)
   - Check legal credentials (should show 3 verified credentials)

2. Login as David Wilson (buyer)  
   - Post feedback for Sarah's work
   - Rate 5 stars with detailed review

3. Check database for new reputation event:
   psql postgresql://postgres:postgres@localhost:54322/postgres -c "
   SELECT * FROM reputation_events ORDER BY created_at DESC LIMIT 5;
   "

4. Login as James Thompson (seller)
   - Add peer attestation for Sarah
   - Verify blockchain recording

5. Login back as Sarah Martinez
   - Check updated reputation scores
   - Verify new events in history

6. Check final reputation state:
   psql postgresql://postgres:postgres@localhost:54322/postgres -c "
   SELECT 
       p.first_name || ' ' || p.last_name as name,
       COUNT(re.*) as total_events,
       COUNT(lc.*) as total_credentials,
       AVG(rs.score) as avg_score
   FROM profiles p
   LEFT JOIN reputation_events re ON p.id = re.user_id
   LEFT JOIN legal_credentials lc ON p.id = lc.user_id
   LEFT JOIN reputation_scores rs ON p.id = rs.user_id
   WHERE p.user_type = 'seller'
   GROUP BY p.id, p.first_name, p.last_name;
   "
`);

console.log('\n🎯 EXPECTED RESULTS:');
console.log('✅ Reputation scores between 0-100');
console.log('✅ All events have blockchain_tx_id');
console.log('✅ IPFS CIDs for document storage');
console.log('✅ Automatic score recalculation');
console.log('✅ Legal credentials with verification status');
console.log('✅ Court-admissible case completion records');
console.log('✅ Weighted peer attestation system');

console.log('\n🚨 TROUBLESHOOTING:');
console.log('If tests fail:');
console.log('1. Ensure Supabase is running: supabase status');
console.log('2. Check reputation tables exist: \\dt *reputation* in psql');
console.log('3. Verify test users exist: SELECT COUNT(*) FROM profiles;');
console.log('4. Check browser console for JavaScript errors');
console.log('5. Verify imports in React components');

console.log('\n🚀 START TESTING:');
console.log('1. npm run dev (start your app)');
console.log('2. Open http://localhost:3000');
console.log('3. Login with test credentials from TEST_USERS_GUIDE.md');
console.log('4. Follow the test scenarios above');
console.log('5. Check REPUTATION_TESTING_GUIDE.md for detailed testing');

console.log('\n✨ Happy Testing! The reputation system is ready to demonstrate blockchain-verified professional credibility! 🎉');