import React, { createContext, useContext, useState, useEffect } from 'react';

// User types
type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
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

  // Mock login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
      
      if (!demoUser) {
        throw new Error('Invalid credentials');
      }

      const { password: _, ...userWithoutPassword } = demoUser;
      const mockToken = `mock-token-${Date.now()}`;

      setUser(userWithoutPassword);
      setToken(mockToken);
      localStorage.setItem('ileUser', JSON.stringify(userWithoutPassword));
      localStorage.setItem('ileToken', mockToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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
        isVerified: false
      };

      const mockToken = `mock-token-${Date.now()}`;

      setUser(newUser);
      setToken(mockToken);
      localStorage.setItem('ileUser', JSON.stringify(newUser));
      localStorage.setItem('ileToken', mockToken);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ileUser');
    localStorage.removeItem('ileToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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