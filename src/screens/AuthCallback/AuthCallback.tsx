import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../types';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent multiple concurrent executions
      if (isProcessing) {
        console.log('AuthCallback already processing, skipping...');
        return;
      }
      
      setIsProcessing(true);
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data?.session) {
          
          // Get user data
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            // Try to get role from multiple sources (in order of priority):
            // 1. From localStorage (set during registration process)
            // 2. From user metadata (if already set)
            // 3. Default to 'buyer'
            let role = localStorage.getItem('pendingUserRole') || 
                       userData.user.user_metadata?.role || 
                       'buyer';
            
            console.log('Retrieved role:', role);
            
            // Clear the pending role from localStorage
            localStorage.removeItem('pendingUserRole');
            
            // Update user metadata with role if it's not already set
            if (!userData.user.user_metadata?.role) {
              await supabase.auth.updateUser({
                data: {
                  role: role
                }
              });
              console.log('Updated user metadata with role:', role);
            }
            
            // Create a user object that matches our app's User interface
            const appUser: User = {
              id: userData.user.id,
              name: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || 'User',
              email: userData.user.email || '',
              role: role as UserRole,
              isVerified: !!userData.user.email_confirmed_at,
              user_metadata: {
                phone: userData.user.user_metadata?.phone,
                address: userData.user.user_metadata?.address,
                profile_picture: userData.user.user_metadata?.profile_picture,
                role_title: userData.user.user_metadata?.role_title,
                clearance_level: userData.user.user_metadata?.clearance_level,
                email_verified: !!userData.user.email_confirmed_at,
                eth_address: userData.user.user_metadata?.eth_address,
                circle_wallet_id: userData.user.user_metadata?.circle_wallet_id,
                circle_wallet_address: userData.user.user_metadata?.circle_wallet_address,
                circle_wallet_status: userData.user.user_metadata?.circle_wallet_status
              }
            };
            
            // Update auth context
            setUser(appUser);
            localStorage.setItem('ileUser', JSON.stringify(appUser));
            
            // Check if user exists in profiles table, create if not
            try {
              const { data: existingProfile } = await supabase
                .from('Profiles')
                .select('*')
                .eq('id', userData.user.id)
                .single();
              
              if (!existingProfile) {
                console.log('Creating profile for new Google user:', userData.user.id);
                
                // Insert into profiles table with authenticated context
                const { error: profileError } = await supabase.from('Profiles').insert([
                  {
                    id: userData.user.id,
                    first_name: appUser.name.split(' ')[0] || '',
                    last_name: appUser.name.split(' ').slice(1).join(' ') || '',
                    email: userData.user.email || '',
                    user_type: role,
                    verification_status: userData.user.email_confirmed_at ? 'verified' : 'pending',
                    avatar_url: userData.user.user_metadata?.profile_picture
                  }
                ]);
                
                if (profileError) {
                  console.error('Error inserting into profiles:', profileError);
                  // Don't throw error to avoid breaking the authentication flow
                } else {
                  console.log('Profile created successfully for Google user');
                }
              } else {
                console.log('Profile already exists for user:', userData.user.id);
              }
            } catch (profileError) {
              console.error('Error checking/creating profile:', profileError);
              // Don't fail the authentication process if profile creation fails
            }
            
            // Check if user has a Circle wallet, create one if not
            try {
              const { data: profile, error: profileError } = await supabase
                .from('Profiles')
                .select('*')
                .eq('id', userData.user.id)
                .single();
              
              if (profileError && profileError.code === 'PGRST116') {
                // User doesn't exist in Profiles table, create them
                console.log('Creating profile for new Google user:', userData.user.id);
                
                const { data: newProfile, error: createError } = await supabase
                  .from('Profiles')
                  .insert({
                    id: userData.user.id,
                    first_name: userData.user.user_metadata?.name?.split(' ')[0] || 'User',
                    last_name: userData.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                    email: userData.user.email,
                    phone: userData.user.user_metadata?.phone,
                    user_type: role,
                    verification_status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select()
                  .single();
                
                if (createError) {
                  // Handle duplicate key constraint (race condition)
                  if (createError.code === '23505') {
                    console.log('Profile already exists (race condition), continuing...');
                    // Try to fetch the existing profile
                    const { data: existingProfile } = await supabase
                      .from('Profiles')
                      .select('*')
                      .eq('id', userData.user.id)
                      .single();
                    
                    if (existingProfile) {
                      console.log('Retrieved existing profile after race condition');
                    }
                  } else {
                    console.error('Error creating profile:', createError);
                    throw createError;
                  }
                }
                
                console.log('Profile created successfully:', newProfile);
                
                // Now create Circle wallet for the new user
                console.log('Creating Circle wallet for new Google user:', userData.user.id);
                const { createUserWallet } = await import('../../services/walletService');
                const walletData = await createUserWallet(appUser);
                console.log('Circle wallet created successfully:', walletData);
                
              } else if (!profileError && profile && !profile.circle_wallet_id) {
                // Profile exists but no Circle wallet, create one
                console.log('Creating Circle wallet for existing Google user:', userData.user.id);
                const { createUserWallet } = await import('../../services/walletService');
                const walletData = await createUserWallet(appUser);
                console.log('Circle wallet created successfully:', walletData);
              }
            } catch (walletError) {
              console.error('Error checking/creating profile and Circle wallet:', walletError);
              // Don't fail the authentication process if wallet creation fails
            }
            
            // Redirect based on role
            switch (role) {
              case 'admin':
                navigate('/admin-dashboard');
                break;
              case 'seller':
                navigate('/seller-dashboard');
                break;
              case 'buyer':
                navigate('/buyer-dashboard');
                break;
              default:
                navigate('/');
            }
          } else {
            throw new Error('User data not available');
          }
        } else {
          throw new Error('No session found');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        // Redirect to login after a delay
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, setUser, isProcessing]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          {error ? 'Authentication Error' : 'Completing Authentication...'}
        </h1>
        
        {error ? (
          <div className="text-center text-red-500">
            <p>{error}</p>
            <p className="mt-4 text-gray-600">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
