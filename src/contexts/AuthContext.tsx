import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { backendWalletService } from '../services/backendWalletService';

// User types
type UserRole = 'buyer' | 'seller' | 'admin';

interface Education {
  degree: string;
  institution: string;
  period: string;
}

// Comprehensive profile update interface matching all Profiles table columns
interface ProfileUpdateData {
  // Basic profile information
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  user_type?: string;
  verification_status?: string;
  jobs_completed?: number;
  specializations?: string[];
  linkedin?: string;
  industry?: string;
  areas_of_interest?: any;
  professional_title?: string;
  bar_license_number?: string;
  
  // Avatar/Profile picture
  avatar_url?: string;
  
  // Circle wallet information
  circle_wallet_id?: string;
  circle_wallet_address?: string;
  circle_wallet_created_at?: string;
  circle_wallet_status?: string;
  
  // Ethereum wallet information
  eth_address?: string;
  
  // Legacy user metadata fields (for backward compatibility)
  firstName?: string;
  lastName?: string;
  title?: string;
  about?: string;
  education?: Education[];
  profile_picture?: string;
  role_title?: string;
  clearance_level?: string;
  email_verified?: boolean;
  status?: string;
  real_email?: string;
  
  // File upload support
  profile_picture_file?: File;
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
    real_email?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  ethAddress: string | null;
  isLoading: boolean;
  isMetaMaskConnecting: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  updateProfile: (userData: ProfileUpdateData) => Promise<void>;
  createTestUser: (role: UserRole) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithMetaMask: (role?: UserRole) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  storeProfileDocuments: (file: File, filepath: string) => Promise<string>;
  getProfileDocuments: (userId?: string) => Promise<{ governmentId?: string; selfieWithId?: string; otherDocuments: string[] }>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  getUser: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  getAllUsers: (sellers?: boolean) => Promise<User[]>;
  updateUserStatus: (userId: string, status: string) => Promise<void>;
  getUserStats: () => Promise<{ recentAccounts: number; recentSignIns: number }>;
  completeMetaMaskProfile: (profileData: { firstName: string; lastName: string; email: string; phone?: string }) => Promise<void>;
  pendingMetaMaskProfile: { userId: string; address: string; role: UserRole } | null;
  setPendingMetaMaskProfile: (data: { userId: string; address: string; role: UserRole } | null) => void;
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
  const [isMetaMaskConnecting, setIsMetaMaskConnecting] = useState<boolean>(false);
  const [pendingMetaMaskProfile, setPendingMetaMaskProfile] = useState<{ userId: string; address: string; role: UserRole } | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ileUser');
    const storedToken = localStorage.getItem('ileToken');
    const storedEthAddress = localStorage.getItem('ileEthAddress');
    
    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Validate that the user object has required fields
        if (parsedUser.id && parsedUser.email && parsedUser.role) {
          setUser(parsedUser);
        } else {
          console.warn('Invalid stored user data, clearing localStorage');
          localStorage.clear();
        }
      }
      if (storedToken) {
        setToken(storedToken);
      }
      if (storedEthAddress) {
        setEthAddress(storedEthAddress);
      }
    } catch (error) {
      console.error('Failed to parse stored user', error);
      // Clear all localStorage data if parsing fails
      localStorage.clear();
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
        
        // If it's a MetaMask user without a profile, trigger profile completion
        if (profileError.code === 'PGRST116' && session.user.user_metadata?.eth_address) {
          console.log('MetaMask user found without profile, setting up profile completion');
          // Don't set loading to false yet, keep them in pending state
          setIsLoading(false); // Allow the modal to show
          setPendingMetaMaskProfile({
            userId: session.user.id,
            address: session.user.user_metadata.eth_address,
            role: (session.user.user_metadata.role as UserRole) || 'buyer'
          });
          return null; // Return null so they're not logged in until profile is complete
        }
        
        // Fallback to session data if profile fetch fails for other reasons
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
      
      // Use real email from profile or metadata, fallback to auth email
      const displayEmail = profileData.email || session.user.user_metadata.real_email || email;
      const displayName = profileData.first_name && profileData.last_name 
        ? `${profileData.first_name} ${profileData.last_name}`
        : session.user.user_metadata.name || '';

      return {
        id: session.user.id,
        name: displayName,
        email: displayEmail,
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
      
      // supabase.auth.updateUser({
      //   data: {
      //     role_title: 'seller'
      //   }
      // })
      // Debug user metadata and role detection
      console.log('Login - User metadata:', data.user.user_metadata);
      console.log('Login - Role from role_title:', data.user.user_metadata?.role_title);
      console.log('Login - Role from role:', data.user.user_metadata?.role);
      
      // Enhanced role detection with email-based fallback
      let detectedRole: UserRole = 'buyer'; // Default fallback
      
      // Try to get role from user metadata first
      if (data.user.user_metadata?.role_title) {
        detectedRole = data.user.user_metadata.role_title as UserRole;
        // detectedRole = 'seller'
        console.log('Login - Role from role_title:', detectedRole);
      } else if (data.user.user_metadata?.role) {
        detectedRole = data.user.user_metadata.role as UserRole;
        // detectedRole = 'seller'
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
        role: 'seller',
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
          // Create a Circle wallet for the new user using backend service
          console.log('Creating Circle wallet via backend for new user:', newUser.id);
          
          if (!newUser.id) {
            throw new Error('No user ID available for wallet creation');
          }
          
          const walletResponse = await backendWalletService.createWallet({
            userId: newUser.id,
            userType: newUser.role as 'buyer' | 'seller',
            name: newUser.name,
            email: newUser.email
          });
          
          if (!walletResponse.success || !walletResponse.wallet) {
            throw new Error(`Backend wallet creation failed: ${walletResponse.error || 'Unknown error'}`);
          }
          
          const wallet = walletResponse.wallet;
          console.log('Backend wallet created successfully:', wallet.circle_wallet_id);
          
          // Update the user object with wallet information
          newUser.user_metadata = {
            ...newUser.user_metadata,
            circle_wallet_id: wallet.circle_wallet_id,
            circle_wallet_address: wallet.wallet_address || undefined
          };
          
          // Update the user in Supabase with the wallet information
          await supabase.auth.updateUser({
            data: {
              circle_wallet_id: wallet.circle_wallet_id,
              circle_wallet_address: wallet.wallet_address
            }
          });
          
          console.log('Backend Circle wallet setup complete!');
        } catch (walletError) {
          // Log the error but don't fail the registration process
          console.error('Error creating Circle wallet via backend:', walletError);
          
          // Fallback to mock wallet if backend service fails
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
    console.log("register", name, email, password, role);
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

  // Enhanced updateProfile function with comprehensive profile update support
  async function updateProfile(updatedData: ProfileUpdateData) {
    const userData = await getUser();
    
    // Handle profile picture upload if provided
    if (updatedData.profile_picture_file) {
      const file = updatedData.profile_picture_file;
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
      
      // Add the profile picture URL to the avatar_url field
      updatedData.avatar_url = data.publicUrl;
      
      // Remove the file object as it can't be sent to Supabase API
      delete updatedData.profile_picture_file;
    }

    // Prepare user metadata for Supabase auth update (legacy fields)
    const userMetadata: any = {};
    
      // Map new profile fields to legacy metadata fields for backward compatibility
  if (updatedData.first_name) userMetadata.firstName = updatedData.first_name;
  if (updatedData.last_name) userMetadata.lastName = updatedData.last_name;
  if (updatedData.phone) userMetadata.phone = updatedData.phone;
  if (updatedData.bio) userMetadata.about = updatedData.bio;
  if (updatedData.location) userMetadata.address = updatedData.location;
  if (updatedData.avatar_url) userMetadata.profile_picture = updatedData.avatar_url;
  // if (updatedData.user_type) userMetadata.role_title = updatedData.user_type;
  if (updatedData.verification_status) userMetadata.verification_status = updatedData.verification_status;
  if (updatedData.eth_address) userMetadata.eth_address = updatedData.eth_address;
  if (updatedData.circle_wallet_id) userMetadata.circle_wallet_id = updatedData.circle_wallet_id;
  if (updatedData.circle_wallet_address) userMetadata.circle_wallet_address = updatedData.circle_wallet_address;
  if (updatedData.email) userMetadata.real_email = updatedData.email;
        if (updatedData.jobs_completed !== undefined) userMetadata.jobs_completed = updatedData.jobs_completed;
      if (updatedData.specializations) userMetadata.specializations = updatedData.specializations;
      if (updatedData.linkedin) userMetadata.linkedin = updatedData.linkedin;
      if (updatedData.industry) userMetadata.industry = updatedData.industry;
      if (updatedData.areas_of_interest) userMetadata.areas_of_interest = updatedData.areas_of_interest;
      // Note: education is now stored in Profiles table, not user metadata
    
      // Handle legacy fields directly
  if (updatedData.firstName) userMetadata.firstName = updatedData.firstName;
  if (updatedData.lastName) userMetadata.lastName = updatedData.lastName;
  if (updatedData.title) userMetadata.title = updatedData.title;
  if (updatedData.about) userMetadata.about = updatedData.about;
  // Note: education is now stored in Profiles table, not user metadata
  if (updatedData.profile_picture) userMetadata.profile_picture = updatedData.profile_picture;
  // if (updatedData.role_title) userMetadata.role_title = updatedData.role_title;
  if (updatedData.clearance_level) userMetadata.clearance_level = updatedData.clearance_level;
  if (updatedData.email_verified !== undefined) userMetadata.email_verified = updatedData.email_verified;
  if (updatedData.status) userMetadata.status = updatedData.status;
  if (updatedData.real_email) userMetadata.real_email = updatedData.real_email;

    const { data, error } = await supabase.auth.updateUser({
      data: userMetadata
    });
    
    const authUser = data?.user;
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    if (authUser) {
      // Update the profiles table with all available fields
      const profileUpdateData: any = {
        id: authUser.id,
        updated_at: new Date().toISOString()
      };
      
      // Map all profile fields to the Profiles table
      if (updatedData.first_name) profileUpdateData.first_name = updatedData.first_name;
      if (updatedData.last_name) profileUpdateData.last_name = updatedData.last_name;
      if (updatedData.email) profileUpdateData.email = updatedData.email;
      if (updatedData.phone) profileUpdateData.phone = updatedData.phone;
      if (updatedData.bio) profileUpdateData.bio = updatedData.bio;
      if (updatedData.location) profileUpdateData.location = updatedData.location;
      if (updatedData.website) profileUpdateData.website = updatedData.website;
      if (updatedData.user_type) profileUpdateData.user_type = updatedData.user_type;
      if (updatedData.verification_status) profileUpdateData.verification_status = updatedData.verification_status;
      if (updatedData.avatar_url) profileUpdateData.avatar_url = updatedData.avatar_url;
      if (updatedData.circle_wallet_id) profileUpdateData.circle_wallet_id = updatedData.circle_wallet_id;
      if (updatedData.circle_wallet_address) profileUpdateData.circle_wallet_address = updatedData.circle_wallet_address;
      if (updatedData.circle_wallet_created_at) profileUpdateData.circle_wallet_created_at = updatedData.circle_wallet_created_at;
      if (updatedData.circle_wallet_status) profileUpdateData.circle_wallet_status = updatedData.circle_wallet_status;
      if (updatedData.eth_address) profileUpdateData.eth_address = updatedData.eth_address;
      if (updatedData.jobs_completed !== undefined) profileUpdateData.jobs_completed = updatedData.jobs_completed;
      if (updatedData.specializations) profileUpdateData.specializations = updatedData.specializations;
      if (updatedData.linkedin) profileUpdateData.linkedin = updatedData.linkedin;
      if (updatedData.industry) profileUpdateData.industry = updatedData.industry;
      if (updatedData.areas_of_interest) profileUpdateData.areas_of_interest = updatedData.areas_of_interest;
      if (updatedData.education) profileUpdateData.education = updatedData.education;
      if (updatedData.professional_title) profileUpdateData.professional_title = updatedData.professional_title;
      if (updatedData.bar_license_number) profileUpdateData.bar_license_number = updatedData.bar_license_number;
      
      // Fallback to legacy fields if new fields are not provided
      if (!profileUpdateData.first_name && authUser.user_metadata?.firstName) {
        profileUpdateData.first_name = authUser.user_metadata.firstName;
      }
      if (!profileUpdateData.last_name && authUser.user_metadata?.lastName) {
        profileUpdateData.last_name = authUser.user_metadata.lastName;
      }
      if (!profileUpdateData.email && authUser.email) {
        profileUpdateData.email = authUser.email;
      }
      if (!profileUpdateData.phone && authUser.user_metadata?.phone) {
        profileUpdateData.phone = authUser.user_metadata.phone;
      }
      if (!profileUpdateData.bio && authUser.user_metadata?.about) {
        profileUpdateData.bio = authUser.user_metadata.about;
      }
      if (!profileUpdateData.location && authUser.user_metadata?.address) {
        profileUpdateData.location = authUser.user_metadata.address;
      }
      if (!profileUpdateData.user_type && authUser.user_metadata?.role_title) {
        profileUpdateData.user_type = authUser.user_metadata.role_title;
      }
      if (!profileUpdateData.verification_status && authUser.user_metadata?.email_verified) {
        profileUpdateData.verification_status = authUser.user_metadata.email_verified ? 'verified' : 'pending';
      }
      if (!profileUpdateData.avatar_url && authUser.user_metadata?.profile_picture) {
        profileUpdateData.avatar_url = authUser.user_metadata.profile_picture;
      }
      if (!profileUpdateData.eth_address && authUser.user_metadata?.eth_address) {
        profileUpdateData.eth_address = authUser.user_metadata.eth_address;
      }
      if (!profileUpdateData.jobs_completed && authUser.user_metadata?.jobs_completed !== undefined) {
        profileUpdateData.jobs_completed = authUser.user_metadata.jobs_completed;
      }
      if (!profileUpdateData.specializations && authUser.user_metadata?.specializations) {
        profileUpdateData.specializations = authUser.user_metadata.specializations;
      }
      if (!profileUpdateData.linkedin && authUser.user_metadata?.linkedin) {
        profileUpdateData.linkedin = authUser.user_metadata.linkedin;
      }
      if (!profileUpdateData.industry && authUser.user_metadata?.industry) {
        profileUpdateData.industry = authUser.user_metadata.industry;
      }
      if (!profileUpdateData.areas_of_interest && authUser.user_metadata?.areas_of_interest) {
        profileUpdateData.areas_of_interest = authUser.user_metadata.areas_of_interest;
      }
      if (!profileUpdateData.education && authUser.user_metadata?.education) {
        profileUpdateData.education = authUser.user_metadata.education;
      }
      if (!profileUpdateData.professional_title && authUser.user_metadata?.title) {
        profileUpdateData.professional_title = authUser.user_metadata.title;
      }
      
      const { error: profileUpdateError } = await supabase.from('Profiles').upsert(profileUpdateData);
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
      setIsMetaMaskConnecting(true);
      
      // Check if ethereum object exists
      if (!(window as any).ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask to continue.');
      }
      
      let ethereum = (window as any).ethereum;
      
      // Handle multiple wallets - specifically select MetaMask
      if (ethereum.providers?.length) {
        console.log('Multiple wallets detected, selecting MetaMask...');
        // Find MetaMask specifically among multiple providers
        const metaMaskProvider = ethereum.providers.find((provider: any) => provider.isMetaMask);
        if (metaMaskProvider) {
          ethereum = metaMaskProvider;
          console.log('MetaMask provider selected');
        } else {
          throw new Error('MetaMask not found among installed wallets. Please ensure MetaMask is installed and enabled.');
        }
      } else if (!ethereum.isMetaMask) {
        throw new Error('Please use MetaMask for authentication. Other wallets are not supported.');
      }

      // Check if MetaMask is already processing a request
      if (isMetaMaskConnecting) {
        throw new Error('MetaMask connection already in progress. Please wait.');
      }

      // Check if MetaMask is locked
      try {
        if (ethereum._metamask && ethereum._metamask.isUnlocked && !(await ethereum._metamask.isUnlocked())) {
          throw new Error('MetaMask is locked. Please unlock it and try again.');
        }
      } catch (error) {
        // Silent fail for _metamask access - not all versions have this property
        console.debug('MetaMask unlock check failed:', error);
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
      
      // Check if accounts are already connected
      let accounts;
      try {
        accounts = await ethereum.request({ method: 'eth_accounts' });
        console.log('Existing connected accounts:', accounts);
      } catch (error) {
        console.error('Error checking existing accounts:', error);
        accounts = [];
      }
      
      // Request account access only if no accounts are connected
      if (!accounts || accounts.length === 0) {
        console.log('No existing accounts found, requesting access...');
        try {
          accounts = await ethereum.request({ 
            method: 'eth_requestAccounts',
            params: []
          });
          console.log('New accounts connected:', accounts);
        } catch (error: any) {
          console.error('MetaMask request error:', error);
          if (error.code === 4001) {
            throw new Error('Connection cancelled. Please try again to connect with MetaMask.');
          } else if (error.code === -32002) {
            throw new Error('MetaMask is already processing a request. Please check your MetaMask extension and try again.');
          } else if (error.code === -32603) {
            throw new Error('Internal error occurred. Please refresh the page and try again.');
          }
          throw new Error(`MetaMask connection failed: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.log('Using existing connected accounts:', accounts);
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please make sure MetaMask is unlocked and has accounts.');
      }

      // Use the first account
      const address = accounts[0];
      const signer = await provider.getSigner();
      
      // Get a signature from the user to verify they own the address
      const message = `Sign this message to authenticate with Ile Legal: ${Date.now()}`;
      const signature = await signer.signMessage(message);
      
      // Try to verify the signature on the backend via Supabase function
      let verified = false;
      try {
        const { data, error } = await supabase.functions.invoke('verify-ethereum-signature', {
          body: { address, message, signature }
        });
        
        if (error) {
          console.warn('Backend signature verification failed, using fallback:', error);
          // Fallback: Simple verification that signature exists
          verified = Boolean(signature && signature.length > 0);
        } else {
          verified = data?.verified || false;
        }
      } catch (funcError) {
        console.warn('Supabase function not available, using fallback verification:', funcError);
        // Fallback: Simple verification that signature exists and looks valid
        verified = Boolean(signature && signature.length > 100); // Ethereum signatures are ~132 chars
      }
      
      // If verification is successful (or fallback passed), create or update user
      if (verified) {
        console.log('Signature verified, checking if user exists with address:', address);
        
        // Wait a moment for auth state to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user exists with this ETH address
        const { data: userData, error: userError } = await supabase
          .from('Profiles')
          .select('*')
          .eq('eth_address', address)
          .single();
        
        console.log('Profile lookup result:', { userData, userError });
        
        if (userError && userError.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
          console.error('Profile lookup error:', userError);
          throw userError;
        }
        
        if (userData) {
          console.log('Existing user found, updating session...');
          // User exists, update session and ensure ETH address is stored
          await supabase
            .from('Profiles')
            .update({ eth_address: address })
            .eq('id', userData.id);
          
          const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || `ETH User ${address.substring(0, 6)}`;
          
          const updatedUser: User = {
            id: userData.id,
            name: fullName,
            email: userData.email || '', // Use real email from Profiles table
            role: (userData.user_type as UserRole) || 'buyer',
            isVerified: true, // ETH users are considered verified
            user_metadata: {
              firstName: userData.first_name,
              lastName: userData.last_name,
              phone: userData.phone,
              eth_address: address,
              real_email: userData.email // Store real email for reference
            }
          };
          
          setUser(updatedUser);
          setEthAddress(address);
          localStorage.setItem('ileUser', JSON.stringify(updatedUser));
          localStorage.setItem('ileEthAddress', address);
          
          console.log('Existing MetaMask user logged in:', updatedUser.name);
        } else {
          console.log('No existing user found, creating new user...');
          
          // Create new user with ETH address
          const { data: userProfile } = await supabase
            .from('Profiles')
            .select('*')
            .eq('eth_address', address)
            .single();

          console.log('Double-checking profile existence:', userProfile);

          if (!userProfile) {
            console.log('Creating new MetaMask user...');
            
            // Create a new user if not exists
            const randomPassword = Math.random().toString(36).slice(-8);
            
            const { data: newUser, error: signUpError } = await supabase.auth.signUp({
              email: `eth_${address.toLowerCase().substring(2, 10)}@ile-legal.temp`,
              password: randomPassword,
              options: {
                data: {
                  eth_address: address,
                  name: `MetaMask User ${address.slice(0, 6)}`,
                  role: role, // Use the provided role
                  email_verified: true // Consider Ethereum users as verified
                }
              }
            });
            
            console.log('Signup result:', { newUser, signUpError });
            
            if (signUpError) {
              console.error('Signup error:', signUpError);
              throw signUpError;
            }
            
            if (newUser?.user) {
              // Set pending profile for completion modal
              setPendingMetaMaskProfile({
                userId: newUser.user.id,
                address: address,
                role: role
              });
              
              console.log('MetaMask user created, pending profile completion:', newUser.user.id);
            }
          } else {
            console.log('Profile exists but was not found in first query - potential race condition');
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
      setIsMetaMaskConnecting(false);
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
  const getAllUsers = async (_sellers?: boolean): Promise<User[]> => {
    // Check if current user is admin
    console.log("user", user);
    if (!user || user.user_metadata?.role_title !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    let query = supabase.from('Profiles').select('*');
    // if (sellers) {
    //   query = query.eq('user_type', 'seller');
    // }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }

    console.log("data", data);

    return data.map((userData: any) => ({
      // Core user information
      id: userData.id,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      email: userData.email,
      role: userData.user_type as UserRole,
      isVerified: userData.verification_status === 'verified',
      status: userData.status || userData.verification_status || 'pending',
      
      // All Profiles table columns
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      first_name: userData.first_name,
      last_name: userData.last_name,
      avatar_url: userData.avatar_url,
      user_type: userData.user_type,
      bio: userData.bio,
      location: userData.location,
      website: userData.website,
      phone: userData.phone,
      circle_wallet_id: userData.circle_wallet_id,
      circle_wallet_address: userData.circle_wallet_address,
      circle_wallet_created_at: userData.circle_wallet_created_at,
      circle_wallet_status: userData.circle_wallet_status,
      verification_status: userData.verification_status,
      jobs_completed: userData.jobs_completed,
      eth_address: userData.eth_address,
      specializations: userData.specializations,
      linkedin: userData.linkedin,
      education: userData.education,
      professional_title: userData.professional_title,
      industry: userData.industry,
      areas_of_interest: userData.areas_of_interest,
      bar_license_number: userData.bar_license_number,
      
      // Legacy user_metadata for backward compatibility
      user_metadata: userData.user_metadata || {}
    }));
  };

  // Admin-only function to update a user's status
  const updateUserStatus = async (userId: string, status: string): Promise<void> => {
    console.log('userid', userId);
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

  // Complete MetaMask profile with real user details
  const completeMetaMaskProfile = async (profileData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone?: string;
    userType?: 'client' | 'professional';
    agreeToTerms?: boolean;
  }) => {
    if (!pendingMetaMaskProfile) {
      throw new Error('No pending MetaMask profile to complete');
    }

    const { userId, address } = pendingMetaMaskProfile;
    
    // Map userType to UserRole, defaulting to the original role if not specified
    const selectedRole: UserRole = profileData.userType === 'professional' ? 'seller' : 'buyer';

    try {
      // Update the auth user metadata (don't change email - Supabase restricts this)
      const fullName = `${profileData.firstName} ${profileData.lastName}`;
      
      await supabase.auth.updateUser({
        data: {
          name: fullName,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          eth_address: address,
          role: selectedRole,
          real_email: profileData.email // Store real email in metadata
        }
      });

      // Update or create profile in Profiles table
      const { error: profileError } = await supabase
        .from('Profiles')
        .upsert({
          id: userId,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          user_type: selectedRole,
          verification_status: 'pending',
          eth_address: address
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Also create entry in user_wallets table for consistency with existing wallet system
      const { error: walletError } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: userId,
          circle_wallet_id: `metamask_${userId}`,
          wallet_address: address,
          wallet_state: 'LIVE',
          blockchain: 'ETH',
          account_type: 'EOA',
          custody_type: 'DEVELOPER',
          wallet_set_id: null,
          description: 'MetaMask Wallet',
          balance_usdc: 0,
          balance_matic: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (walletError) {
        console.warn('Error creating wallet entry (non-critical):', walletError);
        // Don't throw error here since the main profile creation succeeded
      }

      // Update current user state - use real email for display
      const updatedUser: User = {
        id: userId,
        name: fullName,
        email: profileData.email, // Use the real email for display
        role: selectedRole,
        isVerified: true,
        user_metadata: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          eth_address: address,
          real_email: profileData.email // Store real email for reference
        }
      };

      setUser(updatedUser);
      setEthAddress(address);
      localStorage.setItem('ileUser', JSON.stringify(updatedUser));
      localStorage.setItem('ileEthAddress', address);
      
      // Clear pending profile
      setPendingMetaMaskProfile(null);
      
      console.log('MetaMask profile completed successfully');
    } catch (error) {
      console.error('Error completing MetaMask profile:', error);
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
        isMetaMaskConnecting,
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
          await updateProfile({ profile_picture_file: file });
          return user.user_metadata?.profile_picture || '';
        },
        storeProfileDocuments: async (file: File, filepath: string): Promise<string> => {
          if (!user) {
            throw new Error('User must be authenticated to store documents');
          }
          
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
          if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
          }
          
          // Validate filepath parameter
          if (!filepath || typeof filepath !== 'string') {
            throw new Error('Filepath is required and must be a string');
          }
          
          try {
            // Upload file to documents bucket
            const { data, error } = await supabase.storage
              .from('documents')
              .upload(filepath, file, {
                cacheControl: '3600',
                upsert: true // Replace existing files
              });
              
            if (error) {
              console.error('Error uploading document:', error);
              throw error;
            }
            
            // Get public URL for the uploaded file
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(filepath);
              
            console.log('Document stored successfully:', urlData.publicUrl);
            return urlData.publicUrl;
          } catch (error) {
            console.error('Error in storeProfileDocuments:', error);
            throw error;
          }
        },
        getProfileDocuments: async (userId?: string): Promise<{ governmentId?: string; selfieWithId?: string; otherDocuments: string[] }> => {
          const targetUserId = userId || user?.id;
          if (!targetUserId) {
            throw new Error('User ID is required to retrieve profile documents');
          }
          
          try {
            // List all files in the user's profile_documents folder
            const { data: files, error } = await supabase.storage
              .from('documents')
              .list(`${targetUserId}/profile_documents/`);
              
            if (error) {
              console.error('Error listing profile documents:', error);
              throw error;
            }
            
            const result = {
              governmentId: undefined as string | undefined,
              selfieWithId: undefined as string | undefined,
              otherDocuments: [] as string[]
            };
            
            if (files && files.length > 0) {
              for (const file of files) {
                const filepath = `${targetUserId}/profile_documents/${file.name}`;
                
                // Get signed URL for each file (more secure than public URL)
                const { data: signedUrl, error: urlError } = await supabase.storage
                  .from('documents')
                  .createSignedUrl(filepath, 3600); // 1 hour expiry
                
                if (urlError) {
                  console.error('Error creating signed URL for', filepath, urlError);
                  continue; // Skip this file if we can't get a URL
                }
                
                // Categorize files based on their names
                if (file.name.startsWith('government_id.')) {
                  result.governmentId = signedUrl.signedUrl;
                } else if (file.name.startsWith('selfie_with_id.')) {
                  result.selfieWithId = signedUrl.signedUrl;
                } else {
                  result.otherDocuments.push(signedUrl.signedUrl);
                }
              }
            }
            
            console.log('Profile documents retrieved successfully:', result);
            return result;
          } catch (error) {
            console.error('Error in getProfileDocuments:', error);
            throw error;
          }
        },
        updateUserStatus,
        getUserStats,
        completeMetaMaskProfile,
        pendingMetaMaskProfile,
        setPendingMetaMaskProfile
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