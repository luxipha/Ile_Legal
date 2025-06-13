import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EyeIcon, EyeOffIcon, MessageCircleIcon, HelpCircleIcon, CheckCircleIcon, ArrowLeftIcon } from "lucide-react";

export const Login = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPasswordEmail.trim()) {
      console.log('Password reset requested for:', forgotPasswordEmail);
      // Show success message
      alert('Password reset link has been sent to your email address.');
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    }
  };

  const handleMetaMaskLogin = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('MetaMask login successful:', accounts[0]);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
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
                  >
                    Send Reset Link
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 rounded-lg font-medium text-lg"
                >
                  Sign In
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
                  onClick={handleMetaMaskLogin}
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50 hover:border-[#FEC85F]"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5 mr-3" />
                  Continue with MetaMask
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-3 rounded-lg border-gray-300 hover:bg-gray-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
                  Continue with Google
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