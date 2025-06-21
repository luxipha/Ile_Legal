# Ile Legal Platform - Developer Setup Guide

## Overview
This is a comprehensive legal services platform with blockchain integration, admin management, and Circle SDK wallet functionality.

## Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Git
- Supabase CLI

## Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/luxipha/Ile_Legal.git
cd Ile_Legal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy and configure environment variables:
```bash
cp .env.example .env
```

Required environment variables:
```env
# Circle API Configuration (Sandbox Mode)
VITE_CIRCLE_API_URL=https://api-sandbox.circle.com
VITE_CIRCLE_TEST_API_KEY=SAND_API_KEY:282f962469d8134d9a277eda922af98c:a3e8bf3112d46c6a6c0cbe9fc98f2a94
VITE_CIRCLE_WALLET_ADDRESS=0x4d0a760a88a5bc063804d4faa88b6d32e24619bf

# Supabase Configuration  
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_USE_LOCAL_SUPABASE=false
```

### 4. Database Setup

#### Option A: Use Provided Dumps
```bash
# Restore complete database
psql -h your_host -U your_user -d your_db < supabase_complete_dump.sql

# Or restore data only (if schema exists)
psql -h your_host -U your_user -d your_db < supabase_data_dump.sql
```

#### Option B: Run Migration Scripts
```bash
# Run in order:
psql -h your_host -U your_user -d your_db < scripts/create_roles_permissions_schema.sql
psql -h your_host -U your_user -d your_db < scripts/create_activity_tables.sql
psql -h your_host -U your_user -d your_db < scripts/create_app_settings_table_fixed.sql
psql -h your_host -U your_user -d your_db < scripts/add_app_settings_rls.sql
```

### 5. Start Development Server
```bash
npm run dev
```

## Key Features

### 🔐 Admin System
- Complete admin profile management
- Role-based access control (buyer, seller, admin, super_admin, moderator, support)
- Activity logging and session management
- Permission system with visual indicators

### 💰 Payment Integration
- Circle SDK integration for USDC transactions
- Wallet creation during user signup
- Escrow system for legal service payments
- Real-time balance and transaction tracking

### 🏗️ Blockchain Features
- IPFS document storage with Algorand anchoring
- SHA-256 hash verification for legal documents
- Court-grade document security
- Blockchain transaction proof

### 📋 Legal Workflow
- Secure legal document upload
- Gig-based legal service marketplace
- Messaging system for lawyer-client communication
- Dispute resolution framework

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test:admin   # Test admin API functions
npm run lint         # Run ESLint
```

## Project Structure

```
src/
├── components/
│   ├── admin-profile/          # Admin management UI
│   ├── blockchain/             # Blockchain integration
│   ├── SecureLegalUpload/      # Document upload system
│   └── WalletStatusNotification/
├── services/
│   ├── circleSdk.ts           # Circle API integration
│   ├── roleService.ts         # Role management
│   ├── ipfsService.ts         # IPFS storage
│   └── walletService.ts       # Wallet operations
├── hooks/
│   └── usePermissions.ts      # Permission management
└── contexts/
    └── AuthContext.tsx        # Authentication state
```

## Database Schema

### Core Tables
- `profiles` - User profiles and metadata
- `gigs` - Legal service listings
- `messages` - Communication system
- `admin_activity_log` - Activity tracking
- `app_settings` - Application configuration

### Key Relationships
- Users have roles (user_type field)
- Gigs belong to sellers (legal professionals)
- Messages connect buyers and sellers
- Activity logs track admin actions

## API Integrations

### Circle API
- Wallet creation and management
- USDC transactions
- Balance queries
- Address generation

### Algorand Blockchain
- Document hash storage
- Transaction verification
- Court-admissible proof

### IPFS
- Decentralized document storage
- Content addressing
- Redundant gateway support

## Admin Access

### Default Admin Account
Create admin user through the signup process with admin email pattern or use:
```javascript
// Run in browser console after signup
await createAdminUser({
  email: "admin@ile-legal.com",
  firstName: "Admin",
  lastName: "User", 
  password: "securepassword",
  userType: "super_admin"
});
```

### Admin Features
- User management and verification
- Role assignment and permissions
- Activity monitoring
- System configuration
- Payment oversight

## Testing

### Circle API Testing
```bash
npm run test:admin
```

### Manual Testing
1. Sign up as different user types (buyer, seller, admin)
2. Test wallet creation (check browser console)
3. Upload legal documents
4. Create and bid on gigs
5. Test messaging system

## Troubleshooting

### Common Issues

1. **Wallet Creation Fails**
   - Check Circle API key in environment
   - Verify network connectivity
   - Fallback mock wallet should still work

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Ensure tables exist

3. **Permission Errors**
   - Check user role assignment
   - Verify permission system setup
   - Test with super_admin role

## Support
For development questions or issues, check:
- Browser console for error details
- Network tab for API failures
- Supabase dashboard for database issues

## Next Steps (PL Genesis Integration)
The platform is ready for Protocol Labs genesis features:
- Quantum-resistant cryptography
- Zero-knowledge proofs
- Mesh network consultations
- Filecoin integration
- Advanced smart contracts