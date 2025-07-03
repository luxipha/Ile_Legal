import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { UserRole } from '../../types';

export const TestAccounts = (): JSX.Element => {
  const [isCreating, setIsCreating] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<Array<{email: string; password: string; role: string}>>([]);
  const [error, setError] = useState<string | null>(null);

  // Function to create a test user
  const createTestUser = async (role: UserRole) => {
    // Prevent test account creation in production
    if (import.meta.env.PROD) {
      setError('Test account creation is disabled in production');
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      // Generate random email and password - use real email for testing
      const randomEmail = `test${Math.floor(Math.random() * 10000)}+${role}@yourdomain.com`;
      const randomPassword = 'Password123!';
      
      // Create user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: randomEmail,
        password: randomPassword,
        options: {
          data: {
            name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${Math.floor(Math.random() * 1000)}`,
            role_title: role,
            role: role,
            email_verified: true
          }
        },
      });
      
      if (error) {
        console.error('Error creating test user:', error);
        setError(error.message);
        return;
      }
      
      // Add the created account to our list
      setCreatedAccounts(prev => [...prev, {
        email: randomEmail,
        password: randomPassword,
        role: role
      }]);
      
      console.log('Test user created:', data);
    } catch (error: any) {
      console.error('Error creating test user:', error);
      setError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Accounts</h1>
        
        {/* Create Test Accounts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Test Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={() => createTestUser('buyer')} 
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Buyer Account
              </Button>
              <Button 
                onClick={() => createTestUser('seller')} 
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Seller Account
              </Button>
              <Button 
                onClick={() => createTestUser('admin')} 
                disabled={isCreating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Admin Account
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Demo Accounts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Existing Demo Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="p-4 border rounded-md bg-blue-50">
                <h3 className="font-semibold text-lg">Buyer Account</h3>
                <p><strong>Email:</strong> buyer@ile-legal.com</p>
                <p><strong>Password:</strong> buyer</p>
              </div>
              <div className="p-4 border rounded-md bg-green-50">
                <h3 className="font-semibold text-lg">Seller Account</h3>
                <p><strong>Email:</strong> seller@ile-legal.com</p>
                <p><strong>Password:</strong> seller</p>
              </div>
              <div className="p-4 border rounded-md bg-purple-50">
                <h3 className="font-semibold text-lg">Admin Account</h3>
                <p><strong>Email:</strong> admin.test@ile-legal.com</p>
                <p><strong>Password:</strong> (Password not provided)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Created Test Accounts */}
        {createdAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Created Test Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {createdAccounts.map((account, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <h3 className="font-semibold text-lg">{account.role.charAt(0).toUpperCase() + account.role.slice(1)} Account</h3>
                    <p><strong>Email:</strong> {account.email}</p>
                    <p><strong>Password:</strong> {account.password}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
