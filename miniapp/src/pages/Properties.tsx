import React from 'react';
import PropertyCard, { Property } from '../component/PropertyCard';
import './Properties.css';

// Sample property data
const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Luxury Villa',
    location: 'Lekki Phase 1, Lagos',
    zoning: 'Residential',
    titleStatus: 'C of O',
    tokensOwned: 250,
    totalTokens: 1000,
    purchasePrice: 25000000,
    projectedValue: 35000000,
    timeHeld: '1 year, 3 months',
    liquidityScore: 'High',
    growthPotential: 'Medium',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  },
  {
    id: '2',
    title: 'Commercial Plaza',
    location: 'Victoria Island, Lagos',
    zoning: 'Commercial',
    titleStatus: 'Governor\'s Consent',
    tokensOwned: 100,
    totalTokens: 2000,
    purchasePrice: 50000000,
    projectedValue: 75000000,
    timeHeld: '8 months',
    liquidityScore: 'Medium',
    growthPotential: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1577415124269-fc1140a69e91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80',
  },
  {
    id: '3',
    title: 'Residential Land',
    location: 'Ikoyi, Lagos',
    zoning: 'Residential',
    titleStatus: 'C of O',
    tokensOwned: 500,
    totalTokens: 1000,
    purchasePrice: 40000000,
    projectedValue: 60000000,
    timeHeld: '2 years, 1 month',
    liquidityScore: 'Medium',
    growthPotential: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  },
  {
    id: '4',
    title: 'Mixed-Use Development',
    location: 'Ikeja GRA, Lagos',
    zoning: 'Mixed-Use',
    titleStatus: 'Governor\'s Consent',
    tokensOwned: 150,
    totalTokens: 3000,
    purchasePrice: 60000000,
    projectedValue: 85000000,
    timeHeld: '6 months',
    liquidityScore: 'Low',
    growthPotential: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  }
];

const Properties: React.FC = () => {
  return (
    <div className="properties-page">
      <div className="background-grid"></div>
      <div className="background-blur blur-1"></div>
      <div className="background-blur blur-2"></div>
      
      <div className="page-container">
        <header className="page-header">
          <h1 className="gradient-text">Your Properties</h1>
          <p className="subtitle">Explore your property investments</p>
        </header>
        
        <main className="properties-grid">
          {sampleProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </main>
        
        <footer className="bottom-nav">
          <div className="nav-item">
            <div className="nav-icon">📊</div>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className="nav-item active">
            <div className="nav-icon">🏢</div>
            <span className="nav-text">Properties</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">📜</div>
            <span className="nav-text">History</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">👤</div>
            <span className="nav-text">Account</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Properties;