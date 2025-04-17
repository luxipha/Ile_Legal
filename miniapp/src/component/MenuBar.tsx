import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import IleLogo from './IleLogo';
import AlphaModal from './AlphaModal';
import Points from './Points';

const MenuBar: React.FC = () => {
  const [isAlphaModalOpen, setIsAlphaModalOpen] = useState(false);

  const handleAlphaClick = () => {
    setIsAlphaModalOpen(true);
  };

  const handleNotificationClick = () => {
    WebApp.showAlert("Notifications coming soon!");
  };

  return (
    <div className="bg-primary border-b border-gray-800 mb-4">
      <div className="flex justify-between items-center p-2">
        {/* Left side - Logo and tokens */}
        <div className="flex items-center gap-3">
          <IleLogo />

          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-lime-300 rounded-full flex items-center justify-center transform rotate-12">
              <div className="w-3 h-3 bg-lime-500 rounded-full"></div>
            </div>
            <span className="text-text-primary font-medium">1</span>
          </div>

          <Points value={2} />
        </div>

        {/* Right side - Alpha and Bell */}
        <div className="flex items-center gap-1">
          <button
            className="bg-primary/70 text-text-primary border border-accent/30 px-2 py-1 rounded-full text-sm hover:bg-accent/10 transition-colors mr-1"
            onClick={handleAlphaClick}
          >
            Alpha
          </button>
          <button 
            className="text-accent hover:text-accent/80 transition-colors p-1"
            onClick={handleNotificationClick}
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Alpha Modal */}
      <AlphaModal 
        isOpen={isAlphaModalOpen} 
        onClose={() => setIsAlphaModalOpen(false)} 
      />
    </div>
  );
};

export default MenuBar;
