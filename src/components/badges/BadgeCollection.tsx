import React from 'react';
import Badge, { EarnedBadge } from './Badge';

interface BadgeCollectionProps {
  badges: EarnedBadge[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const BadgeCollection: React.FC<BadgeCollectionProps> = ({ 
  badges, 
  maxVisible = 3, 
  size = 'md', 
  className = "",
  showTooltip = true 
}) => {
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {visibleBadges.map((badge, index) => (
        <Badge 
          key={badge.id} 
          badge={badge} 
          size={size} 
          showTooltip={showTooltip}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className="relative group">
          <div className={`
            flex items-center justify-center rounded-full bg-gray-100 border-2 border-gray-300 text-gray-600 font-semibold
            ${size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-sm' : 'w-12 h-12 text-xs'}
          `}>
            +{remainingCount}
          </div>
          
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              <div className="font-semibold">{remainingCount} more badge{remainingCount > 1 ? 's' : ''}</div>
              <div className="text-gray-300">View all badges in profile</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgeCollection;