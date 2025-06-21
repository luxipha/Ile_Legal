import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { UserIcon, ShieldCheckIcon } from 'lucide-react';
import { RoleService, TeamMember, SimpleRole, UserType } from '../../../services/roleService';

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleChanged: () => void;
  member: TeamMember | null;
}

export const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  isOpen,
  onClose,
  onRoleChanged,
  member
}) => {
  const [availableRoles, setAvailableRoles] = useState<SimpleRole[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('admin');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available roles when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableRoles();
      setSelectedUserType(member?.user_type || 'admin');
      setReason('');
      setError(null);
    }
  }, [isOpen, member]);

  const loadAvailableRoles = async () => {
    try {
      setIsLoading(true);
      const roles = await RoleService.getAdminRoles();
      setAvailableRoles(roles);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Failed to load available roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!member || !selectedUserType) return;

    try {
      setIsChanging(true);
      setError(null);

      await RoleService.changeUserRole(member.id, selectedUserType);

      onRoleChanged();
      onClose();
    } catch (err) {
      console.error('Error changing role:', err);
      setError('Failed to change user role. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const selectedRole = availableRoles.find(role => role.name === selectedUserType);
  const isRoleChanged = selectedUserType !== member?.user_type;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Change User Role" 
      size="md"
    >
      <div className="space-y-6">
        {member && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">User Information</span>
            </div>
            <p className="text-sm text-blue-700">
              Changing role for: <strong>{member.name}</strong> ({member.email})
            </p>
            <p className="text-sm text-blue-600">
              Current role: <strong>{RoleService.getRoleByType(member.user_type).display_name}</strong>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading available roles...</div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-select">New Role *</Label>
                <select
                  id="role-select"
                  value={selectedUserType}
                  onChange={(e) => setSelectedUserType(e.target.value as UserType)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableRoles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Change (Optional)</Label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why this role change is being made..."
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {selectedRole && isRoleChanged && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheckIcon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">New Role Preview</span>
                </div>
                <h4 className="font-medium text-gray-900">{selectedRole.display_name}</h4>
                <p className="text-sm text-gray-700 mb-2">
                  {selectedRole.description}
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Permissions:</strong> {selectedRole.permissions.length} permission{selectedRole.permissions.length !== 1 ? 's' : ''}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedRole.permissions.slice(0, 3).map((permission, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                      >
                        {permission.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {selectedRole.permissions.length > 3 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                        +{selectedRole.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={isChanging}>
            Cancel
          </Button>
          <Button 
            onClick={handleRoleChange}
            disabled={isChanging || isLoading || !isRoleChanged}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isChanging ? 'Changing Role...' : 'Change Role'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};