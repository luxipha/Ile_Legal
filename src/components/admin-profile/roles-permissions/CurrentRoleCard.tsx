import { useState, useEffect } from "react";
import { ShieldIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { useAuth } from "../../../contexts/AuthContext";
import { RoleService, UserType, SimpleRole } from "../../../services/roleService";

export const CurrentRoleCard = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<SimpleRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserRole();
  }, [user?.id]);

  const loadUserRole = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user role and permissions from simplified service
      const role = await RoleService.getUserRole(user.id);
      const userPermissions = await RoleService.getUserPermissions(user.id);

      setUserRole(role);
      setPermissions(userPermissions);
    } catch (err) {
      console.error('Error loading role:', err);
      setError('Failed to load role information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="text-red-600">
            <p>Error loading role information: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userRole) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="text-gray-600">
            <p>No role information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ShieldIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Current Role</h3>
            <p className="text-gray-600">Your current role and permissions</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: userRole.color }}
            >
              {userRole.display_name}
            </span>
            <span className="text-sm text-gray-600">System Role</span>
          </div>
          <p className="text-sm text-gray-700">
            {userRole.description || 'No description available'}
          </p>
        </div>
        
        {permissions.length > 0 ? (
          <>
            <h4 className="font-medium text-gray-900 mb-4">
              Permission Details ({permissions.length} permissions)
            </h4>
            
            <div className="space-y-2">
              {permissions.map((permission, index) => (
                <div key={`permission-${index}`} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 text-sm capitalize">
                    {permission.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Simple Role Access</h4>
            <p className="text-sm text-gray-700">
              This role uses simplified access control through the authentication system. 
              No granular permissions are configured for this role type.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
