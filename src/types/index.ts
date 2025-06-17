// User role types
export type UserRole = 'admin' | 'seller' | 'buyer';

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
  };
}
