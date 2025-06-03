import React, { useState, useEffect } from 'react';
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
  // Animation styles for the form elements
  const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeInUp 0.5s ease-out forwards;
  }

  .animate-delay-100 {
    animation-delay: 100ms;
  }

  .animate-delay-200 {
    animation-delay: 200ms;
  }

  .animate-delay-300 {
    animation-delay: 300ms;
  }

  .animate-delay-400 {
    animation-delay: 400ms;
  }

  .animate-delay-500 {
    animation-delay: 500ms;
  }
  `;

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'buyer',
      termsAccepted: false
    }
  });
  
  const { register: registerUser } = useAuth();
  // Navigate will be used after successful registration
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  
  // Watch password field for strength calculation and validation
  const password = watch('password');
  const passwordStrength = password ? zxcvbn(password).score : 0;
  
  // Create a style element to inject the animation styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = animationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Update progress when form values change
  useEffect(() => {
    updateFormProgress();
  }, [watch('name'), watch('email'), watch('password'), watch('role'), watch('termsAccepted')]);
  
  
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-error-500';
      case 1: return 'bg-error-500';
      case 2: return 'bg-warning-500';
      case 3: return 'bg-secondary-500';
      case 4: return 'bg-success-500';
      default: return 'bg-gray-200';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };
  
  // Update form progress whenever form values change
  const updateFormProgress = () => {
    const formValues = watch();
    let completedFields = 0;
    let totalFields = 5; // name, email, password, role, terms
    
    if (formValues.name && formValues.name.length >= 2) completedFields++;
    if (formValues.email && formValues.email.includes('@')) completedFields++;
    if (formValues.password && formValues.password.length >= 8) completedFields++;
    if (formValues.role) completedFields++;
    if (formValues.termsAccepted) completedFields++;
    
    const progress = Math.round((completedFields / totalFields) * 100);
    setFormProgress(progress);
  };
  
  const getPasswordRequirements = () => {
    if (!password) return [];
    
    return [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'Contains uppercase letter' },
      { met: /[a-z]/.test(password), text: 'Contains lowercase letter' },
      { met: /[0-9]/.test(password), text: 'Contains number' },
      { met: /[^A-Za-z0-9]/.test(password), text: 'Contains special character' }
    ];
  };
  
  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.name, data.email, data.password, data.role);
      // Navigate to dashboard or confirmation page after successful registration
      navigate('/dashboard');
    } catch (error: any) {
      setServerError(error.message || 'Registration failed. Please try again.');
    }
  };
  
  const selectedRole = watch('role');

  return (
    <div>
      <div className="text-center mb-8">
        <img src="https://ile.africa/images/logo.png" alt="Ile Logo" className="h-16 mx-auto mb-4" />
        <p className="text-gray-500 mt-1">Professional Registration</p>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Registration Progress</span>
          <span>{formProgress}% Complete</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${formProgress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>256-bit SSL Encrypted</span>
      </div>
      
      {serverError && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-error-700 text-sm">{serverError}</p>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Personal Information</h2>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full name <span className="text-error-500">*</span>
          </label>
          <div className="mt-1 relative">
            <input
              id="name"
              type="text"
              className={`input pl-10 ${errors.name ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : watch('name')?.length >= 2 ? 'border-success-500 focus:ring-success-500 focus:border-success-500' : ''}`}
              placeholder="John Doe"
              {...register('name')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            {watch('name')?.length >= 2 && !errors.name && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <CheckCircle2 className="h-5 w-5 text-success-500" />
              </div>
            )}
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
              className={`input pl-10 ${errors.email ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : watch('email')?.includes('@') ? 'border-success-500 focus:ring-success-500 focus:border-success-500' : ''}`}
              placeholder="you@example.com"
              {...register('email')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            {watch('email')?.includes('@') && !errors.email && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <CheckCircle2 className="h-5 w-5 text-success-500" />
              </div>
            )}
          </div>
          {!errors.email && watch('email') && (
            <p className="mt-1 text-xs text-gray-500">
              We'll send a verification link to this email address
            </p>
          )}
          {errors.email && (
            <p className="mt-2 text-sm text-error-500 flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>
        
        <div className="mb-6 animate-fadeIn animate-delay-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Account Security</h2>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password <span className="text-error-500">*</span>
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
              
              {/* Password requirements checklist */}
              <div className="mt-3 space-y-1">
                {getPasswordRequirements().map((req, index) => (
                  <div key={index} className="flex items-center text-xs">
                    {req.met ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-1.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                    )}
                    <span className={req.met ? 'text-success-700' : 'text-gray-500'}>{req.text}</span>
                  </div>
                ))}
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
        
        <div className="mb-6 animate-fadeIn animate-delay-300">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Professional Profile</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'buyer' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                  : 'border-gray-200 hover:border-primary-300 bg-gray-50 hover:bg-blue-50'
              }`}
            >
              <input
                type="radio"
                value="buyer"
                className="sr-only"
                {...register('role')}
              />
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  selectedRole === 'buyer' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Building2 className={`h-8 w-8 ${
                    selectedRole === 'buyer' ? 'text-primary-600' : 'text-gray-500'
                  }`} />
                </div>
                <p className="font-semibold text-lg mb-1">Property Developer/Investor</p>
                <p className="text-sm text-gray-500 leading-snug">Access legal services and post verification requests</p>
              </div>
              {selectedRole === 'buyer' && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-500" />
                </div>
              )}
            </label>
            
            <label
              className={`flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'seller' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                  : 'border-gray-200 hover:border-primary-300 bg-gray-50 hover:bg-blue-50'
              }`}
            >
              <input
                type="radio"
                value="seller"
                className="sr-only"
                {...register('role')}
              />
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  selectedRole === 'seller' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Scale className={`h-8 w-8 ${
                    selectedRole === 'seller' ? 'text-primary-600' : 'text-gray-500'
                  }`} />
                </div>
                <p className="font-semibold text-lg mb-1">Legal Professional</p>
                <p className="text-sm text-gray-500 leading-snug">Provide legal services and respond to client needs</p>
              </div>
              {selectedRole === 'seller' && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-500" />
                </div>
              )}
            </label>
          </div>
          {errors.role && (
            <p className="mt-2 text-sm text-error-500 flex items-center">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.role.message}
            </p>
          )}
        </div>
        
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6 animate-fadeIn animate-delay-400">
          <div className="flex items-start">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="termsAccepted"
                type="checkbox"
                className="h-5 w-5 text-primary-500 focus:ring-primary-500 border-gray-300 rounded accent-primary-500"
                {...register('termsAccepted')}
              />
            </div>
            <div className="ml-3">
              <label htmlFor="termsAccepted" className="text-sm text-gray-700 leading-relaxed">
                I acknowledge that I have read, understood, and agree to be bound by the{' '}
                <button
                  type="button"
                  className="text-primary-500 hover:text-primary-600 font-medium underline"
                  onClick={() => setIsTermsModalOpen(true)}
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-primary-500 hover:text-primary-600 font-medium underline"
                  onClick={() => setIsTermsModalOpen(true)}
                >
                  Privacy Policy
                </button>
                . I confirm that the information provided is accurate and complete.
              </label>
            </div>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-error-500 flex items-center mt-2 ml-8">
              <XCircle className="h-4 w-4 mr-1" />
              {errors.termsAccepted.message}
            </p>
          )}
        </div>
        
        <div className="animate-fadeIn animate-delay-500">
          <button
            type="submit"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating your account...
              </div>
            ) : (
              <div className="flex items-center">
                <span>Create Account</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
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