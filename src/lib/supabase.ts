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
export const mockStorage = {
  upload: async (file: File) => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      path: URL.createObjectURL(file),
    };
  },
};