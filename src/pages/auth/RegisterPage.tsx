import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog } from '@headlessui/react';
import { User, Building2, Scale, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Mail, Lock } from 'lucide-react';
import zxcvbn from 'zxcvbn';

// Form validation schema
const registerSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .min(5, { message: "Email is too short" })
    .max(100, { message: "Email is too long" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password is too long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  role: z.enum(['buyer', 'seller'], { 
    required_error: "Please select a role" 
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'buyer',
      termsAccepted: false
    }
  });
  
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  
  const password = watch('password');
  const passwordScore = password ? zxcvbn(password).score : 0;
  
  const getPasswordStrengthColor = () => {
    switch (passwordScore) {
      case 0: return 'bg-error-500';
      case 1: return 'bg-error-500';
      case 2: return 'bg-warning-500';
      case 3: return 'bg-secondary-500';
      case 4: return 'bg-success-500';
      default: return 'bg-gray-200';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordScore) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };
  
  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.name, data.email, data.password, data.role);
    } catch (error: any) {
      setServerError(error.message || 'Registration failed. Please try again.');
    }
  };
  
  const selectedRole = watch('role');

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Create your account</h3>
      
      {serverError && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-error-700 text-sm">{serverError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <div className="mt-1 relative">
            <input
              id="name"
              type="text"
              className={`input pl-10 ${errors.name ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
              placeholder="John Doe"
              {...register('name')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-error-500 flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.name.message}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1 relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`input pl-10 ${errors.email ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
              placeholder="you@example.com"
              {...register('email')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-error-500 flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`input pl-10 pr-10 ${errors.password ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
              {...register('password')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-600">Password strength:</div>
                <div className={`text-sm font-medium ${
                  passwordScore <= 1 ? 'text-error-500' :
                  passwordScore === 2 ? 'text-warning-500' :
                  passwordScore === 3 ? 'text-secondary-500' :
                  'text-success-500'
                }`}>
                  {getPasswordStrengthText()}
                </div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${(passwordScore + 1) * 20}%` }}
                />
              </div>
            </div>
          )}
          {errors.password && (
            <p className="mt-2 text-sm text-error-500 flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
              {...register('confirmPassword')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-error-500 flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                selectedRole === 'buyer' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-300 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                value="buyer"
                className="sr-only"
                {...register('role')}
              />
              <Building2 className={`h-6 w-6 ${
                selectedRole === 'buyer' ? 'text-primary-500' : 'text-gray-400'
              }`} />
              <div className="ml-3">
                <p className="font-medium">Property Developer/Investor</p>
                <p className="text-sm text-gray-500">Post tasks and hire legal professionals</p>
              </div>
            </label>
            
            <label
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                selectedRole === 'seller' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-300 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                value="seller"
                className="sr-only"
                {...register('role')}
              />
              <Scale className={`h-6 w-6 ${
                selectedRole === 'seller' ? 'text-primary-500' : 'text-gray-400'
              }`} />
              <div className="ml-3">
                <p className="font-medium">Legal Professional</p>
                <p className="text-sm text-gray-500">Offer your legal services</p>
              </div>
            </label>
          </div>
          {errors.role && (
            <p className="mt-2 text-sm text-error-500 flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.role.message}
            </p>
          )}
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="termsAccepted"
              type="checkbox"
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
              {...register('termsAccepted')}
            />
          </div>
          <div className="ml-3">
            <label htmlFor="termsAccepted" className="text-sm text-gray-700">
              I agree to the{' '}
              <button
                type="button"
                className="text-primary-500 hover:text-primary-600 font-medium"
                onClick={() => setIsTermsModalOpen(true)}
              >
                terms and conditions
              </button>
              {' '}and{' '}
              <button
                type="button"
                className="text-primary-500 hover:text-primary-600 font-medium"
                onClick={() => setIsTermsModalOpen(true)}
              >
                privacy policy
              </button>
            </label>
          </div>
        </div>
        {errors.termsAccepted && (
          <p className="text-sm text-error-500 flex items-center mt-2">
            <XCircle className="h-4 w-4 mr-1" />
            {errors.termsAccepted.message}
          </p>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex justify-center py-2 px-4"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                  <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating your account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600">
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms and Conditions Modal */}
      <Dialog
        open={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                  Terms and Conditions
                </Dialog.Title>
                <div className="mt-4 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm text-gray-500">
                    <h4>1. Acceptance of Terms</h4>
                    <p>
                      By accessing and using Ilé Legal Marketplace, you agree to be bound by these Terms and Conditions.
                    </p>

                    <h4>2. User Responsibilities</h4>
                    <p>
                      Users must provide accurate information and maintain the confidentiality of their account credentials.
                    </p>

                    <h4>3. Professional Verification</h4>
                    <p>
                      Legal professionals must undergo verification and maintain valid credentials throughout their use of the platform.
                    </p>

                    <h4>4. Payment Terms</h4>
                    <p>
                      All payments are processed through our secure escrow system. Fees will be clearly disclosed before transactions.
                    </p>

                    <h4>5. Privacy Policy</h4>
                    <p>
                      We collect and process personal data as described in our Privacy Policy, in compliance with applicable laws.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="btn-primary w-full sm:w-auto sm:ml-3"
                onClick={() => {
                  setValue('termsAccepted', true);
                  setIsTermsModalOpen(false);
                }}
              >
                Accept Terms
              </button>
              <button
                type="button"
                className="btn-ghost mt-3 sm:mt-0 w-full sm:w-auto"
                onClick={() => setIsTermsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default RegisterPage;