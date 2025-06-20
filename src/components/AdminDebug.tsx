import React, { useState } from 'react';
import { Button } from './ui/button';
import { debugAdminLogin, checkAdminUser, updateAdminRole } from '../utils/adminSetup';
import { testCircleApiConfiguration } from '../utils/testCircleApi';
import { migrateExistingUsers } from '../utils/migrateUsers';
import { RoleService } from '../services/roleService';
import { useAuth } from '../contexts/AuthContext';

export const AdminDebug: React.FC = () => {
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();

  const runDebug = async () => {
    setIsLoading(true);
    setDebugOutput('Running admin debug...\n');
    
    try {
      const result = await debugAdminLogin();
      setDebugOutput(prev => prev + JSON.stringify(result, null, 2));
    } catch (error) {
      setDebugOutput(prev => prev + `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminLogin = async () => {
    setIsLoading(true);
    setDebugOutput('Testing admin login...\n');
    
    try {
      await login('admin.test@ile-legal.com', 'password123');
      setDebugOutput(prev => prev + 'Login successful!\n');
      setDebugOutput(prev => prev + `Current user: ${JSON.stringify(user, null, 2)}`);
    } catch (error) {
      setDebugOutput(prev => prev + `Login failed: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixAdminRole = async () => {
    setIsLoading(true);
    setDebugOutput('Fixing admin role...\n');
    
    try {
      const result = await updateAdminRole();
      setDebugOutput(prev => prev + JSON.stringify(result, null, 2));
    } catch (error) {
      setDebugOutput(prev => prev + `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCircleApi = async () => {
    setIsLoading(true);
    setDebugOutput('Testing Circle API configuration...\n');
    
    try {
      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      let output = '';
      
      console.log = (...args) => {
        output += args.join(' ') + '\n';
        originalLog(...args);
      };
      
      console.error = (...args) => {
        output += 'ERROR: ' + args.join(' ') + '\n';
        originalError(...args);
      };
      
      await testCircleApiConfiguration();
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      setDebugOutput(prev => prev + output);
    } catch (error) {
      setDebugOutput(prev => prev + `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRoleSystem = async () => {
    setIsLoading(true);
    setDebugOutput('Testing role system...\n');
    
    try {
      // Test role fetching
      setDebugOutput(prev => prev + '1. Fetching all roles...\n');
      const roles = await RoleService.getAllRoles();
      setDebugOutput(prev => prev + `✅ Found ${roles.length} roles\n`);
      
      // Test permissions
      setDebugOutput(prev => prev + '2. Fetching all permissions...\n');
      const permissions = await RoleService.getAllPermissions();
      setDebugOutput(prev => prev + `✅ Found ${permissions.permissions.length} permissions in ${permissions.groups.length} categories\n`);
      
      // Test team members
      setDebugOutput(prev => prev + '3. Fetching team members...\n');
      const teamMembers = await RoleService.getTeamMembers();
      setDebugOutput(prev => prev + `✅ Found ${teamMembers.members.length} team members\n`);
      
      setDebugOutput(prev => prev + '\n✅ Role system test completed successfully!\n');
    } catch (error) {
      setDebugOutput(prev => prev + `❌ Role system test failed: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateUsers = async () => {
    setIsLoading(true);
    setDebugOutput('Migrating users to new role system...\n');
    
    try {
      await migrateExistingUsers();
      setDebugOutput(prev => prev + '✅ User migration completed successfully!\n');
    } catch (error) {
      setDebugOutput(prev => prev + `❌ User migration failed: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🛠️ Admin Debug Tools</h3>
      
      <div className="space-y-3 mb-4">
        <Button onClick={runDebug} disabled={isLoading} variant="outline">
          🔍 Run Full Admin Debug
        </Button>
        
        <Button onClick={testAdminLogin} disabled={isLoading} variant="outline">
          🔑 Test Admin Login
        </Button>
        
        <Button onClick={fixAdminRole} disabled={isLoading} variant="outline">
          🔧 Fix Admin Role
        </Button>
        
        <Button onClick={testCircleApi} disabled={isLoading} variant="outline">
          💰 Test Circle API
        </Button>
        
        <Button onClick={testRoleSystem} disabled={isLoading} variant="outline">
          👥 Test Role System
        </Button>
        
        <Button onClick={migrateUsers} disabled={isLoading} variant="outline">
          🚀 Migrate Users
        </Button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
        <pre>{debugOutput || 'Click a button to run debug commands...'}</pre>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400">
        <p className="text-sm text-blue-700">
          <strong>Current User:</strong> {user ? `${user.email} (${user.role})` : 'Not logged in'}
        </p>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p><strong>Admin Credentials:</strong></p>
        <p>Email: admin.test@ile-legal.com</p>
        <p>Password: password123</p>
        <p>Expected Role: admin</p>
      </div>
    </div>
  );
};