import React from 'react';
import MenuBar from '../component/MenuBar';
import BottomNavigation from '../component/BottomNavigation';
import FinancialDashboard from "../component/FinancialDashboard";
import { Flame } from 'lucide-react'; // Update import

const Fire: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-primary text-text-primary">
      {/* Menu Bar */}
      <MenuBar />
      
      <div className="px-4 pb-20 w-full mx-auto">
        {/* Header Title with brand styling */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <span>F.I.R.E</span>
          </h1>
          <p className="text-sm text-text-secondary">
            Financial Independence, Retire Early - Plan your path to financial freedom
          </p>
        </div>
        
        <FinancialDashboard />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Fire;
