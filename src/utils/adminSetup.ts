import { supabaseLocal as supabase } from '../lib/supabaseLocal';

/**
 * Admin setup utility for development
 * This helps set up the admin user properly in Supabase
 */

export const checkAdminUser = async () => {
  try {
    // Try to sign in with admin credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin.test@ile-legal.com',
      password: 'password123'
    });

    if (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message };
    }

    if (data?.user) {
      console.log('Admin user found:', {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
        role_detected: data.user.user_metadata?.role || data.user.user_metadata?.role_title || 'none'
      });
      
      return { 
        success: true, 
        user: data.user,
        needsRoleUpdate: !data.user.user_metadata?.role && !data.user.user_metadata?.role_title
      };
    }

    return { success: false, error: 'No user data returned' };
  } catch (error) {
    console.error('Admin check failed:', error);
    return { success: false, error: 'Check failed' };
  }
};

export const updateAdminRole = async () => {
  try {
    // First, check current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    // Update user metadata to include admin role
    const { data, error } = await supabase.auth.updateUser({
      data: {
        role: 'admin',
        role_title: 'admin',
        name: 'Demo Admin',
        email_verified: true
      }
    });

    if (error) {
      console.error('Error updating admin role:', error);
      return { success: false, error: error.message };
    }

    console.log('Admin role updated successfully:', data);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Update admin role failed:', error);
    return { success: false, error: 'Update failed' };
  }
};

export const createAdminUser = async () => {
  try {
    // Create admin user if doesn't exist
    const { data, error } = await supabase.auth.signUp({
      email: 'admin.test@ile-legal.com',
      password: 'password123',
      options: {
        data: {
          name: 'Demo Admin',
          role: 'admin',
          role_title: 'admin',
          email_verified: true
        }
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return { success: false, error: error.message };
    }

    console.log('Admin user created successfully:', data);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Create admin user failed:', error);
    return { success: false, error: 'Creation failed' };
  }
};

// Debug function to run in browser console
export const debugAdminLogin = async () => {
  console.log('🔍 Checking admin user setup...');
  
  // Step 1: Check if admin user exists and can login
  const checkResult = await checkAdminUser();
  console.log('✅ Admin check result:', checkResult);
  
  if (!checkResult.success) {
    console.log('❌ Admin user doesn\'t exist, creating...');
    const createResult = await createAdminUser();
    console.log('📝 Admin creation result:', createResult);
    return createResult;
  }
  
  if (checkResult.needsRoleUpdate) {
    console.log('🔧 Admin needs role update...');
    const updateResult = await updateAdminRole();
    console.log('📝 Admin update result:', updateResult);
    return updateResult;
  }
  
  console.log('✅ Admin user is properly configured!');
  return checkResult;
};