// User role types (legacy - for backward compatibility)
export type UserRole = 'admin' | 'seller' | 'buyer';

// Enhanced role types (new system)
export * from './roles';

// User interface
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  user_metadata: {
    phone?: string;
    address?: string;
    profile_picture?: string;
    role_title?: string;
    clearance_level?: string;
    email_verified?: boolean;
    eth_address?: string;
    circle_wallet_id?: string;
    circle_wallet_address?: string;
    circle_wallet_status?: string;
  };
}

// For backward compatibility
export type User = UserProfile;

// Auth context type
export interface AuthContextType {
  user: User | null;
  token: string | null;
  ethAddress: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  createTestUser: (role: UserRole) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithMetaMask: (role?: UserRole) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  getUser: () => Promise<User | null>;
}

// Circle wallet types
export interface WalletData {
  walletId: string;
  address: string;
  status?: string;
  balances?: any[];
  availableToWithdraw?: any[];
}

export interface TransactionData {
  id: string;
  type: string;
  status: string;
  amount: {
    amount: string;
    currency: string;
  };
  source: {
    id: string;
    type: string;
  };
  destination: {
    id: string;
    type: string;
  };
  createDate: string;
  updateDate: string;
}
