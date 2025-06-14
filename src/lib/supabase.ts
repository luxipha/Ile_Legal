// This file is kept as a placeholder for future backend integration
// Currently using mock data for frontend-only development
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const testDirectLogin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const mockStorage = {
  upload: async (file: File) => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      path: URL.createObjectURL(file),
    };
  },
};