// React is used implicitly for JSX
import { useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { CheckCircleIcon, ClockIcon, LockIcon, ArrowRightIcon, LogOutIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EmailCapture } from "../../components/EmailCapture";
import { useSEO, seoConfigs } from "../../utils/seo";
import { TrustpilotWidget } from "../../components/TrustpilotWidget";

export const Home = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { updateSEO } = useSEO();

  // Update SEO for home page
  useEffect(() => {
    updateSEO(seoConfigs.home);
  }, [updateSEO]);

  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const handleMetaMaskConnect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Handle successful connection
        console.log('MetaMask connected');
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-[#282536] border-b border-gray-700 py-3 sm:py-4">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.svg" alt="Ilé Legal" className="w-8 h-8 sm:w-10 sm:h-10" />
            <div className="text-gray-300 text-xs sm:text-sm">
              Legal
              <br />
              Marketplace
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <div className="hidden sm:block text-gray-300 mr-2">
                  Logged in as: <span className="font-medium">{user.email}</span>
                  {user.role && <span className="ml-2 px-2 py-1 bg-gray-700 rounded-md text-xs">{user.role}</span>}
                </div>
                <div className="sm:hidden text-gray-300 mr-2">
                  <span className="text-sm">{user.email.split('@')[0]}</span>
                  {user.role && <span className="ml-1 px-2 py-1 bg-gray-700 rounded-md text-xs">{user.role}</span>}
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <LogOutIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
                {user.role === 'buyer' && (
                  <Link to="/buyer-dashboard">
                    <Button size="sm" className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-3 sm:px-4">
                      <span className="hidden sm:inline">Go to </span>Dashboard
                    </Button>
                  </Link>
                )}
                {user.role === 'seller' && (
                  <Link to="/seller-dashboard">
                    <Button size="sm" className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-3 sm:px-4">
                      <span className="hidden sm:inline">Go to </span>Dashboard
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleMetaMaskConnect}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828] px-3 sm:px-4 py-2"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  MetaMask
                </Button>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-3 sm:px-6">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 sm:py-16 lg:py-20 bg-[#1B1828]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <img src="/20250628-095507.jpg" alt="Hero" width={180} height={120} className="mx-auto mb-4 sm:mb-6 w-36 h-24 sm:w-52 sm:h-35 object-cover" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Simplifying Legal Due Diligence
            <br />
            <span className="text-[#FEC85F]">for Property Transactions</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 lg:mb-10 max-w-3xl mx-auto leading-relaxed px-2">
            Connect with verified legal professionals for seamless property due diligence. 
            Secure, efficient, and transparent legal services at your fingertips.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
            <Button className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg h-auto font-medium">
              Hire Legal Professionals
              <ArrowRightIcon className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Link to="/seller-dashboard">
              <Button variant="outline" className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg h-auto">
                Join as Legal Professional
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cards Section - Original Design */}
      <section className="w-full py-12 sm:py-16 lg:py-20 bg-white -mt-6 sm:-mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 lg:mb-16">How It Works</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 - Post Your Requirements */}
            <Card className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Post Your Requirements</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <input 
                      type="text" 
                      placeholder="Property information" 
                      className="w-full bg-transparent border-none outline-none text-gray-600 placeholder-gray-400"
                      readOnly
                    />
                  </div>
                  <Button className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 rounded-xl font-medium">
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 - Receive Expert Bids */}
            <Card className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Receive Expert Bids</h3>
                
                <div className="space-y-4">
                  {/* First Bid */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-3">Legal Professional</div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="w-4/5 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="w-3/5 h-2 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">Bid 5,000</div>
                  </div>

                  {/* Second Bid */}
                  <div className="bg-gray-50 rounded-xl p-4 relative">
                    <div className="text-sm text-gray-600 mb-3">Legal Professional</div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="w-4/5 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="w-3/5 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">Bid</span>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Best Value
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 - Get Work Completed */}
            <Card className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden lg:col-span-1 sm:col-span-2 lg:col-start-auto sm:mx-auto sm:max-w-md lg:max-w-none lg:mx-0">
              <CardContent className="p-6 sm:p-8 text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Get Work completed</h3>
                
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                
                <p className="text-gray-600 font-medium">Funds held in escrow</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#1B1828] rounded-full flex items-center justify-center mb-4">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Time-Saving</h3>
              <p className="text-sm sm:text-base text-gray-600">Quick turnaround times for all legal processes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#1B1828] rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Verified Professionals</h3>
              <p className="text-sm sm:text-base text-gray-600">All legal professionals are thoroughly vetted</p>
            </div>
            <div className="flex flex-col items-center lg:col-span-1 sm:col-span-2 lg:col-start-auto sm:mx-auto">
              <div className="w-12 h-12 bg-[#1B1828] rounded-full flex items-center justify-center mb-4">
                <LockIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Secure Transactions</h3>
              <p className="text-sm sm:text-base text-gray-600">Payments protected with escrow services</p>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Stay Ahead in Property Law
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Get exclusive updates on Nigerian property law changes, legal tips, and be the first to access new features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Waitlist Signup */}
            <EmailCapture
              variant="waitlist"
              title="Join Our Waitlist"
              subtitle="Be first to access new legal services and exclusive features"
              className="h-full"
            />
            
            {/* Newsletter Signup */}
            <EmailCapture
              variant="newsletter"
              title="Legal Newsletter"
              subtitle="Weekly insights on property law, market updates, and legal tips"
              className="h-full"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 sm:py-16 lg:py-20 bg-[#1B1828]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to streamline your property due diligence?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto px-2">
            Join thousands of property developers and investors who trust our platform
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
            <Link to="/register">
              <Button className="bg-[#FEC85F] text-[#1B1828] hover:bg-[#FEC85F]/90 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg h-auto">
                Register Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg h-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <img src="/logo.svg" alt="Ilé Legal" className="w-12 h-12 sm:w-16 sm:h-16" />
                <span className="text-white text-2xl font-normal ml-2">Legal</span>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md mb-6">
                Connecting property developers and investors with verified legal 
                professionals for property due diligence and compliance tasks.
              </p>
              
              {/* Trustpilot Widget */}
              <div className="mb-8">
                <TrustpilotWidget
                  businessunitId="685fa67e885e63ea1c7b9d0e"
                  size="small"
                  theme="light"
                  locale="en-US"
                  className="max-w-full"
                />
              </div>
              
              {/* Social Media Links */}
              <div className="flex gap-4">
                {/* LinkedIn */}
                <a href="https://www.linkedin.com/company/ileplatform/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                {/* Twitter/X */}
                <a href="https://x.com/IlePlatform" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="https://www.instagram.com/ileplatform/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* Telegram */}
                <a href="https://t.me/ileplatformchat" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.820 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white text-lg font-semibold mb-6">SERVICES</h4>
              <ul className="text-gray-400 space-y-3">
                <li className="hover:text-white cursor-pointer">Land Title Verification</li>
                <li className="hover:text-white cursor-pointer">Contract Review</li>
                <li className="hover:text-white cursor-pointer">Property Surveys</li>
                <li className="hover:text-white cursor-pointer">Compliance Checks</li>
                <li className="hover:text-white cursor-pointer">Due Diligence</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white text-lg font-semibold mb-6">CONTACT US</h4>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-1">📍</div>
                  <div>
                    <p>33 Adeyinka Street,</p>
                    <p>Ileupju, Lagos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">📞</div>
                  <p>+2347068849553</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">✉️</div>
                  <p>legal@ile.africa</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-gray-700" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              2025 Ile Legal Marketplace. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};