import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// Import components
import IleLogo from './component/IleLogo';
import Properties from './pages/Properties';
import Task from './pages/Task';
import Fire from './pages/Fire';
// Add to imports
import Holder from './pages/Holder';

function App() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      WebApp.showAlert("Please enter your email address");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      WebApp.showAlert("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      WebApp.showAlert("Verification successful!");
      setIsSubmitting(false);
      setIsVerified(true);
    }, 1500);
  };

  return (
    <Router>
      <Routes>
        <Route path="/properties" element={<Properties />} />
        <Route path="/direct-properties" element={<Properties />} />
        <Route path="/tasks" element={<Task />} />
        <Route path="/fire" element={<Fire />} />
        <Route path="/" element={
          isVerified ? 
          <Navigate to="/properties" /> : 
          (
            <>
              <div className="absolute inset-0 z-[-1] bg-primary">
                {/* Background grid effect */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,215,0,0.03)_1px,transparent_1px),radial-gradient(rgba(255,215,0,0.02)_1px,transparent_1px)] bg-[length:50px_50px,100px_100px] bg-[0_0,25px_25px]"></div>
                
                {/* Background blur effects */}
                <div className="absolute top-[-100px] right-[-50px] w-[300px] h-[300px] rounded-full filter blur-[50px] bg-[radial-gradient(circle,rgba(255,215,0,0.15)_0%,rgba(10,25,41,0)_70%)]"></div>
                <div className="absolute bottom-[-150px] left-[-80px] w-[400px] h-[400px] rounded-full filter blur-[50px] bg-[radial-gradient(circle,rgba(255,215,0,0.15)_0%,rgba(10,25,41,0)_70%)] opacity-70"></div>
              </div>
              
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-[360px] bg-primary/70 backdrop-blur-xl border border-text-primary/10 rounded-2xl shadow-lg p-8">
                  <div className="flex flex-col items-center mb-6">
                    <div className="mb-6">
                      <IleLogo size="lg" />
                    </div>
                    <h1 className="font-bold text-2xl mb-2 bg-gradient-to-r from-text-primary to-white bg-clip-text text-transparent">
                      <span className="mr-2">👋</span>Welcome to Ile Wallet
                    </h1>
                    <p className="text-text-primary/70 text-center max-w-[280px] text-base">
                      Link your email to view your token holdings
                    </p>
                  </div>
                  
                  <div className="w-full">
                    <form onSubmit={handleSubmit}>
                      <div className="relative mb-6">
                        <input
                          type="email"
                          id="emailInput"
                          placeholder=" "
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full bg-white/5 border border-text-primary/10 text-text-primary rounded-xl h-[60px] text-lg px-4 pt-5 pb-2 transition-all duration-300 focus:bg-white/10 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,215,0,0.6),0_0_15px_rgba(255,215,0,0.6)] placeholder:text-transparent"
                        />
                        <label 
                          htmlFor="emailInput"
                          className={`absolute top-5 left-4 pointer-events-none transition-all duration-200 text-text-primary/60 origin-left ${
                            email ? 'transform -translate-y-3 scale-75 text-accent' : ''
                          }`}
                        >
                          Your Email Address
                        </label>
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-accent to-amber-500 text-primary font-semibold text-lg py-3 rounded-xl border-none cursor-pointer relative overflow-hidden shadow-[0_4px_12px_rgba(255,215,0,0.3)] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_6px_18px_rgba(255,215,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSubmitting ? 'Sending...' : 'Continue'}
                      </button>
                    </form>
                    
                    <p className="text-center text-text-primary/50 text-sm mt-6">
                      We only use your email to match previous token purchases
                    </p>
                    
                    <div className="mt-5 text-center">
                      <a href="/properties" className="text-accent underline text-sm">
                        Direct access to Properties page (for testing)
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        } />
        // Add in the Routes section
        <Route path="/holdings" element={<Holder />} />
      </Routes>
    </Router>
  );
}

export default App;