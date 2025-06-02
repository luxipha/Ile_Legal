import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Key, Mail, CreditCard, MessageSquare, Shield, Save, Plus } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const envVarSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  value: z.string().min(1, 'Value is required'),
  isSecret: z.boolean().default(false),
});

type EnvVar = z.infer<typeof envVarSchema>;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [isEnvVarModalOpen, setIsEnvVarModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EnvVar>({
    resolver: zodResolver(envVarSchema),
  });

  useEffect(() => {
    loadEnvVars();
  }, []);

  const loadEnvVars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/settings/env', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add proper auth token
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load environment variables');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      setEnvVars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading environment variables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitEnvVar = async (data: EnvVar) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/settings/env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add proper auth token
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save environment variable');
      }

      const savedVar = await response.json();
      setEnvVars(prev => [...prev, savedVar]);
      setSuccess('Environment variable saved successfully');
      setIsEnvVarModalOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error saving environment variable:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Platform Settings</h1>
        <p className="mt-1 text-gray-500">
          Configure system-wide settings and integrations
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-500 bg-opacity-10 text-error-500 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-success-500 bg-opacity-10 text-success-500 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Environment Variables */}
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-800">Environment Variables</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage application environment variables and API keys
                </p>
              </div>
              <button
                onClick={() => setIsEnvVarModalOpen(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </button>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading environment variables...</p>
              </div>
            ) : envVars.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {envVars.map((envVar, index) => (
                  <div key={index} className="py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">{envVar.name}</h3>
                      <p className="text-sm text-gray-500">
                        {envVar.isSecret ? '••••••••' : envVar.value}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {envVar.isSecret && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Secret
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No environment variables</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add environment variables to configure your application.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Integrations</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure third-party service integrations
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center">
                <Key className="h-6 w-6 text-gray-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">Authentication</h3>
                  <p className="text-sm text-gray-500">Configure authentication providers</p>
                </div>
              </div>
              <button className="btn-outline text-sm">Configure</button>
            </div>
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-gray-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">Payment Processing</h3>
                  <p className="text-sm text-gray-500">Manage payment gateway settings</p>
                </div>
              </div>
              <button className="btn-outline text-sm">Configure</button>
            </div>
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-6 w-6 text-gray-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">Messaging</h3>
                  <p className="text-sm text-gray-500">Set up messaging service configuration</p>
                </div>
              </div>
              <button className="btn-outline text-sm">Configure</button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Security</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage security and compliance settings
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-gray-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">KYC Requirements</h3>
                  <p className="text-sm text-gray-500">Configure verification requirements</p>
                </div>
              </div>
              <button className="btn-outline text-sm">Configure</button>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variable Modal */}
      <Dialog
        open={isEnvVarModalOpen}
        onClose={() => setIsEnvVarModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Add Environment Variable
            </Dialog.Title>

            <form onSubmit={handleSubmit(onSubmitEnvVar)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Variable Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name')}
                  className="mt-1 input"
                  placeholder="STRIPE_API_KEY"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="text"
                  id="value"
                  {...register('value')}
                  className="mt-1 input"
                  placeholder="sk_test_..."
                />
                {errors.value && (
                  <p className="mt-1 text-sm text-error-500">{errors.value.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSecret"
                  {...register('isSecret')}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isSecret" className="ml-2 block text-sm text-gray-700">
                  This is a secret value
                </label>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEnvVarModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Variable
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default SettingsPage;