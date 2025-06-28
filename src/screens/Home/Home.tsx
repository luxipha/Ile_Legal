// React is used implicitly for JSX
import { useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { CheckCircleIcon, ClockIcon, LockIcon, ArrowRightIcon, LogOutIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export const Home = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize Trustpilot widget
  useEffect(() => {
    // Check if Trustpilot script is loaded and initialize widgets
    if (typeof window !== 'undefined' && (window as any).Trustpilot) {
      (window as any).Trustpilot.loadFromElement(document.querySelector('.trustpilot-widget'));
    } else {
      // If script hasn't loaded yet, wait and try again
      const checkTrustpilot = setInterval(() => {
        if ((window as any).Trustpilot) {
          (window as any).Trustpilot.loadFromElement(document.querySelector('.trustpilot-widget'));
          clearInterval(checkTrustpilot);
        }
      }, 100);
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkTrustpilot), 10000);
    }
  }, []);
  
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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-[#282536] border-b border-gray-700 py-4">
        
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-[#FEC85F] text-2xl font-bold">Ilé</div>
            <div className="text-gray-300 text-sm">
              Legal
              <br />
              Marketplace
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-gray-300 mr-2">
                  Logged in as: <span className="font-medium">{user.email}</span>
                  {user.role && <span className="ml-2 px-2 py-1 bg-gray-700 rounded-md text-xs">{user.role}</span>}
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <LogOutIcon className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                {user.role === 'buyer' && (
                  <Link to="/buyer-dashboard">
                    <Button className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-4">
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
                {user.role === 'seller' && (
                  <Link to="/seller-dashboard">
                    <Button className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-4">
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleMetaMaskConnect}
                  variant="outline"
                  className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828] px-4 py-2"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5 mr-2" />
                  MetaMask
                </Button>
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-20 bg-[#1B1828]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <img src="/20250628-095507.jpg" alt="Hero" width={210} height={140} className="mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Simplifying Legal Due Diligence
            <br />
            <span className="text-[#FEC85F]">for Property Transactions</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Connect with verified legal professionals for seamless property due diligence. 
            Secure, efficient, and transparent legal services at your fingertips.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-4 text-lg h-auto font-medium">
              Hire Legal Professionals
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </Button>
            <Link to="/seller-dashboard">
              <Button variant="outline" className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828] px-8 py-4 text-lg h-auto">
                Join as Legal Professional
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cards Section - Original Design */}
      <section className="w-full py-20 bg-white -mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-4xl font-bold text-gray-900 mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 - Post Your Requirements */}
            <Card className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Post Your Requirements</h3>
                
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
            <Card className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Receive Expert Bids</h3>
                
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
            <Card className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Work completed</h3>
                
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
      <section className="w-full py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#1B1828] rounded-full flex items-center justify-center mb-4">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Time-Saving</h3>
              <p className="text-gray-600">Quick turnaround times for all legal processes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#1B1828] rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Professionals</h3>
              <p className="text-gray-600">All legal professionals are thoroughly vetted</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#1B1828] rounded-full flex items-center justify-center mb-4">
                <LockIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Transactions</h3>
              <p className="text-gray-600">Payments protected with escrow services</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 bg-[#1B1828]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to streamline your property due diligence?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of property developers and investors who trust our platform
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button className="bg-[#FEC85F] text-[#1B1828] hover:bg-[#FEC85F]/90 px-8 py-4 text-lg h-auto">
                Register Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828] px-8 py-4 text-lg h-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <span className="text-[#FEC85F] text-3xl font-bold">Ilé</span>
                <span className="text-white text-2xl font-normal ml-2">Legal</span>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md mb-6">
                Connecting property developers and investors with verified legal 
                professionals for property due diligence and compliance tasks.
              </p>
              
              {/* Trustpilot Widget */}
              <div className="mb-8">
                <div 
                  className="trustpilot-widget" 
                  data-locale="en-US" 
                  data-template-id="56278e9abfbbba0bdcd568bc" 
                  data-businessunit-id="685fa67e885e63ea1c7b9d0e" 
                  data-style-height="52px" 
                  data-style-width="100%"
                  style={{ minHeight: '52px', borderRadius: '4px', padding: '8px' }}
                >
                  <a href="https://www.trustpilot.com/review/ile.africa" target="_blank" rel="noopener" className="text-gray-300 text-sm">
                    ⭐ View our reviews on Trustpilot
                  </a>
                </div>
              </div>
              
              {/* Social Media Links */}
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 2.567-1.645 0-2.063-1.32-2.402-2.34-.201z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FEC85F] hover:text-[#1B1828] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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