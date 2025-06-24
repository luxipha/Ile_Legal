import { createClient } from '@supabase/supabase-js';

// Local Supabase connection details
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client with the same options as your production client
export const supabaseLocal = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'ile-legal-auth', // Use same storage key as production
    flowType: 'implicit'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'ile-legal-app-local',
      // Remove Content-Type to match production client
    },
  },
});

// Create a service role client for admin operations
export const supabaseLocalAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to determine if we're using local Supabase
export const isUsingLocalSupabase = () => {
  return import.meta.env?.VITE_USE_LOCAL_SUPABASE === 'true';
};

// Export a function to get the appropriate client
export const getSupabaseClient = async (useAdmin = false) => {
  if (isUsingLocalSupabase()) {
    return useAdmin ? supabaseLocalAdmin : supabaseLocal;
  }
  
  // Import the production client dynamically to avoid circular dependencies
  // Using dynamic import instead of require for ES modules compatibility
  const supabaseModule = await import('./supabase');
  return supabaseModule.supabase;
};

// Test direct auth functions
export const testDirectLogin = async (email: string, password: string) => {
  try {
    console.log('Attempting direct login with:', { email })
    const response = await supabaseLocal.auth.signInWithPassword({
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

export default supabaseLocal;
