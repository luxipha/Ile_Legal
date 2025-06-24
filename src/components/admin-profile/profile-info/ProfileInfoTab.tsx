import { useState, useEffect } from "react";
import { PhoneIcon, MapPinIcon, MailIcon, ShieldIcon, KeyIcon, ClockIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { useAuth } from "../../../contexts/AuthContext";
import { usePermissions } from "../../../hooks/usePermissions";
import { supabaseLocal as supabase } from "../../../lib/supabaseLocal";

interface AdminProfile {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  created_at: string;
}

export const ProfileInfoTab = () => {
  const { user } = useAuth();
  const { userRole, permissions } = usePermissions();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAdminProfile();
    }
  }, [user?.id]);

  const loadAdminProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Profiles')
        .select('email, first_name, last_name, phone, location, created_at')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading admin profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Contact Information */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <span className="text-gray-700">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'No name provided'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MailIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{profile?.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{profile?.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{profile?.location || 'No location provided'}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{userRole?.display_name || 'Admin User'}</span>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">
                  Active since {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Admin Access Details */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Access Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Permissions</p>
                <p className="text-gray-900 flex items-center gap-1">
                  <KeyIcon className="w-4 h-4 text-blue-600" />
                  {permissions.length} Active Permissions
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-900">{userRole?.display_name || 'Admin User'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Access Scope</p>
                <p className="text-gray-900">
                  {permissions.length > 0 ? 'Permission-Based Access' : 'Basic Admin Access'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">System Role</p>
                <p className="text-gray-900 flex items-center">
                  <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                    userRole?.is_system_role ? 'bg-blue-500' : 'bg-green-500'
                  }`}></span>
                  {userRole?.is_system_role ? 'System Role' : 'Custom Role'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Admin Permissions */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Current Permissions ({permissions.length})
          </h3>
          
          {permissions.length > 0 ? (
            <div className="space-y-3">
              {permissions.map((permission, index) => (
                <div key={`permission-${index}`} className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-gray-700 font-medium">{permission}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShieldIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No specific permissions assigned</p>
              <p className="text-sm mt-1">
                This role uses simplified access control through the authentication system.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
