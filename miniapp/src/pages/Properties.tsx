import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropertyCard, { Property } from '../component/PropertyCard';
import MenuBar from '../component/MenuBar';
import DashboardHeader from '../component/DashboardHeader';
import BottomNavigation from '../component/BottomNavigation';

// Sample property data
const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Ido-Ketu Residential Plot',
    location: 'Ketu, Lagos',
    propertyType: 'Residential',
    zoning: 'Residential',
    titleStatus: 'C of O',
    tokensOwned: 15,
    totalTokens: 2000,
    ownershipPercentage: 0.75,
    purchasePrice: 2000000,
    currentValue: 2100000,
    projectedValue: 2100000,
    growthPercentage: 5,
    timeHeld: '1 year, 3 months',
    liquidityScore: 'High',
    growthPotential: 'Medium',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  },
  {
    id: '2',
    title: 'Lekki Phase 1 Commercial Plot',
    location: 'Lekki, Lagos',
    propertyType: 'Commercial',
    zoning: 'Commercial',
    titleStatus: 'Governor\'s Consent',
    tokensOwned: 250,
    totalTokens: 5000,
    ownershipPercentage: 5,
    purchasePrice: 15000000,
    currentValue: 16500000,
    projectedValue: 16500000,
    growthPercentage: 10,
    timeHeld: '8 months',
    liquidityScore: 'Medium',
    growthPotential: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1577415124269-fc1140a69e91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80',
  },
  {
    id: '3',
    title: 'Ikoyi Waterfront Land',
    location: 'Ikoyi, Lagos',
    propertyType: 'Mixed-Use',
    zoning: 'Mixed-Use',
    titleStatus: 'C of O',
    tokensOwned: 120,
    totalTokens: 3000,
    ownershipPercentage: 4,
    purchasePrice: 8500000,
    currentValue: 9350000,
    projectedValue: 9350000,
    growthPercentage: 10,
    timeHeld: '2 years, 1 month',
    liquidityScore: 'Medium',
    growthPotential: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  }
];

const Properties: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-primary text-text-primary">
      <MenuBar />
      
      <div className="px-4 pb-20 max-w-[328px] mx-auto">
        <DashboardHeader />
        
        {/* Properties Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Your Properties</h2>
          <button 
            onClick={() => navigate('/holdings')}
            className="text-accent text-sm hover:text-accent/80 transition-colors"
          >
            View all
          </button>
        </div>

        {/* Properties Grid */}
        <div className="space-y-4">
          {sampleProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Properties;