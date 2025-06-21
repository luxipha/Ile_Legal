# Algorand IPFS Integration Setup

## 🔗 **Algorand + IPFS for Legal Documents**

This system uses Algorand's IPFS infrastructure for decentralized storage combined with blockchain verification, providing the perfect solution for legal document management.

## 📋 **Production Environment Variables**

Create a `.env.production` file with these variables:

```env
# Algorand IPFS Configuration
VITE_IPFS_URL=https://ipfs.algonode.xyz
VITE_ALGORAND_IPFS_TOKEN=your_algorand_ipfs_api_token
VITE_ALGORAND_NETWORK=mainnet

# Algorand Blockchain (for verification)
VITE_ALGORAND_MNEMONIC=your_25_word_mnemonic_phrase_here

# Circle API (already configured)
VITE_CIRCLE_API_URL=https://api.circle.com
VITE_CIRCLE_TEST_API_KEY=your_circle_production_key

# Supabase (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 🏗️ **Algorand IPFS Setup Steps**

### **1. Create Algorand Account**
```bash
# Option A: Use MyAlgo Wallet or Pera Wallet
# - Create account through official wallet
# - Export 25-word mnemonic phrase
# - Fund account with ALGO for transactions

# Option B: Create programmatically (for testing)
node -e "
const algosdk = require('algosdk');
const account = algosdk.generateAccount();
console.log('Address:', account.addr);
console.log('Mnemonic:', algosdk.secretKeyToMnemonic(account.sk));
"
```

**Important**: 
- Save the 25-word mnemonic phrase securely
- Fund the account with at least 1 ALGO for transactions
- For MainNet: Use a funded production wallet

### **2. Get IPFS Access Token**
- Visit [AlgoNode IPFS](https://algonode.io/ipfs)
- Register for IPFS API access
- Get your API token for production use

### **3. Deploy Smart Contract (Optional)**
For enhanced verification, deploy the document verification smart contract:
```bash
# Deploy contract for document hashing
algorand contract deploy --file contracts/DocumentVerification.py --network mainnet
```

### **4. Configure Application**
```bash
# Set environment variables
export VITE_ALGORAND_IPFS_TOKEN="your_token_here"
export VITE_ALGORAND_NETWORK="mainnet"
export VITE_IPFS_URL="https://ipfs.algonode.xyz"
```

## 💰 **Algorand IPFS Costs (Estimated)**

| Service | Cost | Description |
|---------|------|-------------|
| IPFS Storage | $0.01/GB/month | Permanent decentralized storage |
| Algorand Transactions | $0.001/tx | Blockchain verification |
| AlgoNode API | $50/month | IPFS gateway access |
| **Total Monthly** | **~$60-100** | Based on 10GB + 1000 tx/month |

## 🔒 **Legal Benefits of Algorand IPFS**

### **Dual Verification System:**
1. **IPFS Storage**: Permanent, immutable file storage
2. **Algorand Blockchain**: Transaction-level verification with timestamps

### **Court Admissibility Features:**
- **Cryptographic Proof**: SHA-256 file hashes on blockchain
- **Timestamp Verification**: Algorand block timestamps
- **Immutable Record**: Cannot be altered after submission
- **Global Accessibility**: Decentralized, always available

### **Legal Compliance:**
- **Data Sovereignty**: Files stored on decentralized network
- **Audit Trail**: Complete transaction history on blockchain
- **Professional Standards**: Meets legal industry security requirements

## 🚀 **Development vs Production**

### **Development (Current)**
- Uses mock IPFS for testing
- Local file hashing
- Simulated blockchain transactions
- No external dependencies

### **Production (With Algorand)**
- Real Algorand IPFS storage
- Blockchain verification on Algorand MainNet
- Professional-grade security
- Court-admissible document proof

## 🔧 **Integration Architecture**

```
Legal Document Upload
        ↓
1. Upload to Algorand IPFS
        ↓
2. Generate SHA-256 Hash
        ↓
3. Submit Hash to Algorand Blockchain
        ↓
4. Store IPFS CID + Algorand TX ID
        ↓
5. Return Court-Ready Verification
```

## 📞 **Support & Setup Assistance**

For production setup assistance:
- **AlgoNode Support**: support@algonode.io
- **Algorand Foundation**: developer.algorand.org
- **IPFS Documentation**: docs.ipfs.io

## ✅ **Verification Checklist**

Before going live, verify:
- [ ] Algorand IPFS token is valid
- [ ] Blockchain transactions are working
- [ ] File uploads complete successfully
- [ ] CIDs are properly formatted
- [ ] Legal metadata is preserved
- [ ] Backup systems are configured

With Algorand IPFS, your legal documents get:
- ✅ **Permanent Storage** (IPFS)
- ✅ **Blockchain Verification** (Algorand)
- ✅ **Court Admissibility** (Cryptographic proof)
- ✅ **Professional Grade** (Enterprise security)