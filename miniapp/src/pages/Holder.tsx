import React from 'react';
import MenuBar from '../component/MenuBar';
import BottomNavigation from '../component/BottomNavigation';

const Holder: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-primary text-text-primary">
      <MenuBar />
      
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
        <img 
          src="/comingsoon.png" 
          alt="Coming Soon" 
          className="w-full h-full object-cover"
        />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Holder;