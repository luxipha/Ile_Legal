import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { UserPlusIcon, ShieldIcon } from 'lucide-react';
import { RoleService, UserType, SimpleRole } from '../../../services/roleService';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminCreated: () => void;
}

interface CreateAdminFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  location: string;
  password: string;
  userType: UserType;
  sendInvite: boolean;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  onAdminCreated
}) => {
  const [formData, setFormData] = useState<CreateAdminFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    location: '',
    password: '',
    userType: 'admin',
    sendInvite: true
  });
  const [availableRoles, setAvailableRoles] = useState<SimpleRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available admin roles when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableRoles();
      resetForm();
    }
  }, [isOpen]);

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

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      location: '',
      password: '',
      userType: 'admin',
      sendInvite: true
    });
    setError(null);
  };

  const handleInputChange = (field: keyof CreateAdminFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }

    if (!formData.password.trim()) {
      setError('Please enter a password');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!formData.userType) {
      setError('Please select a user type');
      return false;
    }

    return true;
  };

  const handleCreateAdmin = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);
      setError(null);

      // Create the admin user using the simplified role service
      const result = await RoleService.createAdminUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        password: formData.password,
        userType: formData.userType,
        sendInvite: formData.sendInvite
      });

      if (result.success) {
        onAdminCreated();
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error creating admin:', err);
      setError('Failed to create admin user. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedRole = availableRoles.find(role => role.name === formData.userType);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Admin User" 
      size="md"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <UserPlusIcon className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Create Admin Account</span>
          </div>
          <p className="text-sm text-blue-700">
            This will create a new admin user account with the selected role and permissions.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading available roles...</div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email Address *</Label>
                <input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@ile-legal.com"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="admin-firstName">First Name *</Label>
                <input
                  id="admin-firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="admin-lastName">Last Name *</Label>
                <input
                  id="admin-lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Doe"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="admin-phone">Phone Number</Label>
                <input
                  id="admin-phone"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="admin-location">Location</Label>
                <input
                  id="admin-location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Lagos, Nigeria"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="admin-password">Password *</Label>
                <input
                  id="admin-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="admin-role">User Type *</Label>
                <select
                  id="admin-role"
                  value={formData.userType}
                  onChange={(e) => handleInputChange('userType', e.target.value as UserType)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a user type...</option>
                  {availableRoles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </div>


              <div className="flex items-center gap-2">
                <input
                  id="send-invite"
                  type="checkbox"
                  checked={formData.sendInvite}
                  onChange={(e) => handleInputChange('sendInvite', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="send-invite" className="text-sm">
                  Send notification email to the new admin
                </Label>
              </div>
            </div>

            {selectedRole && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldIcon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Selected Role Preview</span>
                </div>
                <h4 className="font-medium text-gray-900">{selectedRole.display_name}</h4>
                <p className="text-sm text-gray-700 mb-2">
                  {selectedRole.description || 'No description available'}
                </p>
                <div className="text-sm text-gray-600">
                  <strong>Permissions:</strong> {selectedRole.permissions.length} permission{selectedRole.permissions.length !== 1 ? 's' : ''}
                  {selectedRole.permissions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedRole.permissions.slice(0, 3).map((permission, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                        >
                          {permission}
                        </span>
                      ))}
                      {selectedRole.permissions.length > 3 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          +{selectedRole.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
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
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAdmin}
            disabled={isCreating || isLoading || !formData.email || !formData.firstName || !formData.lastName || !formData.password || !formData.userType}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? 'Creating...' : 'Create Admin User'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};