import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

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
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  isLoading: boolean;
  createTestUser: () => Promise<{ success: boolean; message: string }>;
  uploadProfilePicture: (file: File) => Promise<string>;
  signInWithGoogle: () => Promise<void>;
  signInWithMetaMask: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  getUser: () => Promise<User | null>;
  token: string | null;
  ethAddress: string | null;
}

// Mock users for demo
const DEMO_USERS = [
  {
    id: '1',
    name: 'Demo Buyer',
    email: 'buyer@example.com',
    password: 'password123',
    role: 'buyer' as UserRole,
    isVerified: true
  },
  {
    id: '2',
    name: 'Demo Seller',
    email: 'seller@example.com',
    password: 'password123',
    role: 'seller' as UserRole,
    isVerified: true
  },
  {
    id: '3',
    name: 'Demo Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin' as UserRole,
    isVerified: true
  }
];

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Import the Supabase client from our lib/supabase.ts file
import { supabase } from '../lib/supabase';

// Function to create a test user for development purposes
async function createTestUser(): Promise<{ success: boolean; message: string }> {
  console.log('createTestUser function called');
  
  try {
    // First try to sign in to see if user exists
    try {
      const { data } = await supabase.auth.signInWithPassword({
        email: 'admin.test@ile-legal.com',
        password: 'password123',
      });
      
      if (data && data.user) {
        console.log('Test user already exists, user:', data.user);
        return { success: true, message: 'Test user already exists' };
      }
    } catch (signInError) {
      console.log('Sign in failed, user probably doesn\'t exist:', signInError);
      // Continue to create user
    }
    
    // User doesn't exist, create it
    console.log('Creating new test user...');
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: 'admin.test@ile-legal.com',
      password: 'password123',
      options: {
        data: {
          name: 'Admin User',
          role: 'admin',
          role_title: 'System Administrator',
          clearance_level: '5',
          email_verified: true
        }
      }
    });
    
    if (signUpError) {
      console.error('Error creating test user:', signUpError);
      return { success: false, message: `Error: ${signUpError.message}` };
    }
    
    console.log('Test user created successfully:', data);
    return { success: true, message: 'Test user created successfully' };
  } catch (error: any) {
    console.error('Unexpected error in createTestUser:', error);
    return { success: false, message: `Unexpected error: ${error?.message || 'Unknown'}` };
  }
}

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
      localStorage.setItem('ileUser', JSON.stringify(userData));
      localStorage.setItem('ileToken', session?.access_token || '');
    } else {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ileUser');
      localStorage.removeItem('ileToken');
    }
  }

  // Function to get user data from session
  async function getUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    if (session) {
      if (session.user.user_metadata.user_metadata) {
        const { data } = await supabase
        .storage
        .from('profile-pictures')
        .getPublicUrl(`profile_pictures/${session.user.id}.jpg`)
        return {
          id: session.user.id,
          name: session.user.user_metadata.name,
          email: session.user.email || '',
          role: session.user.user_metadata.role,
          isVerified: session.user.user_metadata.email_verified,
          user_metadata: session.user.user_metadata,
          profile_picture: data
        };
      } else {
        return {
          id: session.user.id,
          name: session.user.user_metadata.name,
          email: session.user.email || '',
          role: session.user.user_metadata.role,
          isVerified: session.user.user_metadata.email_verified,
          user_metadata: session.user.user_metadata,
          profile_picture: null
        };
      }
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

  // Mock login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await signInWithEmail(email, password)
      // Make sure we have valid data before setting the user
      if (!data.user?.id) {
        throw new Error('Invalid user data received');
      }
      
      const user: User = {
        id: data.user.id,
        name: data.user.user_metadata.name || '',
        email: data.user.email || '',
        role: data.user.user_metadata.role as UserRole,
        isVerified: !!data.user.user_metadata.email_verified,
        user_metadata: data.user.user_metadata
      }
      // Simulate API delay
      // await new Promise(resolve => setTimeout(resolve, 500));

      // const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
      
      // if (!demoUser) {
      //   throw new Error('Invalid credentials');
      // }

      // const { ...userWithoutPassword } = demoUser;
      const mockToken = `mock-token-${Date.now()}`;

      setUser(user);
      setToken(mockToken);
      localStorage.setItem('ileUser', JSON.stringify(user));
      localStorage.setItem('ileToken', mockToken);
      signInWithEmail(email, password)
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  async function signUpNewUser(email: string, name: string, password: string, role: UserRole) {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
        data: {
          name: name,
          role_title: role,
          email_verified: false
        }
      },
    });
    
    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }
    
    return data;
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
      signUpNewUser(email, name, password, role)
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // This function is now replaced by the logout function below
  // Keeping it commented for reference
  // async function signOut(): Promise<void> {
  //   await supabase.auth.signOut({scope: 'local'});
  // }

  // Updated updateProfile function
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
        role: (authUser.user_metadata?.role_title as UserRole) || 'buyer',
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

  // Sign in with MetaMask
  const signInWithMetaMask = async (): Promise<void> => {
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
      
      // Force MetaMask to be the provider even if it's not the default
      let provider;
      if (ethereum.providers) {
        // Find MetaMask in the list of providers
        const metaMaskProvider = ethereum.providers.find((p: any) => p.isMetaMask);
        if (metaMaskProvider) {
          provider = new ethers.providers.Web3Provider(metaMaskProvider);
        } else {
          throw new Error('MetaMask not found among available providers.');
        }
      } else {
        // If there's only one provider and it's MetaMask
        provider = new ethers.providers.Web3Provider(ethereum);
      }
      
      // Request account access specifically from MetaMask
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
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
            role: (userData.role_title as UserRole) || 'buyer',
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
        } else {
          // Create new user with ETH address
          const { data: newUser, error: createError } = await supabase.auth.signUp({
            email: `${address.toLowerCase()}@ethereum.ile`,
            password: ethers.utils.id(address + Date.now()), // Generate a random password
            options: {
              data: {
                name: `ETH User ${address.substring(0, 6)}`,
                role_title: 'buyer',
                eth_address: address
              }
            }
          });
          
          if (createError) {
            throw createError;
          }
          
          if (newUser?.user) {
            const createdUser: User = {
              id: newUser.user.id,
              name: `ETH User ${address.substring(0, 6)}`,
              email: newUser.user.email || '',
              role: 'buyer',
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
  
  // Sign in with Google
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
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