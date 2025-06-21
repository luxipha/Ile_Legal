# 🔧 Fixed Reputation System Testing Guide

## ✅ **Integration Status**
- ✅ Profile page connected to real Supabase data
- ✅ Reputation components added with debugging
- ✅ User authentication properly extracted
- ✅ Your `buyer@ile.com` account has comprehensive reputation data

---

## 🧪 **Step-by-Step Testing Process**

### **Step 1: Start Your Application**
```bash
npm run dev
```

### **Step 2: Login with Your Account**
- **Email:** `buyer@ile.com`
- **Password:** Your existing password
- You should see your name change from "Demo Seller" to "Alex Rodriguez"

### **Step 3: Navigate to Profile Page**
- Click on "Profile" in the sidebar
- **You should now see:**
  1. **Debug User Info box** (blue box at top) showing:
     - User ID: `aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1`
     - Email: `buyer@ile.com`
     - Name: Your actual name
     - Role: seller/buyer
  2. **Reputation Display Component** with your scores
  3. **Legal Credentials Component** with 4 verified credentials

### **Step 4: Check Browser Console**
Open browser console (F12) and look for:
```
🔍 Fetching reputation for userId: aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1
✅ Reputation score fetched: {overall: 91.35, legal_review: 94.5, ...}
🔍 Fetching credentials for userId: aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1
✅ Credentials fetched: [4 credentials array]
```

---

## 🎯 **Expected Results**

### **A. Debug User Info Box Should Show:**
```
🔍 Debug: User Info
User ID: aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1
Email: buyer@ile.com
Name: [Your Name]
Role: [Your Role]
Verified: ✅
```

### **B. Reputation Display Should Show:**
- **Overall Score:** ~91.35 (Master level - purple)
- **Legal Review:** 94.5/100 (32 reviews, 30 completions)
- **Contract Drafting:** 96.0/100 (28 reviews, 27 completions)
- **Dispute Resolution:** 89.5/100 (15 reviews, 14 completions)
- **Master Level Badge** with purple color
- **Detailed specialization bars**

### **C. Legal Credentials Should Show:**
1. **New York State Bar License** - verified
2. **Intellectual Property Specialist** - verified
3. **Technology Law Certified Professional** - verified
4. **Certified Corporate Counsel** - verified

---

## 🔍 **Troubleshooting Steps**

### **If Debug Box Shows "No User Authenticated":**
1. **Check login status** - make sure you're actually logged in
2. **Check AuthContext** - the authentication might not be working
3. **Try refreshing the page** after login

### **If User ID is Different:**
1. **Check console logs** for the actual user ID being passed
2. **Update reputation data** with the correct user ID:
```sql
-- Get your actual user ID
SELECT id, email FROM auth.users WHERE email = 'buyer@ile.com';

-- Update reputation data with correct user ID
UPDATE reputation_scores SET user_id = 'YOUR_ACTUAL_USER_ID' 
WHERE user_id = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1';

UPDATE legal_credentials SET user_id = 'YOUR_ACTUAL_USER_ID' 
WHERE user_id = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1';
```

### **If Reputation Components Show "Loading..." Forever:**
1. **Check browser console** for error messages
2. **Verify database connection** - run the SQL check below
3. **Check network tab** for failed API calls

### **If Components Show Error Messages:**
1. **Check the exact error** in console logs
2. **Verify Supabase connection** is working
3. **Check if reputation tables exist**

---

## 🔧 **Quick Database Verification**

Run this to confirm your data is ready:
```sql
-- Check your user exists with reputation data
SELECT 
    'USER_CHECK' as test,
    p.email,
    p.first_name,
    COUNT(rs.*) as reputation_entries,
    COUNT(lc.*) as credentials
FROM profiles p
LEFT JOIN reputation_scores rs ON p.id = rs.user_id
LEFT JOIN legal_credentials lc ON p.id = lc.user_id
WHERE p.email = 'buyer@ile.com'
GROUP BY p.id, p.email, p.first_name;

-- Expected result: buyer@ile.com | Alex | 3 | 4
```

---

## 🧪 **Advanced Testing (After Basic UI Works)**

### **Test 1: Browser Console Reputation API**
```javascript
// Test the reputation service directly
const testReputation = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        // Your user ID (should match what debug box shows)
        const userId = 'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1';
        
        const score = await reputationService.calculateReputationScore(userId);
        console.log('✅ Full Reputation Score:', score);
        
        const level = reputationService.getReputationLevel(score.overall);
        console.log('✅ Reputation Level:', level);
        
        const credentials = await reputationService.getUserCredentials(userId);
        console.log('✅ Legal Credentials:', credentials);
        
        const history = await reputationService.getReputationHistory(userId);
        console.log('✅ Reputation History:', history);
        
    } catch (error) {
        console.error('❌ Test Error:', error);
    }
};

// Run the test
testReputation();
```

### **Test 2: Record New Reputation Event**
```javascript
const testNewEvent = async () => {
    try {
        const { reputationService } = await import('./src/services/reputationService');
        
        const eventId = await reputationService.recordReputationEvent(
            'aa8c38e9-4022-4d7c-9cc3-24a4f7aa19f1',
            'gig_completed',
            'test-gig-' + Date.now(),
            'test-reviewer-id',
            5,
            'Excellent legal work on complex matter!'
        );
        
        console.log('✅ New event recorded:', eventId);
        
        // Refresh the page to see updated scores
        window.location.reload();
        
    } catch (error) {
        console.error('❌ Event recording failed:', error);
    }
};

testNewEvent();
```

---

## 📞 **Get Help**

### **If Still Not Working:**

1. **Share Screenshots** of:
   - Debug user info box
   - Browser console errors
   - Reputation component area

2. **Share Console Output** of:
   - User ID being passed
   - Any error messages
   - Network requests in developer tools

3. **Run This Diagnostic:**
```javascript
// Diagnostic script
console.log('=== REPUTATION SYSTEM DIAGNOSTIC ===');
console.log('Current URL:', window.location.href);

// Check if services are loaded
try {
    const { reputationService } = await import('./src/services/reputationService');
    console.log('✅ ReputationService loaded');
} catch (e) {
    console.error('❌ ReputationService failed to load:', e);
}

// Check authentication
try {
    const auth = window.authContext || 'Not available';
    console.log('Auth context:', auth);
} catch (e) {
    console.error('❌ Auth context error:', e);
}

console.log('=== END DIAGNOSTIC ===');
```

---

## 🚀 **Next Steps After Testing**

Once the basic reputation display is working:

1. **Remove debug components** from Profile.tsx
2. **Test new reputation events** via browser console
3. **Test credential upload** functionality
4. **Test peer attestation** system
5. **Verify blockchain integration** 

**The reputation system should now be fully functional with your authenticated account!** 🎉