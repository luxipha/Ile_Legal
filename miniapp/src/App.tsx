import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import './App.css';

// Import components
import IleLogo from './component/IleLogo';
import Properties from './pages/Properties';

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
        <Route path="/" element={
          isVerified ? 
          <Navigate to="/properties" /> : 
          (
            <>
              <div className="background-grid"></div>
              <div className="background-blur blur-1"></div>
              <div className="background-blur blur-2"></div>
              
              <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <div className="card-glass" style={{ width: '100%', maxWidth: '360px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                      <IleLogo size="lg" />
                    </div>
                    <h1 className="gradient-text" style={{ fontWeight: 'bold', fontSize: '24px', marginBottom: '8px' }}>
                      <span style={{ marginRight: '8px' }}>👋</span>Welcome to Ile Wallet
                    </h1>
                    <p style={{ color: 'var(--beige)', opacity: 0.7, textAlign: 'center', maxWidth: '280px', fontSize: '16px' }}>
                      Link your email to view your token holdings
                    </p>
                  </div>
                  
                  <div style={{ width: '100%' }}>
                    <form onSubmit={handleSubmit}>
                      <div className="input-container" style={{ position: 'relative', marginBottom: '24px' }}>
                        <input
                          type="email"
                          className="form-input-glow"
                          id="emailInput"
                          placeholder=" "
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isSubmitting}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                        <label 
                          htmlFor="emailInput"
                          style={{
                            position: 'absolute',
                            top: '20px',
                            left: '16px',
                            pointerEvents: 'none',
                            transition: 'all 0.2s ease-in-out',
                            color: 'var(--beige)',
                            opacity: '0.6',
                            transform: email ? 'translateY(-12px) scale(0.75)' : 'translateY(0) scale(1)',
                            transformOrigin: 'left top'
                          }}
                        >
                          Your Email Address
                        </label>
                      </div>
                      
                      <button 
                        type="submit"
                        className="btn-gold shine-effect"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Sending...' : 'Continue'}
                      </button>
                    </form>
                    
                    <p style={{ textAlign: 'center', color: 'var(--beige)', opacity: 0.5, fontSize: '14px', marginTop: '24px' }}>
                      We only use your email to match previous token purchases
                    </p>
                    
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                      <a href="/properties" style={{ color: 'var(--gold)', textDecoration: 'underline', fontSize: '14px' }}>
                        Direct access to Properties page (for testing)
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;