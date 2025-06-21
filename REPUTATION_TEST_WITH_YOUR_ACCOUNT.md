# 🧪 Test Reputation System with buyer@ile.com

## ✅ **Your Account is Ready!**

**Login Credentials:** `buyer@ile.com` (your existing password)

**Account Setup:**
- **Name:** Alex Rodriguez  
- **Type:** Seller (Legal Professional)
- **Overall Reputation:** 91.35/100 🏆

---

## 🏆 **1. VIEW REPUTATION SCORES (UI Testing)**

### **Step 1: Login and View Profile**
1. **Login:** `buyer@ile.com` with your password
2. **Go to Profile page**
3. **You should see:**
   - **Overall Score:** ~91.35 (Master level)
   - **Legal Review:** 94.5/100 (32 reviews, 30 completions)
   - **Contract Drafting:** 96.0/100 (28 reviews, 27 completions)  
   - **Dispute Resolution:** 89.5/100 (15 reviews, 14 completions)
   - **Star Rating:** 4.8/5.0 average
   - **Total Completions:** 71 cases

### **Expected UI Elements:**
- ✅ **Reputation Display Component** with colored progress bars
- ✅ **Legal Credentials Section** showing 4 verified credentials
- ✅ **Professional Level Badge** (Master - Exceptional legal professional)
- ✅ **Specialization breakdown** by legal area

---

## 🔍 **2. BROWSER CONSOLE TESTING**

Open browser console (F12) and run these tests:

### **Test 1: Basic Reputation Calculation**
```javascript
// Test reputation service directly
const testReputation = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const userId = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1'; // Your user ID
        
        // Test 1: Calculate overall reputation
        const score = await reputationService.calculateReputationScore(userId);
        console.log('✅ Reputation Score:', score);
        
        // Test 2: Get reputation level
        const level = reputationService.getReputationLevel(score.overall);
        console.log('✅ Reputation Level:', level);
        
        return { score, level };
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

testReputation();
```

**Expected Output:**
```javascript
✅ Reputation Score: {
  overall: 91.35,
  legal_review: 94.5,
  property_approval: 0,
  dispute_resolution: 89.5,
  total_completions: 71,
  average_rating: 4.8
}

✅ Reputation Level: {
  level: "Master",
  description: "Exceptional legal professional", 
  color: "#8B5CF6"
}
```

### **Test 2: View Legal Credentials**
```javascript
const testCredentials = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const credentials = await reputationService.getUserCredentials('aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1');
        console.log('✅ Legal Credentials:', credentials);
        
        credentials.forEach(cred => {
            console.log(`📜 ${cred.credential_name} - ${cred.verification_status}`);
        });
        
        return credentials;
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

testCredentials();
```

**Expected Output:**
```javascript
✅ Legal Credentials: [
  📜 New York State Bar License - verified
  📜 Intellectual Property Specialist - verified  
  📜 Technology Law Certified Professional - verified
  📜 Certified Corporate Counsel - verified
]
```

### **Test 3: Reputation History**
```javascript
const testHistory = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const history = await reputationService.getReputationHistory('aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1');
        console.log('✅ Reputation History:', history);
        
        return history;
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

testHistory();
```

---

## 🔗 **3. TEST BLOCKCHAIN INTEGRATION**

### **Record New Reputation Event**
```javascript
const testNewEvent = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const eventId = await reputationService.recordReputationEvent(
            'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1', // Your user ID
            'gig_completed',
            'test-gig-' + Date.now(),
            'test-reviewer-id',
            5, // 5-star rating
            'Excellent work on complex IP contract review!'
        );
        
        console.log('✅ New reputation event recorded:', eventId);
        
        // Check updated reputation
        const newScore = await reputationService.calculateReputationScore('aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1');
        console.log('✅ Updated reputation:', newScore);
        
        return eventId;
    } catch (error) {
        console.error('❌ Error recording event:', error);
    }
};

testNewEvent();
```

### **Verify Blockchain Recording**
```sql
-- Check latest reputation events (run in database)
SELECT 
    event_type,
    rating,
    review_text,
    blockchain_tx_id,
    verified_on_chain,
    created_at
FROM reputation_events 
WHERE user_id = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1'
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📜 **4. TEST CREDENTIAL VERIFICATION**

### **Add New Credential**
```javascript
const testNewCredential = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        // Create a mock PDF file for testing
        const mockFile = new File(['Mock credential content'], 'test-cert.pdf', {
            type: 'application/pdf'
        });
        
        const credentialId = await reputationService.verifyLegalCredential(
            'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1',
            'certification',
            'Advanced Technology Law Certificate',
            'Stanford Law School',
            'California',
            mockFile,
            '2024-01-15',
            '2027-01-15'
        );
        
        console.log('✅ New credential verified:', credentialId);
        
        // Check updated credentials
        const credentials = await reputationService.getUserCredentials('aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1');
        console.log('✅ Updated credentials:', credentials);
        
        return credentialId;
    } catch (error) {
        console.error('❌ Error adding credential:', error);
    }
};

testNewCredential();
```

---

## 🏛️ **5. TEST CASE COMPLETION**

### **Record Court-Admissible Case**
```javascript
const testCaseCompletion = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        // Mock case documents
        const documents = [
            new File(['Contract text'], 'contract.pdf', { type: 'application/pdf' }),
            new File(['Legal memo'], 'memo.pdf', { type: 'application/pdf' })
        ];
        
        const finalDeliverable = new File(['Final opinion'], 'final-opinion.pdf', {
            type: 'application/pdf'
        });
        
        const completionId = await reputationService.recordCaseCompletion(
            'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1', // Your user ID (lawyer)
            'test-client-id', // Mock client ID
            'test-gig-' + Date.now(),
            'intellectual_property',
            'Startup IP Portfolio Review',
            'completed',
            documents,
            finalDeliverable,
            5, // Quality score
            5  // Client satisfaction
        );
        
        console.log('✅ Case completion recorded:', completionId);
        
        return completionId;
    } catch (error) {
        console.error('❌ Error recording case:', error);
    }
};

testCaseCompletion();
```

---

## 👥 **6. TEST PEER ATTESTATION**

### **Add Peer Endorsement**
```javascript
const testPeerAttestation = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const attestationId = await reputationService.addPeerAttestation(
            'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1', // Subject (you)
            '44444444-4444-4444-4444-444444444444', // Attester (Sarah Martinez)
            'professional_competence',
            5, // Score
            'Alex is an exceptional technology lawyer with deep expertise in intellectual property and startup legal matters. Highly recommended for complex tech legal work.',
            'colleague',
            2 // Years known
        );
        
        console.log('✅ Peer attestation added:', attestationId);
        
        return attestationId;
    } catch (error) {
        console.error('❌ Error adding attestation:', error);
    }
};

testPeerAttestation();
```

---

## 📊 **7. DATABASE VERIFICATION**

Run these SQL queries to verify everything is working:

```sql
-- Check your complete reputation profile
SELECT 
    'REPUTATION OVERVIEW' as section,
    rs.reputation_type,
    rs.score,
    rs.total_reviews,
    rs.successful_completions,
    rs.average_rating
FROM reputation_scores rs
WHERE rs.user_id = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1'
ORDER BY rs.score DESC;

-- Check legal credentials
SELECT 
    'CREDENTIALS' as section,
    lc.credential_type,
    lc.credential_name,
    lc.verification_status,
    lc.blockchain_tx_id IS NOT NULL as blockchain_verified
FROM legal_credentials lc
WHERE lc.user_id = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1';

-- Check reputation events (if any created)
SELECT 
    'EVENTS' as section,
    re.event_type,
    re.rating,
    re.blockchain_tx_id IS NOT NULL as blockchain_verified,
    re.created_at
FROM reputation_events re
WHERE re.user_id = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1'
ORDER BY re.created_at DESC;
```

---

## 🎯 **EXPECTED TEST RESULTS**

### ✅ **Success Indicators:**

1. **Profile Page Shows:**
   - Reputation Display component with 91.35 overall score
   - Legal Credentials component with 4 verified credentials
   - Master level badge (purple color)
   - Specialization breakdown bars

2. **Console Tests Return:**
   - Reputation scores matching database values
   - All 4 credentials with "verified" status
   - Blockchain transaction IDs for new events
   - Proper error handling for edge cases

3. **Database Shows:**
   - 3 reputation score entries
   - 4 legal credentials (all verified)
   - New events recorded with blockchain verification
   - Automatic score recalculation

4. **Blockchain Integration:**
   - Every new event gets `blockchain_tx_id`
   - IPFS CIDs for document storage
   - Tamper-proof timestamps
   - Court-admissible evidence storage

---

## 🚀 **START TESTING NOW!**

1. **Login:** `buyer@ile.com` (your existing password)
2. **Go to Profile page** → See reputation display
3. **Open browser console (F12)** → Run the JavaScript tests
4. **Check database** → Verify blockchain integration

**Your account now has Master-level reputation with comprehensive credentials - perfect for testing all professional reputation features!** 🎉

---

## 📞 **Quick Verification**

Run this to confirm everything is set up:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
SELECT 
    p.email,
    p.first_name || ' ' || p.last_name as name,
    p.user_type,
    COUNT(rs.*) as reputation_entries,
    COUNT(lc.*) as credentials,
    ROUND(AVG(rs.score), 2) as avg_score
FROM profiles p
LEFT JOIN reputation_scores rs ON p.id = rs.user_id
LEFT JOIN legal_credentials lc ON p.id = lc.user_id
WHERE p.email = 'buyer@ile.com'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.user_type;
"
```

**Expected:** `buyer@ile.com | Alex Rodriguez | seller | 3 | 4 | 93.33`