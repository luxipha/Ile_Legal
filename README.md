# Ile Legal - Decentralized Legal Services Platform

**Built by Bolt for the Hackathon** 🚀

A revolutionary legal services marketplace powered by blockchain technology, featuring Circle SDK wallet integration, Algorand IPFS storage, and court-grade document verification.

## 🏛️ **Features**

### **For Legal Professionals**
- 🔍 **Find Legal Gigs**: Browse and bid on legal work opportunities
- 📄 **Secure Document Upload**: Court-grade security with blockchain verification
- 💰 **Circle Wallet Integration**: Automatic cryptocurrency wallet creation
- 🏦 **Payment Management**: Bank account integration for seamless payments
- ⚖️ **Court-Admissible Evidence**: All documents blockchain-verified on Algorand

### **For Clients**
- 📝 **Post Legal Requests**: Easy gig posting for legal services
- 💸 **Secure Payments**: Escrow transactions with Circle SDK
- 🔒 **Document Security**: IPFS + Algorand blockchain verification
- 📊 **Professional Dashboard**: Track projects and payments
- ⭐ **Rating System**: Review legal professionals

### **Technology Stack**
- **Frontend**: React + TypeScript + Tailwind CSS
- **Blockchain**: Algorand for document verification
- **Storage**: IPFS (Algorand IPFS) for decentralized file storage
- **Payments**: Circle SDK for cryptocurrency transactions
- **Database**: Supabase with Row Level Security
- **Authentication**: Multi-modal (Email, Google, MetaMask)

## 🚀 **Getting Started**

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ile-legal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:5173/](http://localhost:5173/)

## 🏗️ **Environment Configuration**

### **Development (.env.local)**
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Circle SDK (Testnet)
VITE_CIRCLE_API_URL=https://api-sandbox.circle.com
VITE_CIRCLE_TEST_API_KEY=your_circle_testnet_key

# Development mode (uses mock implementations)
VITE_ALGORAND_NETWORK=testnet
```

### **Production (.env.production)**
```env
# Algorand IPFS
VITE_IPFS_URL=https://ipfs.algonode.xyz
VITE_ALGORAND_IPFS_TOKEN=your_algorand_ipfs_token
VITE_ALGORAND_NETWORK=mainnet
VITE_ALGORAND_MNEMONIC=your_25_word_mnemonic_phrase

# Circle SDK (Production)
VITE_CIRCLE_API_URL=https://api.circle.com
VITE_CIRCLE_TEST_API_KEY=your_circle_production_key

# Supabase (Production)
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key
```

## 📦 **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Testing
npm run test         # Run tests (when implemented)
```

## 🏛️ **Legal Industry Innovation**

### **Court-Grade Security**
- **IPFS Storage**: Permanent, tamper-proof file storage
- **Algorand Blockchain**: Cryptographic verification timestamps
- **SHA-256 Hashing**: Industry-standard file integrity
- **Professional Compliance**: Meets legal industry standards

### **Financial Integration**
- **Circle SDK**: Automatic wallet creation for users
- **Escrow Transactions**: Secure payment holding
- **Bank Account Management**: Traditional banking integration
- **Multi-Currency Support**: USDC and traditional payments

### **User Experience**
- **Zero Technical Complexity**: Lawyers focus on legal work
- **Automatic Security**: Every document gets maximum protection
- **Professional Interface**: Clean, lawyer-friendly design
- **Mobile Responsive**: Works on all devices

## 🔧 **Architecture**

```
Frontend (React/TS)
    ↓
Supabase (Database/Auth)
    ↓
Circle SDK (Payments)
    ↓
Algorand IPFS (Storage)
    ↓
Algorand Blockchain (Verification)
```

## 🏆 **Hackathon Highlights**

- ✅ **Full-Stack Implementation**: Complete legal services platform
- ✅ **Blockchain Integration**: Real Algorand blockchain verification
- ✅ **Financial Technology**: Circle SDK cryptocurrency integration
- ✅ **Professional UX**: Lawyer-friendly interface design
- ✅ **Production Ready**: Deployable with proper environment setup
- ✅ **Scalable Architecture**: Handles multiple users and transactions

## 🤝 **Contributing**

This project was built for a hackathon. For questions or contributions, please contact the development team.

## 📄 **License**

Built by Bolt for the Hackathon - All rights reserved.

---

**Ile Legal** - Revolutionizing legal services with blockchain technology 🏛️⚖️