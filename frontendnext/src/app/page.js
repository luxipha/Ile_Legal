'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [tokenAmount, setTokenAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTokens, setAvailableTokens] = useState(40);
  const [percentageRemaining, setPercentageRemaining] = useState(80);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Fetch token supply data on page load
    fetchSupply();
  }, []);

  const fetchSupply = async () => {
    try {
      // Use the relative path to our Next.js API route
      const response = await fetch('/api/token-supply');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        // Make sure we're using the correct property names from the API response
        setAvailableTokens(data.availableTokens || data.availableSupply || 40);
        setPercentageRemaining(data.percentageRemaining || data.percentRemaining || 80);
      } else {
        console.error('API returned success: false');
        // Use default values if API returns success: false
        setAvailableTokens(40);
        setPercentageRemaining(80);
      }
    } catch (error) {
      console.error('Error fetching token supply');
      // Use default values if fetch fails
      setAvailableTokens(40);
      setPercentageRemaining(80);
    }
  };

  const handleBuyTokens = async () => {
    setIsLoading(true);
    try {
      const email = document.getElementById('email').value;
      
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
      
      // Store email and token amount in localStorage for use after payment
      localStorage.setItem('userEmail', email);
      localStorage.setItem('tokenAmount', tokenAmount.toString());
      
      const response = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          tokenAmount,
          currency: 'NGN',
          callbackUrl: window.location.origin + '/payment/callback',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Save reference for verification
        if (data.reference) {
          localStorage.setItem('pendingPaystackReference', data.reference);
        }
        
        // Redirect to Paystack checkout
        window.location.href = data.checkoutUrl;
      } else {
        alert('Payment initialization failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    if (typeof window !== 'undefined' && typeof window.bootstrap !== 'undefined') {
      const modalElement = document.getElementById('tokenModal');
      if (modalElement) {
        const modal = new window.bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  };

  const closeModal = () => {
    if (typeof window !== 'undefined' && typeof window.bootstrap !== 'undefined') {
      const modalElement = document.getElementById('tokenModal');
      if (modalElement) {
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    }
  };

  return (
    <main className="container-fluid">
      <div className="row h-100">
        {/* Left Side */}
        <div className="col-12 col-md-6 huge-side left-side" style={{ background: 'linear-gradient(45deg, #130c31, #40284c)' }}>
          <div className="row">
            <div className="col-10 offset-1 col-md-8 offset-md-2 huge-content py-4">
              <Link href="/">
                <img src="/images/logo.png" alt="Ile.Africa Logo" className="logo img-fluid" style={{ maxWidth: '150px' }} />
              </Link>

              {/* Social Icons */}
              <div className="social-icons d-flex ms-auto mt-4">
                <ul className="d-flex list-unstyled m-0">
                  <li className="ms-3">
                    <a href="https://facebook.com/IlePlatform" className="social-icon text-white">
                      <i className="fab fa-facebook-f" aria-hidden="true"></i>
                    </a>
                  </li>
                  <li className="ms-3">
                    <a href="https://x.com/IlePlatform" className="social-icon text-white">
                      <i className="fab fa-twitter" aria-hidden="true"></i>
                    </a>
                  </li>
                  <li className="ms-3">
                    <a href="http://linkedin.com/company/ileplatform" className="social-icon text-white">
                      <i className="fab fa-linkedin-in" aria-hidden="true"></i>
                    </a>
                  </li>
                  <li className="ms-3">
                    <a href="https://www.instagram.com/ileplatform/" className="social-icon text-white">
                      <i className="fab fa-instagram" aria-hidden="true"></i>
                    </a>
                  </li>
                  <li className="ms-3">
                    <a href="https://t.me/ileplatfromchat" className="social-icon text-white">
                      <i className="fab fa-telegram-plane" aria-hidden="true"></i>
                    </a>
                  </li>
                </ul>
              </div>

              <div className="mt-5 text-white">
                <h3 className="position-relative">The Binance of Real Estate</h3>
                <h1>Tokenizing Real Estate properties in Africa</h1>
                <h2 className="h5 fw-normal mt-3">
                  Be a landlord starting with 1$, buy real and sell properties with ease like you trade stocks. 
                  Fractional ownership, full market access, zero complexity
                </h2>
                
                <div className="d-flex mt-4">
                  <a className="btn btn-outline-dark" href="#featured-property">Buy Property</a>
                  <button className="btn btn-link">Partner with Ile.</button>
                </div>
                
                {/* Partner Logos */}
                <div className="partner-logo d-flex mt-5">
                  <ul className="d-flex list-unstyled m-0">
                    <li className="me-3">
                      <a href="#">
                        <img src="/images/Elite_realty.png" alt="Elite Realty" className="img-fluid" style={{ maxHeight: '40px' }} />
                      </a>
                    </li>
                    <li className="me-3">
                      <a href="#">
                        <img src="/images/ile_partner2.png" alt="Partner 2" className="img-fluid" style={{ maxHeight: '40px' }} />
                      </a>
                    </li>
                    <li className="me-3">
                      <a href="#">
                        <img src="/images/Westlink_ile.png" alt="Westlink" className="img-fluid" style={{ maxHeight: '40px' }} />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="col-12 col-md-6 huge-side right-side">
          <div className="featured-property p-4">
            <h2 id="featured-property">Featured Property</h2>
            <p className="text-secondary mb-4">Exclusive Properties Tokenized For Secure Ownership</p>

            {/* Property Carousel */}
            <div id="propertyCarousel" className="carousel slide mb-4" data-bs-ride="carousel">
              <div className="carousel-indicators">
                <button type="button" data-bs-target="#propertyCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                <button type="button" data-bs-target="#propertyCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                <button type="button" data-bs-target="#propertyCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
              </div>

              <div className="carousel-inner rounded-5">
                <div className="carousel-item active">
                  <img src="/images/ibeju.jpg" className="d-block w-100" alt="Property exterior" />
                </div>
                <div className="carousel-item">
                  <img src="/images/ibeju1.jpg" className="d-block w-100" alt="Property interior" />
                </div>
                <div className="carousel-item">
                  <img src="/images/ibeju2.jpg" className="d-block w-100" alt="Property amenities" />
                </div>
              </div>
              <button className="carousel-control-prev" type="button" data-bs-target="#propertyCarousel" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
              </button>
              <button className="carousel-control-next" type="button" data-bs-target="#propertyCarousel" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
              </button>
            </div>

            {/* Property Offer Section */}
            <div className="property-offer-item mb-4">
              <h3>Property offer</h3>
              <div className="row mb-3 ps-3 py-2">
                <div className="col-md-4 d-flex align-items-center mb-3 mb-md-0">
                  <i className="fa fa-flag me-2"></i>
                  <span className="text-secondary fw-bold">Revised Promo</span>
                </div>
                <div className="col-md-4 d-flex align-items-center mb-3 mb-md-0">
                  <i className="fa fa-map me-2"></i>
                  <span className="text-secondary fw-bold">100 Plots of land</span>
                </div>
                <div className="col-md-4 d-flex align-items-center">
                  <i className="fa fa-expand me-2"></i>
                  <span className="text-secondary fw-bold">500sqm</span>
                </div>
              </div>
            </div>

            {/* Property Trend */}
            <div className="row mb-4">
              <div className="col-12">
                <h4 className="text-center mb-4 text-secondary fw-bold">Property Trend Over Time</h4>
                <div className="chart-container" style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                  <img src="/images/charts.png" alt="property trend image" className="img-fluid w-50 d-block mx-auto" />
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <ul className="nav nav-tabs mb-4" id="propertyTabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button className="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab" aria-controls="details" aria-selected="true">Details</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="financial-tab" data-bs-toggle="tab" data-bs-target="#financial" type="button" role="tab" aria-controls="financial" aria-selected="false">Financial</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="documents-tab" data-bs-toggle="tab" data-bs-target="#documents" type="button" role="tab" aria-controls="documents" aria-selected="false">Documents</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="markets-tab" data-bs-toggle="tab" data-bs-target="#markets" type="button" role="tab" aria-controls="markets" aria-selected="false">Markets</button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content mb-4" id="propertyTabsContent">
              {/* Details Tab */}
              <div className="tab-pane fade show active" id="details" role="tabpanel" aria-labelledby="details-tab">
                <h3>About the property</h3>
                <p className="text-secondary mb-4">
                  Lorem viverra Ut ultrices leo. efficitur. ac vel Ut malesuada lorem. varius viverra volutpat quis Vestibulum dui. ex Nam nec tempor Cras enim. nisi cursus at, Quisque In Sed dui Quisque viverra ipsum tortor. urna. Nunc luctus quis turpis
                </p>
                
                {/* Additional property highlights */}
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="card bg-transparent border-0">
                      <div className="card-body">
                        <h3>Location Benefits</h3>
                        <p className="text-secondary mb-3">Strategic location with excellent connectivity and growing value.</p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Strategic location with excellent connectivity</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Close proximity to essential amenities</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Growing neighborhood with appreciation potential</li>
                          <li><i className="fa fa-check-circle me-2"></i> Easy access to transportation hubs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-transparent border-0">
                      <div className="card-body">
                        <h3>Development Features</h3>
                        <p className="text-secondary mb-3">Modern infrastructure with premium security and amenities.</p>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Fully developed infrastructure</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Gated community with 24/7 security</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Green spaces and recreational areas</li>
                          <li><i className="fa fa-check-circle me-2"></i> Clear titles and proper documentation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Financial Tab */}
              <div className="tab-pane fade" id="financial" role="tabpanel" aria-labelledby="financial-tab">
                <h3>Financial Overview</h3>
                <p className="text-secondary mb-4">
                  Comprehensive financial analysis of this investment opportunity shows excellent potential for both short-term and long-term returns.
                </p>
                
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="card bg-transparent border-0">
                      <div className="card-body">
                        <h3>Investment Highlights</h3>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="fa fa-line-chart me-2"></i> 15% projected annual appreciation</li>
                          <li className="mb-2"><i className="fa fa-money me-2"></i> Flexible payment plans available</li>
                          <li className="mb-2"><i className="fa fa-bank me-2"></i> Financing options at competitive rates</li>
                          <li><i className="fa fa-shield me-2"></i> Secure investment with clear title</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-transparent border-0">
                      <div className="card-body">
                        <h3>Payment Structure</h3>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> 10% initial deposit</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> 40% during construction phases</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> 50% on completion or mortgage options</li>
                          <li><i className="fa fa-check-circle me-2"></i> No hidden fees or charges</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Documents Tab */}
              <div className="tab-pane fade" id="documents" role="tabpanel" aria-labelledby="documents-tab">
                <h3>Important Documents</h3>
                <p className="text-secondary mb-4">
                  All documentation related to this property is available for your review. Please contact our office for physical copies or download digital versions below.
                </p>
                
                <div className="mb-4">
                  <div className="list-group bg-transparent">
                    <a href="#" className="list-group-item list-group-item-action bg-transparent" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">Title Deed & Ownership Proof</h5>
                        <small><i className="fa fa-file-pdf-o"></i></small>
                      </div>
                      <p className="mb-1">Official documentation verifying the legal ownership of the property.</p>
                      <small className="text-muted" style={{ color: '#ccc !important' }}>2.3 MB</small>
                    </a>
                    
                    <a href="#" className="list-group-item list-group-item-action bg-transparent" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">Property Development Plan</h5>
                        <small><i className="fa fa-file-text-o"></i></small>
                      </div>
                      <p className="mb-1">Detailed master plan showing all development phases and amenities.</p>
                      <small className="text-muted" style={{ color: '#ccc !important' }}>4.7 MB</small>
                    </a>
                    
                    <a href="#" className="list-group-item list-group-item-action bg-transparent" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">Investment Agreement Template</h5>
                        <small><i className="fa fa-file-word-o"></i></small>
                      </div>
                      <p className="mb-1">Standard investment agreement document for your reference.</p>
                      <small className="text-muted" style={{ color: '#ccc !important' }}>1.2 MB</small>
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Markets Tab */}
              <div className="tab-pane fade" id="markets" role="tabpanel" aria-labelledby="markets-tab">
                <h3>Market Analysis</h3>
                <p className="text-secondary mb-4">
                  A comprehensive overview of the current market conditions and future projections for this property's location.
                </p>
                
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card bg-transparent border-0">
                      <div className="card-body">
                        <h3>Market Trends</h3>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="fa fa-arrow-up me-2"></i> 15% annual price appreciation in the area</li>
                          <li className="mb-2"><i className="fa fa-arrow-up me-2"></i> Growing demand for residential properties</li>
                          <li className="mb-2"><i className="fa fa-arrow-up me-2"></i> Increasing infrastructure development</li>
                          <li><i className="fa fa-arrow-up me-2"></i> Rising interest from international investors</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-transparent border-0">
                      <div className="card-body">
                        <h3>Competitive Analysis</h3>
                        <ul className="list-unstyled">
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Lower price point than comparable properties</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> Better amenities and infrastructure</li>
                          <li className="mb-2"><i className="fa fa-check-circle me-2"></i> More flexible payment options</li>
                          <li><i className="fa fa-check-circle me-2"></i> Stronger legal documentation and title clarity</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Area</th>
                        <th>Price/sqm</th>
                        <th>5-Yr Growth</th>
                        <th>Demand</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>This Property</td>
                        <td>$580</td>
                        <td>52%</td>
                        <td>Very High</td>
                      </tr>
                      <tr>
                        <td>North District</td>
                        <td>$650</td>
                        <td>48%</td>
                        <td>High</td>
                      </tr>
                      <tr>
                        <td>East Sector</td>
                        <td>$480</td>
                        <td>42%</td>
                        <td>Medium</td>
                      </tr>
                      <tr>
                        <td>South Zone</td>
                        <td>$420</td>
                        <td>38%</td>
                        <td>Medium</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Investment Card */}
            <div className="investment-card px-4 py-3 mb-4">
              <div className="d-flex justify-content-between mb-3">
                <div className="investment-option">
                  <div className="me-1">↗</div>
                  <div className="investment-value">10%</div>
                  <div className="investment-label">RY</div>
                </div>
                <div className="investment-option">
                  <div className="me-1">↗</div>
                  <div className="investment-value">10%</div>
                  <div className="investment-label">PAR</div>
                </div>
              </div>

              <div className="progress" style={{ height: '12px', borderRadius: '6px' }}>
                <div 
                  id="progressBarMain" 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ width: `${percentageRemaining}%`, backgroundColor: '#FDD15F' }}
                  aria-valuenow={percentageRemaining}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>

              <div className="d-flex justify-content-between my-3">
                <div id="progressPercentageMain" className="text-secondary fw-bold">{percentageRemaining}%</div>
                <div id="availableTokensMain" className="text-secondary fw-bold">Available: {availableTokens} Tokens</div>
              </div>

              <button 
                className="btn btn-warning btn-lg w-100"
                onClick={openModal}
              >
                Buy Property
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Token Modal */}
      <div className="modal fade" id="tokenModal" tabIndex="-1" aria-labelledby="tokenModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="tokenModalLabel">Purchase Tokens</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeModal}></button>
            </div>
            <div className="modal-body">
              <div className="card p-4">
                <h3>Purchase Tokens</h3>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    placeholder="your@email.com" 
                    required 
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="tokenAmount" className="form-label">Number of Tokens</label>
                  <div className="input-group">
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setTokenAmount(Math.max(1, tokenAmount - 1))}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      className="form-control text-center" 
                      id="tokenAmount" 
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setTokenAmount(tokenAmount + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Price per token:</span>
                    <span>₦1,500</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Total:</span>
                    <span>₦{tokenAmount * 1500}</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-warning w-100" 
                  onClick={handleBuyTokens}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
