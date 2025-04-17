import React from 'react';
import { BrickWall } from 'lucide-react';

interface PointsProps {
  value?: number | string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const Points: React.FC<PointsProps> = ({ 
  value, 
  size = 'md',
  showValue = true 
}) => {
  // Size mappings
  const sizeClasses = {
    sm: {
      container: 'w-4 h-4',
      icon: 'w-2.5 h-2.5',
      text: 'text-xs'
    },
    md: {
      container: 'w-5 h-5',
      icon: 'w-3 h-3',
      text: 'text-sm'
    },
    lg: {
      container: 'w-6 h-6',
      icon: 'w-4 h-4',
      text: 'text-base'
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`${sizeClasses[size].container} bg-[#FDD15F] rounded relative transform -rotate-6`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <BrickWall className={`${sizeClasses[size].icon} text-primary`} />
        </div>
      </div>
      {showValue && value !== undefined && (
        <span className={`text-text-primary font-medium ${sizeClasses[size].text}`}>{value}</span>
      )}
    </div>
  );
};

export default Points;