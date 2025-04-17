import React from 'react';
import { Coins, TrendingUp, Building, Ticket } from 'lucide-react';

interface DashboardHeaderProps {
  totalInvested?: string;
  overallGrowth?: string;
  growthAmount?: string;
  propertiesCount?: number;
  tokensOwned?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  totalInvested = "₦25.5M",
  overallGrowth = "+8.7%",
  growthAmount = "+₦2.2M",
  propertiesCount = 3,
  tokensOwned = 385,
}) => {
  return (
    <div className="space-y-3 mb-4">
      {/* Header Title */}
      <div className="px-2">
        <h1 className="text-base font-bold text-text-primary">
          My <span className="text-accent">Property</span> Investments
        </h1>
        <p className="text-xs text-text-secondary">Track your tokenized land investments</p>
      </div>

      {/* Stats Overview - Single Card */}
      <div className="px-2">
        <div className="bg-primary/80 rounded-lg border border-gray-800 p-3">
          <div className="grid grid-cols-2 gap-y-3">
            {/* Total Invested */}
            <div className="flex items-start gap-2">
              <Coins className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <div className="text-xs text-text-secondary">Total Invested</div>
                <div className="text-sm font-bold text-text-primary">{totalInvested}</div>
              </div>
            </div>

            {/* Overall Growth */}
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <div className="text-xs text-text-secondary">Overall Growth</div>
                <div className="text-sm font-bold text-success">{overallGrowth}</div>
                <div className="text-xs text-success">{growthAmount}</div>
              </div>
            </div>

            {/* Properties */}
            <div className="flex items-start gap-2">
              <Building className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <div className="text-xs text-text-secondary">Properties</div>
                <div className="text-sm font-bold text-text-primary">{propertiesCount}</div>
              </div>
            </div>

            {/* Tokens Owned */}
            <div className="flex items-start gap-2">
              <Ticket className="h-4 w-4 text-accent mt-0.5" />
              <div>
                <div className="text-xs text-text-secondary">Tokens Owned</div>
                <div className="text-sm font-bold text-text-primary">{tokensOwned}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
