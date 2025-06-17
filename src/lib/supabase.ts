import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Bid = {
  id: string;
  gig_id: string;
  seller_id: string;
  amount: number;
  description: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
};

export type Gig = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: 'active' | 'assigned' | 'completed' | 'cancelled';
  client_id: string;
  created_at: string;
  completed_date?: string;
};

export type Database = {
  public: {
    Tables: {
      Bids: {
        Row: Bid;
        Insert: Omit<Bid, 'id' | 'created_at'>;
        Update: Partial<Omit<Bid, 'id' | 'created_at'>>;
      };
      Gigs: {
        Row: Gig;
        Insert: Omit<Gig, 'id' | 'created_at'>;
        Update: Partial<Omit<Gig, 'id' | 'created_at'>>;
      };
    };
  };
};

// This file is kept as a placeholder for future backend integration
// Currently using mock data for frontend-only development
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client with additional options to handle CORS
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'ile-legal-auth',
    flowType: 'implicit'
  },
  global: {
    headers: {
      'X-Client-Info': 'ile-legal-app',
      'Content-Type': 'application/json',
    },
  },
})

// Debug Supabase connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event)
  console.log('Session:', session)
})

// Test direct auth functions
export const testDirectLogin = async (email: string, password: string) => {
  try {
    console.log('Attempting direct login with:', { email })
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('Direct login response:', response)
    return response
  } catch (error: any) {
    console.error('Unexpected error in direct login:', error)
    return { data: null, error }
  }
}

// Keep the mock storage for backward compatibility until fully migrated
export const mockStorage = {
  upload: async (file: File) => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      path: URL.createObjectURL(file),
    }
  },
}

// Supabase storage functions
export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file)
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  },
  
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },
  
  remove: async (bucket: string, paths: string[]) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths)
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error removing files:', error)
      throw error
    }
  }
}