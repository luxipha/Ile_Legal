import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EyeIcon, EyeOffIcon, UserIcon, BriefcaseIcon, MessageCircleIcon, HelpCircleIcon, CheckCircleIcon } from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/index';
import { validateEmail, validatePasswordStrength, PasswordStrength } from '../../utils/validation';
import { EmailValidationIndicator } from '../../components/ui/EmailValidationIndicator';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { RegistrationConfirmationModal } from '../../components/ui/RegistrationConfirmationModal';

export const Register = (): JSX.Element => {
  const { register, signInWithMetaMask, signInWithGoogle, user, isLoading, isMetaMaskConnecting } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<"client" | "professional">("client");
  const [registrationError, setRegistrationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: false,
  });

  // Validation states
  const [emailValidation, setEmailValidation] = useState({ isValid: false, message: '' });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    }
  });
  const [showValidation, setShowValidation] = useState({
    email: false,
    password: false,
  });

  // Modal states for social auth validation
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAuthMethod, setPendingAuthMethod] = useState<'google' | 'metamask' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Real-time validation
    if (name === 'email') {
      const validation = validateEmail(value);
      setEmailValidation(validation);
      setShowValidation(prev => ({ ...prev, email: value.length > 0 }));
    }

    if (name === 'password') {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);
      setShowValidation(prev => ({ ...prev, password: value.length > 0 }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError("");
    
    // Validate email
    const emailValidationResult = validateEmail(formData.email);
    if (!emailValidationResult.isValid) {
      setRegistrationError(emailValidationResult.message);
      return;
    }

    // Validate password strength
    const passwordStrengthResult = validatePasswordStrength(formData.password);
    if (!passwordStrengthResult.isValid) {
      setRegistrationError("Password does not meet security requirements");
      return;
    }
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setRegistrationError("Passwords don't match");
      return;
    }
    
    if (!formData.agreeToTerms) {
      setRegistrationError("You must agree to the Terms of Service");
      return;
    }
    
    // Map userType to UserRole
    const role: UserRole = userType === "professional" ? "seller" : "buyer";
    
    try {
      setIsSubmitting(true);
      const fullName = `${formData.firstName} ${formData.lastName}`;
      await register(fullName, formData.email, formData.password, role);
      // Navigation will be handled by the useEffect in the component
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegistrationError(error.message || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  // MetaMask registration with validation
  const handleMetaMaskRegister = () => {
    setPendingAuthMethod('metamask');
    setShowConfirmationModal(true);
  };

  // Google registration with validation
  const handleGoogleRegister = () => {
    setPendingAuthMethod('google');
    setShowConfirmationModal(true);
  };

  // Execute the actual social auth after confirmation
  const executeAuthMethod = async () => {
    if (!pendingAuthMethod) return;

    try {
      setRegistrationError("");
      setIsSubmitting(true);
      
      // Map userType to UserRole
      const role: UserRole = userType === "professional" ? "seller" : "buyer";
      
      console.log(`Initiating ${pendingAuthMethod} registration as ${userType}...`);
      
      if (pendingAuthMethod === 'metamask') {
        await signInWithMetaMask(role);
      } else if (pendingAuthMethod === 'google') {
        await signInWithGoogle(role);
      }
      
      console.log(`User registered with ${pendingAuthMethod} as ${userType} (${role})`);
      
      // Close modal and reset state
      setShowConfirmationModal(false);
      setPendingAuthMethod(null);
      
    } catch (error: any) {
      console.error(`${pendingAuthMethod} registration error:`, error);
      setRegistrationError(error.message || `Failed to register with ${pendingAuthMethod}`);
      setShowConfirmationModal(false);
      setPendingAuthMethod(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    setShowConfirmationModal(false);
    setPendingAuthMethod(null);
  };
  
  // Redirect based on user role when authenticated
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'seller':
          navigate('/seller-dashboard');
          break;
        case 'buyer':
          navigate('/buyer-dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);

  // Password validation is handled by the backend

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Left Section - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-4 sm:mb-6">
            <Link to="/" className="inline-flex items-center gap-2 sm:gap-3">
              <img src="/logo.svg" alt="Ilé Legal" className="w-12 h-12 sm:w-16 sm:h-16" />
              <div className="text-gray-700 text-base sm:text-lg">
                Legal
                <br />
                Marketplace
              </div>
            </Link>
          </div>

          <Card className="bg-white shadow-lg border-0 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Sign up</h1>
                <p className="text-sm sm:text-base text-gray-600">Welcome onboard! Please enter your details.</p>
              </div>

              {/* User Type Selection */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose your account type:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("client")}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 ${
                      userType === "client"
                        ? "border-[#1B1828] bg-[#1B1828] text-white"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <UserIcon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${userType === "client" ? "text-[#FEC85F]" : "text-gray-400"}`} />
                    <div className="font-semibold text-sm">Client</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("professional")}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 ${
                      userType === "professional"
                        ? "border-[#1B1828] bg-[#1B1828] text-white"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <BriefcaseIcon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${userType === "professional" ? "text-[#FEC85F]" : "text-gray-400"}`} />
                    <div className="font-semibold text-xs sm:text-sm">Legal Professional</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    placeholder="First name"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    placeholder="Last name"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all text-sm sm:text-base ${
                      showValidation.email
                        ? emailValidation.isValid
                          ? 'border-green-500'
                          : 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                  <EmailValidationIndicator
                    email={formData.email}
                    isValid={emailValidation.isValid}
                    message={emailValidation.message}
                    showValidation={showValidation.email}
                  />
                </div>

                {/* Phone Field */}
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  placeholder="Phone number"
                  required
                />

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all text-sm sm:text-base ${
                        showValidation.password
                          ? passwordStrength.isValid
                            ? 'border-green-500'
                            : 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator
                    password={formData.password}
                    strength={passwordStrength}
                    showRequirements={showValidation.password}
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    placeholder="Repeat your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#1B1828] border-gray-300 rounded focus:ring-[#1B1828] mt-1"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    By creating an account, you are confirming that you have read, understood and agree to our{" "}
                    <a href="#" className="text-[#1B1828] hover:text-[#FEC85F] font-medium underline">
                      Terms and Conditions
                    </a>
                  </span>
                </label>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 rounded-lg font-medium text-base sm:text-lg"
                  disabled={!formData.agreeToTerms || formData.password !== formData.confirmPassword}
                >
                  Sign Up
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Error Message */}
              {registrationError && (
                <div className="text-red-500 text-sm mb-4">{registrationError}</div>
              )}
              
              {/* Social Registration */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleMetaMaskRegister}
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50 hover:border-[#FEC85F] transition-all"
                  disabled={isSubmitting || isLoading || isMetaMaskConnecting}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5 mr-3" />
                  {isMetaMaskConnecting ? 'Connecting to MetaMask...' : isLoading ? 'Loading...' : 'Continue with MetaMask'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50 transition-all"
                  onClick={async () => {
                    try {
                      setRegistrationError('');
                      
                      // Map userType to UserRole
                      const role: UserRole = userType === "professional" ? "seller" : "buyer";
                      
                      // Confirm role selection
                      if (!window.confirm(`You're registering as a ${userType}. Continue?`)) {
                        return;
                      }
                      
                      console.log(`Initiating Google sign in as ${userType}...`);
                      await signInWithGoogle(role);
                      
                      console.log(`User registered with Google as ${userType} (${role})`);
                      
                      // User will be redirected to Google for authentication
                    } catch (error: any) {
                      console.error('Google login error:', error);
                      setRegistrationError('Failed to initiate Google login');
                    }
                  }}
                  disabled={isSubmitting || isLoading || isMetaMaskConnecting}
                >
                  <img src="/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </Button>
              </div>

              {/* Sign In Link */}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#1B1828] hover:text-[#FEC85F] font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>© 2025 Ile Legal Marketplace. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Section - AI Customer Support - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1B1828] to-[#2a2438] items-center justify-center p-6 xl:p-8">
        <div className="text-center text-white max-w-md">
          {/* AI Support Icon */}
          <div className="w-24 h-24 xl:w-32 xl:h-32 mx-auto mb-6 xl:mb-8 bg-white/10 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 xl:w-20 xl:h-20 bg-[#FEC85F] rounded-full flex items-center justify-center">
              <MessageCircleIcon className="w-8 h-8 xl:w-10 xl:h-10 text-[#1B1828]" />
            </div>
          </div>

          <h2 className="text-2xl xl:text-3xl font-bold mb-4">Get Started with AI Help</h2>
          <p className="text-gray-300 mb-6 xl:mb-8 text-base xl:text-lg leading-relaxed">
            New to our platform? Our AI assistant can guide you through the registration process and answer any questions about our legal services.
          </p>

          {/* AI Support Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                <HelpCircleIcon className="w-4 h-4 text-[#1B1828]" />
              </div>
              <span className="text-gray-300">Registration guidance</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircleIcon className="w-4 h-4 text-[#1B1828]" />
              </div>
              <span className="text-gray-300">Platform walkthrough</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-4 h-4 text-[#1B1828]" />
              </div>
              <span className="text-gray-300">Service recommendations</span>
            </div>
          </div>

          <Button 
            className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6 xl:px-8 py-3 rounded-lg font-medium text-sm xl:text-base"
          >
            Chat with AI Assistant
          </Button>
        </div>
      </div>

      {/* Registration Confirmation Modal */}
      <RegistrationConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleCloseModal}
        onConfirm={executeAuthMethod}
        userType={userType}
        agreeToTerms={formData.agreeToTerms}
        authMethod={pendingAuthMethod || 'metamask'}
        loading={isSubmitting || isMetaMaskConnecting}
      />
    </div>
  );
};