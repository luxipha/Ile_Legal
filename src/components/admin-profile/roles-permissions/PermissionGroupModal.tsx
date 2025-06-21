import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { LockIcon, CheckIcon } from 'lucide-react';
import { Role, Permission, PermissionGroup, CreateRoleRequest, UpdateRoleRequest } from '../../../types/roles';
import { RoleService } from '../../../services/roleService';
import { PERMISSION_CATEGORIES } from '../../../types/roles';

interface PermissionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  role: Role | null; // null for creating new role
}

export const PermissionGroupModal: React.FC<PermissionGroupModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  role
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    color: '#6B7280'
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = role !== null;

  // Load permissions and initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      if (isEditing && role) {
        initializeFormForEdit(role);
      } else {
        initializeFormForCreate();
      }
    }
  }, [isOpen, role, isEditing]);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await RoleService.getAllPermissions();
      setAvailablePermissions(response.permissions);
      setPermissionGroups(response.groups);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeFormForEdit = (roleToEdit: Role) => {
    setFormData({
      name: roleToEdit.name,
      display_name: roleToEdit.display_name,
      description: roleToEdit.description || '',
      color: roleToEdit.color
    });
    setSelectedPermissions(new Set(roleToEdit.permissions.map(p => p.id)));
  };

  const initializeFormForCreate = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      color: '#6B7280'
    });
    setSelectedPermissions(new Set());
    setError(null);
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleCategoryToggle = (categoryPermissions: Permission[]) => {
    const categoryIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryIds.every(id => selectedPermissions.has(id));
    
    const newSelected = new Set(selectedPermissions);
    if (allSelected) {
      // Deselect all in category
      categoryIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all in category
      categoryIds.forEach(id => newSelected.add(id));
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      setError('Please enter a display name for the role');
      return;
    }

    if (!isEditing && !formData.name.trim()) {
      setError('Please enter a role name');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (isEditing && role) {
        // Update existing role
        const updateData: UpdateRoleRequest = {
          display_name: formData.display_name,
          description: formData.description,
          color: formData.color,
          permission_ids: Array.from(selectedPermissions)
        };
        await RoleService.updateRole(role.id, updateData);
      } else {
        // Create new role
        const createData: CreateRoleRequest = {
          name: formData.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: formData.display_name,
          description: formData.description,
          color: formData.color,
          permission_ids: Array.from(selectedPermissions)
        };
        await RoleService.createRole(createData);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving role:', err);
      setError('Failed to save role. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? 'Edit Permission Group' : 'Create Permission Group'} 
      size="lg"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading permissions...</div>
          </div>
        ) : (
          <>
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Display Name *</Label>
                  <input
                    id="display_name"
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="e.g., Content Moderator"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {!isEditing && (
                  <div>
                    <Label htmlFor="name">Role Name *</Label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., content_moderator"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lowercase, underscores only. Cannot be changed later.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this role can do..."
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label>Role Color</Label>
                <div className="flex gap-2 mt-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Permissions ({selectedPermissions.size} selected)
              </h4>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {permissionGroups.map((group) => {
                  const categoryPermissions = group.permissions;
                  const selectedCount = categoryPermissions.filter(p => selectedPermissions.has(p.id)).length;
                  const allSelected = selectedCount === categoryPermissions.length;
                  const someSelected = selectedCount > 0 && selectedCount < categoryPermissions.length;

                  return (
                    <div key={group.category} className="border rounded-lg overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        style={{ borderLeft: `4px solid ${PERMISSION_CATEGORIES[group.category]?.color}` }}
                        onClick={() => handleCategoryToggle(categoryPermissions)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{group.display_name}</h5>
                            <p className="text-sm text-gray-600">{group.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {selectedCount}/{categoryPermissions.length}
                            </span>
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              allSelected ? 'bg-blue-600 border-blue-600' : 
                              someSelected ? 'bg-blue-200 border-blue-600' : 'border-gray-300'
                            }`}>
                              {(allSelected || someSelected) && (
                                <CheckIcon className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {someSelected || allSelected ? (
                        <div className="bg-gray-50 p-4 space-y-2">
                          {categoryPermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.has(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {permission.display_name}
                                </div>
                                {permission.description && (
                                  <div className="text-xs text-gray-500">
                                    {permission.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Role' : 'Create Role')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};