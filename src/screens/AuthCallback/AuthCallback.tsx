import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
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
            // Extract role from user metadata
            const role = userData.user.user_metadata?.role || 'buyer';
            
            // Create a user object that matches our app's User interface
            const appUser = {
              id: userData.user.id,
              name: userData.user.user_metadata?.name || 'User',
              email: userData.user.email || '',
              role: role,
              isVerified: !!userData.user.email_confirmed_at,
              user_metadata: userData.user.user_metadata || {}
            };
            
            // Update auth context
            setUser(appUser);
            localStorage.setItem('ileUser', JSON.stringify(appUser));
            
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
      }
    };

    handleAuthCallback();
  }, [navigate, setUser]);

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
