import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as circleSdk from '../services/circleSdk';

// User types
type UserRole = 'buyer' | 'seller' | 'admin';

interface Education {
  degree: string;
  institution: string;
  period: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  status?: string;
  user_metadata: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    title?: string;
    about?: string;
    specializations?: string[];
    education?: Education[];
    profile_picture?: string;
    role_title?: string;
    clearance_level?: string;
    email_verified?: boolean;
    eth_address?: string;
    circle_wallet_id?: string;
    circle_wallet_address?: string;
    status?: string;
    verification_status?: string;
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
  getAllUsers: (sellers?: boolean) => Promise<User[]>;
  updateUserStatus: (userId: string, status: string) => Promise<void>;
  getUserStats: () => Promise<{ recentAccounts: number; recentSignIns: number }>;
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

// Import the Supabase client from our lib/supabase.ts file (remote database)
import { supabase } from '../lib/supabase';

// Function to create a test user for development purposes
const createTestUser = async (role: UserRole = 'buyer'): Promise<void> => {
  console.log('createTestUser function called with role:', role);
  console.log("supabase", supabase);
  
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
      // Get user data from Profiles table
      if (!session.user.id) {
        console.error('No user ID in session');
        return createUserFromSession(session);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('Profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        // Fallback to session data if profile fetch fails
        return createUserFromSession(session);
      }

      // Enhanced role detection logic
      let detectedRole: UserRole = 'buyer'; // Default fallback
      const email = session.user.email || '';
      
      // Try to get role from profile data first, then user metadata
      if (profileData.role_title) {
        detectedRole = profileData.role_title as UserRole;
      } else if (profileData.role) {
        detectedRole = profileData.role as UserRole;
      } else if (session.user.user_metadata?.role_title) {
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
      if (profileData.profile_picture || session.user.user_metadata.user_metadata) {
        const { data } = await supabase
          .storage
          .from('profile-pictures')
          .getPublicUrl(`profile_pictures/${session.user.id}.jpg`);
        profilePictureUrl = data;
      }
      
      return {
        id: session.user.id,
        name: profileData.name || session.user.user_metadata.name || '',
        email: email,
        role: detectedRole,
        isVerified: profileData.email_verified || session.user.user_metadata.email_verified || false,
        user_metadata: {
          ...session.user.user_metadata,
          ...profileData,
          profile_picture: profilePictureUrl?.publicUrl || profileData.profile_picture || session.user.user_metadata.profile_picture
        }
      };
    }
    return null;
  }

  // Helper function to create user from session data (fallback)
  function createUserFromSession(session: any): User {
    let detectedRole: UserRole = 'buyer';
    const email = session.user.email || '';
    
    if (session.user.user_metadata?.role_title) {
      detectedRole = session.user.user_metadata.role_title as UserRole;
    } else if (session.user.user_metadata?.role) {
      detectedRole = session.user.user_metadata.role as UserRole;
    } else {
      if (email.includes('admin') || email === 'admin.test@ile-legal.com') {
        detectedRole = 'admin';
      } else if (email.includes('seller') || email === 'seller1@ile-legal.com') {
        detectedRole = 'seller';
      } else if (email.includes('buyer') || email === 'buyer@ile-legal.com') {
        detectedRole = 'buyer';
      }
    }
    
    return {
      id: session.user.id,
      name: session.user.user_metadata.name || '',
      email: email,
      role: detectedRole,
      isVerified: session.user.user_metadata.email_verified || false,
      user_metadata: session.user.user_metadata
    };
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
      console.log("login", email, password);
      setIsLoading(true);
      const data = await signInWithEmail(email, password);
      console.log("data", data);
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
            email_verified: true
          }
        },
      });
      
      console.log('Supabase signup response:', { data, error });
      
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
          
          if (!newUser.id) {
            throw new Error('No user ID available for wallet creation');
          }
          
          const walletDescription = `${newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)} wallet for ${newUser.name}`;
          const wallet = await circleSdk.createWallet(newUser.id, walletDescription);
          
          if (!wallet?.walletId) {
            throw new Error('Failed to create Circle wallet - no wallet ID returned');
          }
          
          console.log('Circle wallet created:', wallet.walletId);
          
          // Generate a wallet address
          const addressData = await circleSdk.generateWalletAddress(wallet.walletId);
          
          if (!addressData?.address) {
            throw new Error('Failed to generate wallet address');
          }
          
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
            circle_wallet_id: `wallet_${newUser.id || 'unknown'}`,
            circle_wallet_address: mockWalletAddress
          };
          
          await supabase.auth.updateUser({
            data: {
              circle_wallet_id: `wallet_${newUser.id || 'unknown'}`,
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

      // Register user with Supabase Auth
      const signUpResult = await signUpNewUser(email, name, password, role);
      const userId = signUpResult?.user?.id;
      
      if (userId && signUpResult?.session) {
        // Set the session to authenticate the user before inserting into profiles
        await supabase.auth.setSession(signUpResult.session);
        
        // Insert into profiles table with authenticated context
        const { error: profileError } = await supabase.from('Profiles').insert([
          {
            id: userId,
            first_name: name.split(' ')[0] || '',
            last_name: name.split(' ').slice(1).join(' ') || '',
            email,
            user_type: role,
            verification_status: 'pending'
          }
        ]);
        if (profileError) {
          console.error('Error inserting into profiles:', profileError);
          throw profileError;
        }
      }

      // Set user in state (optional, for immediate login)
      const newUser = {
        id: userId || `${Date.now()}`,
        name,
        email,
        role,
        isVerified: false,
        user_metadata: { role_title: role }
      };
      const mockToken = `mock-token-${Date.now()}`;
      setUser(newUser);
      setToken(mockToken);
      localStorage.setItem('ileUser', JSON.stringify(newUser));
      localStorage.setItem('ileToken', mockToken);
      
      // Update ethAddress if wallet was created during signup
      if (signUpResult?.user?.user_metadata?.circle_wallet_address) {
        setEthAddress(signUpResult.user.user_metadata.circle_wallet_address);
        localStorage.setItem('ileEthAddress', signUpResult.user.user_metadata.circle_wallet_address);
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
      // Update the profiles table
      const userName = authUser.user_metadata?.name || '';
      const { error: profileUpdateError } = await supabase.from('Profiles').update({
        first_name: userName.split(' ')[0] || '',
        last_name: userName.split(' ').slice(1).join(' ') || '',
        email: authUser.email,
        user_type: authUser.user_metadata?.role_title || authUser.user_metadata?.role,
        verification_status: authUser.user_metadata?.email_verified ? 'verified' : 'pending',
        avatar_url: authUser.user_metadata?.profile_picture
      }).eq('id', authUser.id);
      if (profileUpdateError) {
        console.error('Error updating profiles table:', profileUpdateError);
        throw profileUpdateError;
      }
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
          .from('Profiles')
          .select('*')
          .eq('eth_address', address)
          .single();
        
        if (userError && userError.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
          throw userError;
        }
        
        if (userData) {
          // User exists, update session and ensure ETH address is stored
          await supabase
            .from('Profiles')
            .update({ eth_address: address })
            .eq('id', userData.id);
          
          const updatedUser: User = {
            id: userData.id,
            name: userData.name || `ETH User ${address.substring(0, 6)}`,
            email: userData.email || '',
            role: (userData.user_type as UserRole) || 'buyer',
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
            .from('Profiles')
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
              // Insert profile for new MetaMask user
              await supabase.from('Profiles').insert([
                {
                  id: newUser.user.id,
                  first_name: `Ethereum User ${address.slice(0, 6)}`,
                  last_name: '',
                  email: newUser.user.email || '',
                  user_type: role,
                  verification_status: 'verified',
                  eth_address: address
                }
              ]);
              
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

  // New getAllUsers function
  const getAllUsers = async (sellers?: boolean): Promise<User[]> => {
    // Check if current user is admin
    console.log("user", user);
    if (!user || user.user_metadata?.role_title !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    let query = supabase.from('Profiles').select('*');
    if (sellers) {
      query = query.eq('user_type', 'seller');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }

    console.log("data", data);

    return data.map((userData: any) => ({
      id: userData.id,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      email: userData.email,
      role: userData.user_type as UserRole,
      isVerified: userData.verification_status === 'verified',
      user_metadata: userData.user_metadata || {},
      status: userData.status || userData.verification_status || 'pending'
    }));
  };

  // Admin-only function to update a user's status
  const updateUserStatus = async (userId: string, status: string): Promise<void> => {
    if (!user || user.user_metadata?.role_title !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }
    const { error } = await supabase
      .from('Profiles')
      .update({ verification_status: status })
      .eq('id', userId);
    if (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  };

  // Admin-only function to get user statistics
  const getUserStats = async (): Promise<{ recentAccounts: number; recentSignIns: number }> => {
    // Check if current user is admin
    if (!user || user.user_metadata?.role_title !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    try {
      // Use supabase.auth.admin.listUsers() to get all users
      const { data: users, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Error fetching users with admin API:', error);
        throw error;
      }

      if (!users || !users.users) {
        console.warn('No users data returned from admin API');
        return { recentAccounts: 0, recentSignIns: 0 };
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Count accounts created in the last 7 days
      const recentAccounts = users.users.filter(user => {
        const createdAt = new Date(user.created_at);
        return createdAt >= sevenDaysAgo;
      }).length;

      // Count accounts that signed in within the last 7 days
      const recentSignIns = users.users.filter(user => {
        if (!user.last_sign_in_at) return false;
        const lastSignIn = new Date(user.last_sign_in_at);
        return lastSignIn >= sevenDaysAgo;
      }).length;

      console.log(`User stats: ${recentAccounts} recent accounts, ${recentSignIns} recent sign-ins`);
      
      return { recentAccounts, recentSignIns };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw error;
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
        getAllUsers,
        uploadProfilePicture: async (file: File): Promise<string> => {
          if (!user) return '';
          await updateProfile({ profile_picture: file });
          return user.user_metadata?.profile_picture || '';
        },
        updateUserStatus,
        getUserStats
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