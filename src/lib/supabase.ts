import { createClient } from '@supabase/supabase-js';

// TODO: Move these to environment variables
const supabaseUrl = 'https://pleuwhgjpjnkqvbemmhl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXV3aGdqcGpua3F2YmVtbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzQ0NzMsImV4cCI6MjA2NTQxMDQ3M30.lAGzWtcKYtREgCHEU4n15gtPclQrNoBv6tXk836XkeE';

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
});

// Debug Supabase connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event);
  console.log('Session:', session);
});

// Test direct auth functions
export const testDirectLogin = async (email: string, password: string) => {
  try {
    console.log('Attempting direct login with:', { email });
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Direct login response:', response);
    return response;
  } catch (error: any) {
    console.error('Unexpected error in direct login:', error);
    return { data: null, error };
  }
};

// Keep the mock storage for backward compatibility until fully migrated
export const mockStorage = {
  upload: async (file: File) => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      path: URL.createObjectURL(file),
    };
  },
};

// Supabase storage functions
export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
  
  remove: async (bucket: string, paths: string[]) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error removing files:', error);
      throw error;
    }
  }
};