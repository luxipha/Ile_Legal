import React from 'react';
import WebApp from '@twa-dev/sdk';
import './PropertyCard.css';

// Define the property data structure
export interface Property {
  id: string;
  title: string;
  location: string;
  zoning: string;
  titleStatus: string;
  tokensOwned: number;
  totalTokens: number;
  purchasePrice: number;
  projectedValue: number;
  timeHeld: string;
  liquidityScore: 'Low' | 'Medium' | 'High';
  growthPotential: 'Low' | 'Medium' | 'High';
  imageUrl: string;
}

// Props interface for the PropertyCard component
interface PropertyCardProps {
  property: Property;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to get color based on score
const getScoreColor = (score: 'Low' | 'Medium' | 'High') => {
  switch (score) {
    case 'Low':
      return 'rgba(255, 99, 71, 0.8)'; // tomato with transparency
    case 'Medium':
      return 'rgba(255, 215, 0, 0.8)'; // gold with transparency
    case 'High':
      return 'rgba(50, 205, 50, 0.8)'; // limegreen with transparency
  }
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  // Calculate token ownership percentage
  const ownershipPercentage = (property.tokensOwned / property.totalTokens) * 100;
  
  const handleViewDocuments = () => {
    WebApp.showAlert("Documents feature coming soon!");
  };

  const handleViewMap = () => {
    WebApp.showAlert("Map view feature coming soon!");
  };
  
  return (
    <div className="property-card-container">
      <div className="property-card">
        {/* Property Image */}
        <div className="property-image-container">
          <img 
            src={property.imageUrl} 
            alt={property.title} 
            className="property-image"
          />
          <div className="property-title-overlay">
            <h3>{property.title}</h3>
            <p>{property.location}</p>
          </div>
        </div>
        
        {/* Property Details */}
        <div className="property-details">
          <div className="property-info-grid">
            <div className="info-item">
              <span className="info-label">Zoning</span>
              <span className="info-value">{property.zoning}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Title Status</span>
              <span className="info-value">{property.titleStatus}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tokens Owned</span>
              <span className="info-value">{property.tokensOwned} / {property.totalTokens}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ownership</span>
              <span className="info-value">{ownershipPercentage.toFixed(2)}%</span>
            </div>
          </div>
          
          {/* Financial Details */}
          <div className="financial-details">
            <div className="financial-item">
              <span className="financial-label">Purchase Price</span>
              <span className="financial-value">{formatCurrency(property.purchasePrice)}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Projected Value</span>
              <span className="financial-value">{formatCurrency(property.projectedValue)}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Time Held</span>
              <span className="financial-value">{property.timeHeld}</span>
            </div>
          </div>
          
          {/* Score Indicators */}
          <div className="score-indicators">
            <div className="score-item">
              <span className="score-label">Liquidity</span>
              <div 
                className="score-value" 
                style={{ backgroundColor: getScoreColor(property.liquidityScore) }}
              >
                {property.liquidityScore}
              </div>
            </div>
            <div className="score-item">
              <span className="score-label">Growth Potential</span>
              <div 
                className="score-value" 
                style={{ backgroundColor: getScoreColor(property.growthPotential) }}
              >
                {property.growthPotential}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="action-button view-docs-btn" onClick={handleViewDocuments}>
              <span className="button-icon">📄</span>
              View Documents
            </button>
            <button className="action-button view-map-btn" onClick={handleViewMap}>
              <span className="button-icon">🗺️</span>
              View Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;