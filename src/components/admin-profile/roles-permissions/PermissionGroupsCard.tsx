import React, { useState, useEffect } from "react";
import { LockIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { RoleService, SimpleRole } from "../../../services/roleService";

export const PermissionGroupsCard = () => {
  const [roles, setRoles] = useState<SimpleRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allRoles = await RoleService.getAllRoles();
      // Filter to only show manageable roles (excluding buyer/seller)
      const manageableRoles = allRoles.filter(role => !['buyer', 'seller'].includes(role.name));
      setRoles(manageableRoles);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRoles();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Available Roles</h3>
              <p className="text-gray-600">Loading available roles...</p>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Available Roles</h3>
              <p className="text-gray-600">System roles and permissions</p>
            </div>
          </div>
          <div className="text-red-600 text-center py-4">
            <p>{error}</p>
            <Button onClick={loadRoles} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Available Roles</h3>
              <p className="text-gray-600">System roles and their permissions (Read-only)</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <LockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No roles found</p>
            <p className="text-sm mt-1">System roles will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{role.display_name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          System Role
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {role.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {role.permissions.length} permissions
                      </p>
                    </div>
                  </div>
                </div>
                
                {role.permissions.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h5>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission, index) => (
                        <span 
                          key={`${role.id}-permission-${index}`}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};