import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      // Navigate based on user role (will be handled by auth layout)
    } catch (error) {
      setError('email', { 
        type: 'manual', 
        message: 'Invalid email or password' 
      });
      setError('password', { 
        type: 'manual', 
        message: 'Invalid email or password' 
      });
    }
  };

  // Demo account information
  const demoAccounts = [
    { email: 'buyer@example.com', password: 'password123', role: 'Buyer' },
    { email: 'seller@example.com', password: 'password123', role: 'Legal Professional' },
    { email: 'admin@example.com', password: 'password123', role: 'Admin' },
  ];

  const handleDemoLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Navigate based on user role (will be handled by auth layout)
    } catch (error) {
      console.error('Demo login failed', error);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input ${errors.email ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-error-500">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`input ${errors.password ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-error-500">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-primary-500 hover:text-primary-600">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex justify-center py-2 px-4"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>

      {/* Demo accounts */}
      <div className="mt-8">
        <h4 className="text-sm font-medium text-gray-500 mb-3">Demo Accounts</h4>
        <div className="space-y-2">
          {demoAccounts.map((account, index) => (
            <button
              key={index}
              onClick={() => handleDemoLogin(account.email, account.password)}
              className="w-full text-left px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              <span className="block font-medium text-gray-700">Login as {account.role}</span>
              <span className="block text-xs text-gray-500">{account.email} / {account.password}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/register"
            className="w-full flex justify-center py-2 px-4 border border-primary-500 rounded-md shadow-sm text-sm font-medium text-primary-500 hover:bg-primary-50"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;