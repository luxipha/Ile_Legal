# 🧪 Professional Reputation System Testing Guide

## 🎯 **Testing Overview**
Comprehensive guide to test all reputation system features including blockchain integration, credential verification, and professional achievement tracking.

---

## 🏆 **1. PROFESSIONAL REPUTATION TRACKING**

### A. **View Existing Reputation Scores**

1. **Login as a Seller:**
   - Email: `sarah.martinez@lawfirm.com`
   - Password: `seller123`

2. **Navigate to Profile Page:**
   - Go to Profile section
   - View the **Reputation Display Component**
   - You should see:
     - Overall Score: ~90+ (calculated from specializations)
     - Legal Review: 92.5/100 (28 reviews, 25 completions)
     - Dispute Resolution: 88.0/100 (12 reviews, 11 completions)
     - Star rating and completion count

### B. **Test Reputation Score Calculation**

Run this in your browser console or create a test page:

```javascript
// Test reputation calculation
import { reputationService } from './src/services/reputationService';

// Test Sarah Martinez's reputation
const testReputation = async () => {
    const userId = '44444444-4444-4444-4444-444444444444';
    const score = await reputationService.calculateReputationScore(userId);
    console.log('Reputation Score:', score);
    
    const level = reputationService.getReputationLevel(score.overall);
    console.log('Reputation Level:', level);
};

testReputation();
```

### C. **Test Different Specialization Scores**

Compare different sellers:
- **Sarah Martinez** (Corporate): Legal Review 92.5, Dispute Resolution 88.0
- **James Thompson** (Property): Property Approval 94.0, Legal Review 89.5
- **Emily Chen** (Tech): Legal Review 91.0
- **Michael Okonkwo** (Family): Legal Review 87.5, Dispute Resolution 90.0

---

## 🔗 **2. BLOCKCHAIN SECURITY TESTING**

### A. **Record New Reputation Event**

1. **Create Test Feedback:**
   - Login as a buyer (e.g., `david.wilson@devco.com`, password: `buyer123`)
   - Find a completed gig or create one
   - Submit feedback with rating and review text

2. **Check Blockchain Recording:**
```sql
-- Check latest reputation events
SELECT 
    user_id,
    event_type,
    rating,
    review_text,
    blockchain_tx_id,
    verified_on_chain,
    created_at
FROM reputation_events 
ORDER BY created_at DESC 
LIMIT 10;
```

### B. **Test Algorand Integration**

Create a test script to record reputation events:

```javascript
// Test blockchain integration
const testBlockchainEvent = async () => {
    const userId = '44444444-4444-4444-4444-444444444444'; // Sarah Martinez
    const gigId = 'test-gig-123';
    const reviewerId = '88888888-8888-8888-8888-888888888888'; // David Wilson
    
    try {
        const eventId = await reputationService.recordReputationEvent(
            userId,
            'gig_completed',
            gigId,
            reviewerId,
            5,
            'Excellent legal work on our development project!'
        );
        
        console.log('✅ Reputation event recorded:', eventId);
        
        // Check if it was recorded on blockchain
        const events = await reputationService.getReputationHistory(userId, 5);
        console.log('Recent events:', events);
        
    } catch (error) {
        console.error('❌ Error recording event:', error);
    }
};

testBlockchainEvent();
```

### C. **Verify Tamper-Proof Storage**

1. **Check IPFS Integration:**
```javascript
// Test IPFS evidence storage
const testEvidenceStorage = async () => {
    // Create a test file
    const testFile = new File(['Test evidence document'], 'evidence.pdf', {
        type: 'application/pdf'
    });
    
    const eventId = await reputationService.recordReputationEvent(
        '44444444-4444-4444-4444-444444444444',
        'dispute_resolved',
        'test-dispute-123',
        '88888888-8888-8888-8888-888888888888',
        5,
        'Successfully resolved complex property dispute',
        [testFile] // Evidence files
    );
    
    console.log('Event with evidence recorded:', eventId);
};
```

2. **Verify Blockchain Transaction:**
   - Check the `blockchain_tx_id` in reputation_events table
   - Verify transaction exists on Algorand TestNet
   - Visit: `https://testnet.algoexplorer.io/tx/[TRANSACTION_ID]`

---

## 📜 **3. CREDENTIAL VERIFICATION SYSTEM**

### A. **View Existing Credentials**

1. **Login as Sarah Martinez** (`sarah.martinez@lawfirm.com`)
2. **Go to Profile Page**
3. **View Legal Credentials Component**
4. **You should see:**
   - DC Bar License (verified)
   - NY State Bar License (verified)
   - Certified Corporate Counsel (verified)
   - All with blockchain verification status

### B. **Test Credential Upload**

```javascript
// Test credential verification
const testCredentialUpload = async () => {
    const userId = '44444444-4444-4444-4444-444444444444';
    
    // Create mock credential file
    const credentialFile = new File(['Mock Bar License'], 'bar_license.pdf', {
        type: 'application/pdf'
    });
    
    try {
        const credentialId = await reputationService.verifyLegalCredential(
            userId,
            'bar_license',
            'Texas State Bar License',
            'State Bar of Texas',
            'Texas',
            credentialFile,
            '2020-01-15', // issued date
            '2026-01-15'  // expiry date
        );
        
        console.log('✅ Credential verified:', credentialId);
        
        // Check if reputation event was created
        const history = await reputationService.getReputationHistory(userId, 5);
        console.log('Updated reputation history:', history);
        
    } catch (error) {
        console.error('❌ Credential verification failed:', error);
    }
};

testCredentialUpload();
```

### C. **Test Credential Status Management**

```sql
-- Check credential verification status
SELECT 
    credential_name,
    issuing_authority,
    verification_status,
    blockchain_tx_id,
    created_at
FROM legal_credentials 
WHERE user_id = '44444444-4444-4444-4444-444444444444'
ORDER BY created_at DESC;
```

---

## 🎖️ **4. CASE COMPLETION TRACKING**

### A. **Record Case Completion**

```javascript
// Test court-admissible case completion
const testCaseCompletion = async () => {
    const lawyerId = '44444444-4444-4444-4444-444444444444'; // Sarah Martinez
    const clientId = '88888888-8888-8888-8888-888888888888'; // David Wilson
    const gigId = 'test-case-456';
    
    // Mock case documents
    const documents = [
        new File(['Contract draft'], 'contract.pdf', { type: 'application/pdf' }),
        new File(['Legal opinion'], 'opinion.pdf', { type: 'application/pdf' })
    ];
    
    const finalDeliverable = new File(['Final contract'], 'final_contract.pdf', {
        type: 'application/pdf'
    });
    
    try {
        const completionId = await reputationService.recordCaseCompletion(
            lawyerId,
            clientId,
            gigId,
            'contract_drafting',
            'M&A Transaction Legal Framework',
            'completed',
            documents,
            finalDeliverable,
            5, // quality score
            5  // client satisfaction
        );
        
        console.log('✅ Case completion recorded:', completionId);
        
        // Check reputation impact
        const newScore = await reputationService.calculateReputationScore(lawyerId);
        console.log('Updated reputation score:', newScore);
        
    } catch (error) {
        console.error('❌ Case completion failed:', error);
    }
};

testCaseCompletion();
```

### B. **View Case History**

```javascript
// Get lawyer's case completion history
const viewCaseHistory = async () => {
    const lawyerId = '44444444-4444-4444-4444-444444444444';
    
    const cases = await reputationService.getCaseCompletions(lawyerId);
    console.log('Case completion history:', cases);
    
    cases.forEach(case => {
        console.log(`Case: ${case.case_title}`);
        console.log(`Status: ${case.completion_status}`);
        console.log(`Quality: ${case.quality_score}/5`);
        console.log(`Client Satisfaction: ${case.client_satisfaction}/5`);
        console.log(`Court Admissible: ${case.court_admissible}`);
        console.log(`Blockchain TX: ${case.blockchain_verification_tx}`);
        console.log('---');
    });
};

viewCaseHistory();
```

---

## 👥 **5. PEER ATTESTATION SYSTEM**

### A. **Add Peer Endorsement**

```javascript
// Test peer attestation with blockchain proof
const testPeerAttestation = async () => {
    const subjectUserId = '44444444-4444-4444-4444-444444444444'; // Sarah Martinez
    const attesterId = '55555555-5555-5555-5555-555555555555'; // James Thompson
    
    try {
        const attestationId = await reputationService.addPeerAttestation(
            subjectUserId,
            attesterId,
            'professional_competence',
            5, // score
            'Sarah is an exceptional corporate lawyer with deep expertise in M&A transactions. I have worked with her on several complex deals and can attest to her professionalism and legal acumen.',
            'colleague',
            3 // years known
        );
        
        console.log('✅ Peer attestation recorded:', attestationId);
        
        // Check reputation impact
        const updatedScore = await reputationService.calculateReputationScore(subjectUserId);
        console.log('Updated reputation after attestation:', updatedScore);
        
    } catch (error) {
        console.error('❌ Peer attestation failed:', error);
    }
};

testPeerAttestation();
```

### B. **View Attestation History**

```sql
-- Check peer attestations
SELECT 
    ra.attestation_type,
    ra.attestation_score,
    ra.attestation_text,
    ra.professional_relationship,
    ra.years_known,
    ra.weight,
    ra.blockchain_tx_id,
    p.first_name || ' ' || p.last_name as attester_name
FROM reputation_attestations ra
JOIN profiles p ON ra.attester_id = p.id
WHERE ra.subject_user_id = '44444444-4444-4444-4444-444444444444'
ORDER BY ra.created_at DESC;
```

---

## 📊 **6. COMPREHENSIVE TESTING WORKFLOW**

### A. **End-to-End Reputation Test**

1. **Start with Fresh User:**
   ```sql
   -- Check initial reputation (should be 0)
   SELECT * FROM reputation_scores WHERE user_id = 'NEW_USER_ID';
   ```

2. **Add Legal Credential:**
   - Upload bar license document
   - Verify blockchain recording
   - Check reputation increase

3. **Complete a Gig:**
   - Record case completion with documents
   - Verify IPFS storage
   - Check Algorand transaction

4. **Receive Client Feedback:**
   - Client submits 5-star review
   - System automatically records reputation event
   - Verify blockchain integration

5. **Get Peer Attestation:**
   - Another lawyer endorses work
   - System records attestation with weight
   - Check overall reputation recalculation

6. **Final Verification:**
   ```javascript
   // Check final reputation state
   const finalScore = await reputationService.calculateReputationScore(userId);
   const level = reputationService.getReputationLevel(finalScore.overall);
   const history = await reputationService.getReputationHistory(userId);
   
   console.log('Final Reputation:', finalScore);
   console.log('Reputation Level:', level);
   console.log('Event History:', history);
   ```

---

## 🔧 **7. DATABASE VERIFICATION QUERIES**

### Check All Reputation Data:
```sql
-- Complete reputation overview
SELECT 
    p.first_name || ' ' || p.last_name as lawyer_name,
    rs.reputation_type,
    rs.score,
    rs.total_reviews,
    rs.successful_completions,
    rs.average_rating
FROM reputation_scores rs
JOIN profiles p ON rs.user_id = p.id
ORDER BY p.last_name, rs.reputation_type;

-- Recent reputation events
SELECT 
    p.first_name || ' ' || p.last_name as lawyer_name,
    re.event_type,
    re.rating,
    re.review_text,
    re.blockchain_tx_id,
    re.created_at
FROM reputation_events re
JOIN profiles p ON re.user_id = p.id
ORDER BY re.created_at DESC
LIMIT 20;

-- Legal credentials overview
SELECT 
    p.first_name || ' ' || p.last_name as lawyer_name,
    lc.credential_type,
    lc.credential_name,
    lc.issuing_authority,
    lc.verification_status,
    lc.blockchain_tx_id
FROM legal_credentials lc
JOIN profiles p ON lc.user_id = p.id
ORDER BY p.last_name, lc.credential_type;
```

---

## 🎯 **8. EXPECTED TEST RESULTS**

### ✅ **Success Indicators:**

1. **Reputation Scores:**
   - Values between 0-100
   - Proper weighting across specializations
   - Accurate calculation of overall score

2. **Blockchain Integration:**
   - Every event has `blockchain_tx_id`
   - Transactions verifiable on Algorand TestNet
   - IPFS CIDs for document storage

3. **Credential System:**
   - Upload and verification workflow
   - Blockchain proof of credentials
   - Impact on reputation scores

4. **Case Completions:**
   - Court-admissible documentation
   - Quality and satisfaction tracking
   - Automatic reputation updates

5. **Peer Attestations:**
   - Weighted scoring based on attester reputation
   - Blockchain verification
   - Professional relationship tracking

### 🚨 **Troubleshooting:**

**If blockchain recording fails:**
- Check Algorand service configuration
- Verify wallet addresses are set
- Check IPFS service availability

**If reputation calculation is wrong:**
- Verify database trigger functions
- Check reputation_config table weights
- Ensure proper data types in calculations

**If UI components don't load:**
- Check user authentication
- Verify user ID in reputation queries
- Check console for JavaScript errors

---

## 🚀 **Quick Start Testing Commands**

```bash
# 1. Start the application
npm run dev

# 2. Open browser console and run:
# (Copy and paste the JavaScript test functions above)

# 3. Check database state:
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
SELECT COUNT(*) as reputation_events FROM reputation_events;
SELECT COUNT(*) as credentials FROM legal_credentials;
SELECT COUNT(*) as case_completions FROM legal_case_completions;
"

# 4. Login with test users and explore the UI:
# - sarah.martinez@lawfirm.com (seller123)
# - james.thompson@propertylaw.com (seller123)
# - david.wilson@devco.com (buyer123)
```

This comprehensive testing guide covers all aspects of the professional reputation system with blockchain security and legal-grade verification! 🎉