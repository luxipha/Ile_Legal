import React from 'react';
import { MapPin, TrendingUp } from 'lucide-react';

// Define the property data structure
export interface Property {
  id: string;
  title: string;
  location: string;
  purchasePrice: number;
  currentValue: number;
  growthPercentage: number;
  tokensOwned: number;
  totalTokens: number;
  ownershipPercentage: number;
  imageUrl: string;
  propertyType: string;
  // Keep these fields for backward compatibility
  zoning?: string;
  titleStatus?: string;
  projectedValue?: number;
  timeHeld?: string;
  liquidityScore?: 'Low' | 'Medium' | 'High';
  growthPotential?: 'Low' | 'Medium' | 'High';
}

// Props interface for the PropertyCard component
interface PropertyCardProps {
  property: Property;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  }
  return `₦${(amount / 1000).toFixed(0)}K`;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  // Calculate token ownership percentage if not provided
  const ownershipPercentage = property.ownershipPercentage || 
    (property.tokensOwned / property.totalTokens) * 100;
  
  return (
    <div className="flex overflow-hidden rounded-xl border border-accent/30 bg-primary/80 mb-3 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:border-accent/50">
      {/* Property Image with Type Badge */}
      <div 
        className="relative w-24 bg-cover bg-center"
        style={{ backgroundImage: `url(${property.imageUrl})` }}
      >
        <div className="absolute top-2 left-2 bg-primary/80 text-accent text-xs font-semibold py-0.5 px-2 rounded border border-accent/30">
          {property.propertyType || property.zoning}
        </div>
      </div>

      {/* Property Details */}
      <div className="flex-1 p-3">
        {/* Property Title and Growth */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-sm text-text-primary line-clamp-1">
              {property.title.length > 15 ? property.title.substring(0, 15) + '...' : property.title}
            </h3>
            <div className="flex items-center text-text-secondary text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {property.location}
            </div>
          </div>
          <div className="flex items-center text-success text-xs font-medium">
            <TrendingUp className="h-3 w-3 mr-1" />+{property.growthPercentage}%
          </div>
        </div>

        {/* Property Value and Ownership */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          <div className="flex items-center">
            <span className="text-xs text-text-secondary mr-1">Value:</span>
            <span className="text-xs font-semibold text-text-primary">
              {formatCurrency(property.currentValue || property.projectedValue || property.purchasePrice)}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-text-secondary mr-1">Owned:</span>
            <span className="text-xs font-semibold text-text-primary">{ownershipPercentage.toFixed(2)}%</span>
          </div>
        </div>

        {/* Ownership Progress Bar */}
        <div className="mt-2">
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent/80"
              style={{ width: `${ownershipPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-text-muted">{property.tokensOwned} tokens</span>
            <span className="text-[10px] text-text-muted">of {property.totalTokens}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;