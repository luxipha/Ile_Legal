import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User> & { profile_picture?: File }) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  getUser: () => Promise<User | null>;
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

const supabase = createClient('https://govkkihikacnnyqzhtxv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvdmtraWhpa2Fjbm55cXpodHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTgyMjQsImV4cCI6MjA2NDgzNDIyNH0.0WuGDlY-twGxtmHU5XzfMvDQse_G3CuFVxLyCgZlxIQ');


// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ileUser');
    const storedToken = localStorage.getItem('ileToken');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('ileUser');
        localStorage.removeItem('ileToken');
      }
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
        const { data, error } = await supabase
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
      const user = {
        id: data.user?.id,
        name: data.user?.user_metadata.name,
        email: data.user?.email,
        password: '',
        role: data.user?.user_metadata.role,
        isVerified: data.user?.user_metadata.email_verified,
        user_metadata: data.user?.user_metadata
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
        emailRedirectTo: 'https://example.com/welcome',
        data: {
          name: name,
          role: role
        }
      },
    })


  }

  // Mock register function
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

  async function signOut() {
    const { error } = await supabase.auth.signOut({scope: 'local'});
  }

  // Updated updateProfile function
  async function updateProfile(profileData: Partial<User> & { profile_picture?: File }) {
    const userData = await getUser();
    // Handle profile picture upload if provided
    if (profileData.profile_picture) {
      const file = profileData.profile_picture;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData?.id}.${fileExt}`;
      const filePath = `profile_pictures/${fileName}`;

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .update(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Add the profile picture URL to the user metadata
      profileData.user_metadata = {
        ...profileData,
        profile_picture: publicUrl
      };

      // Remove the File object from profileData as it can't be stored in user metadata
      delete profileData.profile_picture;
    }

    const { data: { user }, error } = await supabase.auth.updateUser({
      data: profileData
    });
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    if (user) {
      const updatedUser = {
        id: user.id,
        name: user.user_metadata.name,
        email: user.email || '',
        role: user.user_metadata.role,
        isVerified: user.user_metadata.email_verified,
        user_metadata: user.user_metadata
      };
      setUser(updatedUser);
      localStorage.setItem('ileUser', JSON.stringify(updatedUser));
    }
  }

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ileUser');
    localStorage.removeItem('ileToken');
    signOut();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateProfile, setUser, getUser }}>
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