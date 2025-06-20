import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as circleSdk from '../services/circleSdk';

// User types
type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
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
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  ethAddress: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  updateProfile: (userData: Partial<User> & { profile_picture?: File }) => Promise<void>;
  createTestUser: (role: UserRole) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithMetaMask: (role?: UserRole) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  getUser: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
}

// Mock users for demo
const DEMO_USERS = [
  {
    id: '1',
    name: 'Demo Buyer',
    email: 'buyer@ile-legal.com', // Updated
    password: 'buyer', //  Updated to match Supabase
    role: 'buyer' as UserRole,
    isVerified: true
  },
  {
    id: '2',
    name: 'Demo Seller',
    email: 'seller1@ile-legal.com', // Updated
    password: 'seller', // Updated to match Supabase
    role: 'seller' as UserRole,
    isVerified: true
  },
  {
    id: '3',
    name: 'Demo Admin',
    email: 'admin.test@ile-legal.com', // Updated
    password: 'password123', // Keep existing for admin
    role: 'admin' as UserRole,
    isVerified: true
  }
];

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Import the Supabase client from our lib/supabase.ts file
import { supabaseLocal as supabase } from '../lib/supabaseLocal';

// Function to create a test user for development purposes
const createTestUser = async (role: UserRole = 'buyer'): Promise<void> => {
  console.log('createTestUser function called with role:', role);
  
  try {
    // Generate random email
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    const randomPassword = 'Password123!';
    
    // Create user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: randomEmail,
      password: randomPassword,
      options: {
        data: {
          name: `Test User ${Math.floor(Math.random() * 1000)}`,
          role: role
        }
      }
    });
    
    if (error) {
      console.error('Error creating test user:', error.message);
      return;
    }
    
    console.log('Test user created:', data);
  } catch (error: any) {
    console.error('Error creating test user:', error.message);
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ileUser');
    const storedToken = localStorage.getItem('ileToken');
    const storedEthAddress = localStorage.getItem('ileEthAddress');
    
    try {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setToken(storedToken);
      }
      if (storedEthAddress) {
        setEthAddress(storedEthAddress);
      }
    } catch (error) {
      console.error('Failed to parse stored user', error);
      localStorage.removeItem('ileUser');
      localStorage.removeItem('ileToken');
      localStorage.removeItem('ileEthAddress');
    }
    setIsLoading(false);
  }, []);

  // New function to fetch current user from Supabase
  async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    const userData = await getUser();
    if (userData) {
      setUser(userData);
      setToken(session?.access_token || null);
      
      // Set ethAddress from Circle wallet or ETH address
      const walletAddress = userData.user_metadata?.circle_wallet_address || userData.user_metadata?.eth_address;
      if (walletAddress) {
        setEthAddress(walletAddress);
        localStorage.setItem('ileEthAddress', walletAddress);
      } else {
        setEthAddress(null);
        localStorage.removeItem('ileEthAddress');
      }
      
      localStorage.setItem('ileUser', JSON.stringify(userData));
      localStorage.setItem('ileToken', session?.access_token || '');
    } else {
      setUser(null);
      setToken(null);
      setEthAddress(null);
      localStorage.removeItem('ileUser');
      localStorage.removeItem('ileToken');
      localStorage.removeItem('ileEthAddress');
    }
  }

  // Function to get user data from session with comprehensive role detection
  async function getUser(): Promise<User | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    if (session) {
      // Enhanced role detection logic from first file
      let detectedRole: UserRole = 'buyer'; // Default fallback
      const email = session.user.email || '';
      
      // Try to get role from user metadata first
      if (session.user.user_metadata?.role_title) {
        detectedRole = session.user.user_metadata.role_title as UserRole;
      } else if (session.user.user_metadata?.role) {
        detectedRole = session.user.user_metadata.role as UserRole;
      } else {
        // Email-based role detection as reliable fallback
        if (email.includes('admin') || email === 'admin.test@ile-legal.com') {
          detectedRole = 'admin';
        } else if (email.includes('seller') || email === 'seller1@ile-legal.com') {
          detectedRole = 'seller';
        } else if (email.includes('buyer') || email === 'buyer@ile-legal.com') {
          detectedRole = 'buyer';
        }
      }
      
      // Handle profile picture
      let profilePictureUrl = null;
      if (session.user.user_metadata.user_metadata) {
        const { data } = await supabase
          .storage
          .from('profile-pictures')
          .getPublicUrl(`profile_pictures/${session.user.id}.jpg`);
        profilePictureUrl = data;
      }
      
      return {
        id: session.user.id,
        name: session.user.user_metadata.name || '',
        email: email,
        role: detectedRole,
        isVerified: session.user.user_metadata.email_verified || false,
        user_metadata: {
          ...session.user.user_metadata,
          profile_picture: profilePictureUrl?.publicUrl || session.user.user_metadata.profile_picture
        }
      };
    }
    return null;
  }

  // Call getCurrentUser on mount and when session changes
  useEffect(() => {
    getCurrentUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getCurrentUser();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    console.log(data, error);
    return data;
  }

  // Enhanced login function with comprehensive role detection
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await signInWithEmail(email, password);
      if (!data || !data.user) {
        throw new Error('Invalid user data received');
      }
      
      // Debug user metadata and role detection
      console.log('Login - User metadata:', data.user.user_metadata);
      console.log('Login - Role from role_title:', data.user.user_metadata?.role_title);
      console.log('Login - Role from role:', data.user.user_metadata?.role);
      
      // Enhanced role detection with email-based fallback
      let detectedRole: UserRole = 'buyer'; // Default fallback
      
      // Try to get role from user metadata first
      if (data.user.user_metadata?.role_title) {
        detectedRole = data.user.user_metadata.role_title as UserRole;
        console.log('Login - Role from role_title:', detectedRole);
      } else if (data.user.user_metadata?.role) {
        detectedRole = data.user.user_metadata.role as UserRole;
        console.log('Login - Role from role:', detectedRole);
      } else {
        // Email-based role detection as reliable fallback
        console.log('Login - No role in metadata, using email-based detection for:', email);
        if (email.includes('admin') || email === 'admin.test@ile-legal.com') {
          detectedRole = 'admin';
          console.log('Login - Detected admin from email');
        } else if (email.includes('seller') || email === 'seller1@ile-legal.com') {
          detectedRole = 'seller';
          console.log('Login - Detected seller from email');
        } else if (email.includes('buyer') || email === 'buyer@ile-legal.com') {
          detectedRole = 'buyer';
          console.log('Login - Detected buyer from email');
        }
      }
      
      console.log('Login - Final detected role:', detectedRole);
      
      const user: User = {
        id: data.user.id,
        name: data.user.user_metadata?.name || '',
        email: data.user.email || '',
        role: detectedRole,
        isVerified: !!data.user.user_metadata?.email_verified,
        user_metadata: data.user.user_metadata || {}
      };

      const mockToken = `mock-token-${Date.now()}`;

      setUser(user);
      setToken(mockToken);
      
      // Set ethAddress from Circle wallet or ETH address
      const walletAddress = user.user_metadata?.circle_wallet_address || user.user_metadata?.eth_address;
      if (walletAddress) {
        setEthAddress(walletAddress);
        localStorage.setItem('ileEthAddress', walletAddress);
      }
      
      localStorage.setItem('ileUser', JSON.stringify(user));
      localStorage.setItem('ileToken', mockToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced sign up function with Circle wallet integration
  async function signUpNewUser(email: string, name: string, password: string, role: UserRole) {
    try {
      // Register user with Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
          data: {
            name: name,
            role_title: role,
            role: role,
            email_verified: false
          }
        },
      });
      
      if (error) {
        console.error('Error signing up:', error);
        throw error;
      }
      
      if (data?.user) {
        // Create a user object that matches our app's User interface
        const newUser: User = {
          id: data.user.id,
          name: name,
          email: email,
          role: role,
          isVerified: false,
          user_metadata: data.user.user_metadata || {}
        };
        
        try {
          // Create a Circle wallet for the new user using SDK
          console.log('Creating Circle wallet for new user:', newUser.id);
          
          const walletDescription = `${newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)} wallet for ${newUser.name}`;
          const wallet = await circleSdk.createWallet(newUser.id, walletDescription);
          
          console.log('Circle wallet created:', wallet.walletId);
          
          // Generate a wallet address
          const addressData = await circleSdk.generateWalletAddress(wallet.walletId);
          
          console.log('Wallet address generated:', addressData.address);
          
          // Update the user object with wallet information
          newUser.user_metadata = {
            ...newUser.user_metadata,
            circle_wallet_id: wallet.walletId,
            circle_wallet_address: addressData.address
          };
          
          // Update the user in Supabase with the wallet information
          await supabase.auth.updateUser({
            data: {
              circle_wallet_id: wallet.walletId,
              circle_wallet_address: addressData.address
            }
          });
          
          console.log('Real Circle wallet setup complete!');
        } catch (walletError) {
          // Log the error but don't fail the registration process
          console.error('Error creating Circle wallet:', walletError);
          
          // Fallback to mock wallet if Circle API fails
          console.log('Falling back to mock wallet...');
          const mockWalletAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
          
          newUser.user_metadata = {
            ...newUser.user_metadata,
            circle_wallet_id: `wallet_${newUser.id}`,
            circle_wallet_address: mockWalletAddress
          };
          
          await supabase.auth.updateUser({
            data: {
              circle_wallet_id: `wallet_${newUser.id}`,
              circle_wallet_address: mockWalletAddress
            }
          });
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error in signUpNewUser:', error);
      throw error;
    }
  }

  // Register function
  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user already exists
      if (DEMO_USERS.some(u => u.email === email)) {
        throw new Error('User already exists');
      }

      const newUser = {
        id: `${Date.now()}`,
        name,
        email,
        role,
        isVerified: false,
        user_metadata: {}
      };

      const mockToken = `mock-token-${Date.now()}`;

      setUser(newUser);
      setToken(mockToken);
      localStorage.setItem('ileUser', JSON.stringify(newUser));
      localStorage.setItem('ileToken', mockToken);
      
      const signupData = await signUpNewUser(email, name, password, role);
      
      // Update ethAddress if wallet was created during signup
      if (signupData?.user?.user_metadata?.circle_wallet_address) {
        setEthAddress(signupData.user.user_metadata.circle_wallet_address);
        localStorage.setItem('ileEthAddress', signupData.user.user_metadata.circle_wallet_address);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced updateProfile function with file upload support
  async function updateProfile(updatedData: Partial<User> & { profile_picture?: File }) {
    const userData = await getUser();
    
    // Handle profile picture upload if provided
    if (updatedData.profile_picture) {
      const file = updatedData.profile_picture;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData?.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        throw uploadError;
      }
      
      // Get public URL for the uploaded file
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Add the profile picture URL to the user metadata
      updatedData.user_metadata = {
        ...updatedData.user_metadata,
        profile_picture: data.publicUrl
      };
      
      // Remove the file object as it can't be sent to Supabase API
      delete updatedData.profile_picture;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updatedData.user_metadata || {}
    });
    
    const authUser = data?.user;
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    if (authUser) {
      const updatedUser: User = {
        id: authUser.id,
        name: authUser.user_metadata?.name || '',
        email: authUser.email || '',
        role: (authUser.user_metadata?.role_title as UserRole) || (authUser.user_metadata?.role as UserRole) || 'buyer',
        isVerified: authUser.user_metadata?.email_verified === true,
        user_metadata: authUser.user_metadata || {}
      };
      setUser(updatedUser);
      localStorage.setItem('ileUser', JSON.stringify(updatedUser));
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call Supabase signOut directly
      await supabase.auth.signOut({scope: 'local'});
      
      // Clear local state
      setUser(null);
      setToken(null);
      setEthAddress(null);
      localStorage.removeItem('ileUser');
      localStorage.removeItem('ileToken');
      localStorage.removeItem('ileEthAddress');
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Enhanced MetaMask sign-in with Circle wallet integration
  const signInWithMetaMask = async (role: UserRole = 'buyer'): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Check if ethereum object exists
      if (!(window as any).ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask to continue.');
      }
      
      // Directly access MetaMask if available
      const ethereum = (window as any).ethereum;
      
      // Check specifically for MetaMask
      if (!ethereum.isMetaMask) {
        throw new Error('Please use MetaMask for authentication. Other wallets are not supported.');
      }
      
      // Create a provider using ethers v6 syntax
      let provider;
      try {
        // In ethers v6, we use BrowserProvider instead of Web3Provider
        provider = new ethers.BrowserProvider(ethereum);
      } catch (error) {
        console.error('Error creating provider:', error);
        throw new Error('Failed to connect to MetaMask');
      }
      
      // Request account access specifically from MetaMask
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Get a signature from the user to verify they own the address
      const message = `Sign this message to authenticate with Ile Legal: ${Date.now()}`;
      const signature = await signer.signMessage(message);
      
      // Verify the signature on the backend via Supabase
      const { data, error } = await supabase.functions.invoke('verify-ethereum-signature', {
        body: { address, message, signature }
      });
      
      if (error) {
        throw error;
      }
      
      // If verification is successful, create or update user
      if (data?.verified) {
        // Check if user exists with this ETH address
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('eth_address', address)
          .single();
        
        if (userError && userError.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
          throw userError;
        }
        
        if (userData) {
          // User exists, update session
          const updatedUser: User = {
            id: userData.id,
            name: userData.name || `ETH User ${address.substring(0, 6)}`,
            email: userData.email || '',
            role: (userData.role_title as UserRole) || (userData.role as UserRole) || 'buyer',
            isVerified: true, // ETH users are considered verified
            user_metadata: {
              ...userData,
              eth_address: address
            }
          };
          
          setUser(updatedUser);
          setEthAddress(address);
          localStorage.setItem('ileUser', JSON.stringify(updatedUser));
          localStorage.setItem('ileEthAddress', address);
          
          // Check if user has a Circle wallet, create one if not
          if (!userData.circle_wallet_id) {
            try {
              console.log('Creating mock wallet for existing MetaMask user:', updatedUser.id);
              const mockWalletAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
              console.log('Mock wallet created for MetaMask user:', mockWalletAddress);
            } catch (walletError) {
              console.error('Error setting up wallet for MetaMask user:', walletError);
            }
          }
        } else {
          // Create new user with ETH address
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('eth_address', address)
            .single();

          if (!userProfile) {
            // Create a new user if not exists
            const randomPassword = Math.random().toString(36).slice(-8);
            
            const { data: newUser, error: signUpError } = await supabase.auth.signUp({
              email: `eth_${address.toLowerCase()}@example.com`,
              password: randomPassword,
              options: {
                data: {
                  eth_address: address,
                  name: `Ethereum User ${address.slice(0, 6)}`,
                  role: role, // Use the provided role
                  email_verified: true // Consider Ethereum users as verified
                }
              }
            });
            
            if (signUpError) {
              throw signUpError;
            }
            
            if (newUser?.user) {
              const createdUser: User = {
                id: newUser.user.id,
                name: `Ethereum User ${address.slice(0, 6)}`,
                email: newUser.user.email || '',
                role: role,
                isVerified: true,
                user_metadata: {
                  ...newUser.user.user_metadata,
                  eth_address: address
                }
              };
              
              setUser(createdUser);
              setEthAddress(address);
              localStorage.setItem('ileUser', JSON.stringify(createdUser));
              localStorage.setItem('ileEthAddress', address);
              
              // Create a mock wallet for the new MetaMask user
              try {
                console.log('Creating mock wallet for new MetaMask user:', createdUser.id);
                const mockWalletAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
                console.log('Mock wallet created for MetaMask user:', mockWalletAddress);
              } catch (walletError) {
                console.error('Error setting up wallet for MetaMask user:', walletError);
              }
            }
          }
        }
        
        console.log('Successfully authenticated with MetaMask:', address);
      } else {
        throw new Error('Failed to verify Ethereum signature');
      }
    } catch (error) {
      console.error('Error signing in with MetaMask:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enhanced Google sign-in with role handling
  const signInWithGoogle = async (role: UserRole = 'buyer'): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Store the selected role in localStorage to retrieve after OAuth redirect
      localStorage.setItem('pendingUserRole', role);
      console.log('Stored role in localStorage:', role);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Pass the role as a query parameter
            role: role
          }
        }
      });
      
      if (error) throw error;
      
      // The user will be redirected to Google for authentication
      console.log('Google sign in initiated:', data);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        createTestUser,
        setUser,
        getUser,
        token,
        ethAddress,
        signInWithGoogle,
        signInWithMetaMask,
        resetPassword,
        uploadProfilePicture: async (file: File): Promise<string> => {
          if (!user) return '';
          await updateProfile({ profile_picture: file });
          return user.user_metadata?.profile_picture || '';
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};