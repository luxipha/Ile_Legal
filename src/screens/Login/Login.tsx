import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EyeIcon, EyeOffIcon, MessageCircleIcon, HelpCircleIcon, CheckCircleIcon, ArrowLeftIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { testDirectLogin } from "../../lib/supabase";

export const Login = (): JSX.Element => {
  const { login, user, isLoading, createTestUser, signInWithGoogle, signInWithMetaMask, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Redirect based on user role when authenticated
  useEffect(() => {
    if (user) {
      // Get the redirect path from location state or default to role-based dashboard
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from);
      } else {
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
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    
    try {
      await login(formData.email, formData.password);
      // Redirection will be handled by the useEffect above
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPasswordEmail.trim()) {
      try {
        setIsSubmitting(true);
        await resetPassword(forgotPasswordEmail);
        // Show success message
        alert('Password reset link has been sent to your email address.');
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } catch (error: any) {
        console.error('Password reset error:', error);
        alert(error.message || 'Failed to send password reset email. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Left Section - Forgot Password Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="text-[#FEC85F] text-3xl font-bold">Ilé</div>
                <div className="text-gray-700 text-lg">
                  Legal
                  <br />
                  Marketplace
                </div>
              </Link>
            </div>

            <Card className="bg-white shadow-lg border-0 rounded-2xl">
              <CardContent className="p-8">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 p-0"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Sign In
                </Button>

                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                  <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 rounded-lg font-medium text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>

                {/* Back to Sign In */}
                <div className="text-center mt-6">
                  <p className="text-gray-600">
                    Remember your password?{" "}
                    <button 
                      onClick={() => setShowForgotPassword(false)}
                      className="text-[#1B1828] hover:text-[#FEC85F] font-medium"
                    >
                      Sign in
                    </button>
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

        {/* Right Section - AI Customer Support */}
        <div className="w-1/2 bg-gradient-to-br from-[#1B1828] to-[#2a2438] flex items-center justify-center p-8">
          <div className="text-center text-white max-w-md">
            {/* AI Support Icon */}
            <div className="w-32 h-32 mx-auto mb-8 bg-white/10 rounded-full flex items-center justify-center">
              <div className="w-20 h-20 bg-[#FEC85F] rounded-full flex items-center justify-center">
                <MessageCircleIcon className="w-10 h-10 text-[#1B1828]" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              Having trouble accessing your account? Our AI-powered customer support is here to assist you 24/7 with password recovery and account access issues.
            </p>

            {/* AI Support Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircleIcon className="w-4 h-4 text-[#1B1828]" />
                </div>
                <span className="text-gray-300">Account recovery assistance</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircleIcon className="w-4 h-4 text-[#1B1828]" />
                </div>
                <span className="text-gray-300">24/7 support availability</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-4 h-4 text-[#1B1828]" />
                </div>
                <span className="text-gray-300">Instant problem resolution</span>
              </div>
            </div>

            <Button 
              className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3 rounded-lg font-medium"
            >
              Start Chat with AI
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Section - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="text-[#FEC85F] text-3xl font-bold">Ilé</div>
              <div className="text-gray-700 text-lg">
                Legal
                <br />
                Marketplace
              </div>
            </Link>
          </div>

          <Card className="bg-white shadow-lg border-0 rounded-2xl">
            <CardContent className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
                <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none transition-all"
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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#1B1828] border-gray-300 rounded focus:ring-[#1B1828]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#1B1828] hover:text-[#FEC85F] font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="text-red-500 text-sm">{loginError}</div>
                )}
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 rounded-lg font-medium text-lg"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              {/* Social Login */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50 hover:border-[#FEC85F]"
                  onClick={async () => {
                    try {
                      setLoginError('');
                      console.log('Initiating MetaMask sign in...');
                      // Default to 'buyer' role for login
                      await signInWithMetaMask('buyer');
                      // User will be redirected based on role after successful login
                    } catch (error: any) {
                      console.error('MetaMask login error:', error);
                      setLoginError(error.message || 'Failed to connect with MetaMask');
                    }
                  }}
                  disabled={isSubmitting || isLoading}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5 mr-3" />
                  {isLoading ? 'Connecting...' : 'Continue with MetaMask'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50"
                  onClick={async () => {
                    try {
                      setLoginError('');
                      console.log('Initiating Google sign in...');
                      // Default to 'buyer' role for login
                      await signInWithGoogle('buyer');
                      // User will be redirected to Google for authentication
                    } catch (error: any) {
                      console.error('Google login error:', error);
                      setLoginError('Failed to initiate Google login');
                    }
                  }}
                  disabled={isSubmitting || isLoading}
                >
                  <img src="/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </Button>

                {/* Test Admin Login Button */}
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      // Fill the form
                      const testCredentials = {
                        email: "admin.test@ile-legal.com",
                        password: "password123",
                        rememberMe: true
                      };
                      setFormData(testCredentials);
                      
                      // Directly login
                      console.log('Logging in with test credentials...');
                      await login(testCredentials.email, testCredentials.password);
                      // Redirection will be handled by the useEffect
                    } catch (error) {
                      console.error('Test login error:', error);
                      setLoginError('Failed to login with test credentials');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50 bg-blue-50"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Logging in...' : 'Test Admin Login'}
                </Button>

                {/* Direct Test Login Button */}
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      console.log('Attempting direct login...');
                      
                      const result = await testDirectLogin("admin.test@ile-legal.com", "password123");
                      console.log('Direct login result:', result);
                      
                      if (result.data?.user) {
                        alert('Direct login successful! Redirecting to dashboard...');
                        navigate('/admin/dashboard');
                      } else {
                        const errorMessage = result.error ? result.error.message : 'Unknown error';
                        alert(`Direct login failed: ${errorMessage}`);
                      }
                    } catch (error: any) {
                      console.error('Error in direct login:', error);
                      alert(`Error in direct login: ${error?.message || 'Unknown error'}`);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50 bg-yellow-50"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Logging in...' : 'Direct Test Login'}
                </Button>
                
                {/* Create Test User Button */}
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      console.log('Creating test user...');
                      
                      await createTestUser('buyer');
                      console.log('Test user created successfully');
                      
                      alert('Test user created successfully');
                      // Always proceed since the function doesn't return success status anymore
                      setFormData({
                        email: "admin.test@ile-legal.com",
                        password: "password123",
                        rememberMe: true
                      });
                    } catch (error: any) {
                      console.error('Error creating test user:', error);
                      alert(`Error creating test user: ${error?.message || 'Unknown error'}`);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50 bg-green-50"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Creating...' : 'Create Test Admin User'}
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-[#1B1828] hover:text-[#FEC85F] font-medium">
                    Sign up
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

      {/* Right Section - AI Customer Support */}
      <div className="w-1/2 bg-gradient-to-br from-[#1B1828] to-[#2a2438] flex items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          {/* AI Support Icon */}
          <div className="w-32 h-32 mx-auto mb-8 bg-white/10 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-[#FEC85F] rounded-full flex items-center justify-center">
              <MessageCircleIcon className="w-10 h-10 text-[#1B1828]" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">
            Our AI-powered customer support is here to assist you 24/7. Get instant answers to your questions about legal services, platform features, and more.
          </p>

          {/* AI Support Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                <HelpCircleIcon className="w-4 h-4 text-[#1B1828]" />
              </div>
              <span className="text-gray-300">Instant legal guidance</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircleIcon className="w-4 h-4 text-[#1B1828]" />
              </div>
              <span className="text-gray-300">24/7 platform support</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-4 h-4 text-[#1B1828]" />
              </div>
              <span className="text-gray-300">Quick problem resolution</span>
            </div>
          </div>

          <Button 
            className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3 rounded-lg font-medium"
          >
            Start Chat with AI
          </Button>
        </div>
      </div>
    </div>
  );
};