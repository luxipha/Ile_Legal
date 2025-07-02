import React from 'react';

interface BadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getBadgeSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return { width: 32, height: 32, fontSize: '6px' };
    case 'md': return { width: 48, height: 48, fontSize: '8px' };
    case 'lg': return { width: 64, height: 64, fontSize: '10px' };
    default: return { width: 48, height: 48, fontSize: '8px' };
  }
};

// Active User Badge - Regular platform engagement
export const LoyaltyActiveBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loyaltyActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="loyaltyDropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#loyaltyActiveGrad)" stroke="#059669" strokeWidth="3" filter="url(#loyaltyDropShadow)"/>
      {/* Activity pulse icon */}
      <circle cx="30" cy="40" r="3" fill="white"/>
      <circle cx="40" cy="35" r="3" fill="white"/>
      <circle cx="50" cy="45" r="3" fill="white"/>
      <circle cx="60" cy="30" r="3" fill="white"/>
      <circle cx="70" cy="40" r="3" fill="white"/>
      {/* Connection lines */}
      <path d="M30 40 L40 35 L50 45 L60 30 L70 40" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <text x="50" y="68" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">ACTIVE</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#059669">USER</text>
    </svg>
  );
};

// Bricks Collector Badge - 100+ Bricks points
export const LoyaltyMilestoneBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loyaltyMilestoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <filter id="loyaltyDropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#loyaltyMilestoneGrad)" stroke="#D97706" strokeWidth="3" filter="url(#loyaltyDropShadow)"/>
      {/* Brick stack icon */}
      <rect x="25" y="50" width="12" height="6" rx="1" fill="white" stroke="#D97706" strokeWidth="1"/>
      <rect x="40" y="50" width="12" height="6" rx="1" fill="white" stroke="#D97706" strokeWidth="1"/>
      <rect x="55" y="50" width="12" height="6" rx="1" fill="white" stroke="#D97706" strokeWidth="1"/>
      <rect x="30" y="42" width="12" height="6" rx="1" fill="white" stroke="#D97706" strokeWidth="1"/>
      <rect x="50" y="42" width="12" height="6" rx="1" fill="white" stroke="#D97706" strokeWidth="1"/>
      <rect x="40" y="34" width="12" height="6" rx="1" fill="white" stroke="#D97706" strokeWidth="1"/>
      <text x="50" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">BRICKS</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#D97706">COLLECTOR</text>
    </svg>
  );
};

// Streak Master Badge - 7+ consecutive days
export const LoyaltyStreakBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loyaltyStreakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <filter id="loyaltyDropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#loyaltyStreakGrad)" stroke="#DC2626" strokeWidth="3" filter="url(#loyaltyDropShadow)"/>
      {/* Fire/flame icon */}
      <path d="M50 25 C55 35, 45 40, 50 45 C60 35, 55 50, 50 55 C45 45, 55 40, 50 35 C40 45, 45 30, 50 25 Z" fill="white"/>
      <path d="M45 50 C50 45, 55 50, 50 55 C52 52, 48 52, 45 50 Z" fill="#FFE4B5"/>
      <text x="50" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white">STREAK</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#DC2626">MASTER</text>
    </svg>
  );
};

// Platform Enthusiast Badge - High engagement
export const LoyaltyEngagementBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loyaltyEngagementGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="loyaltyDropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#loyaltyEngagementGrad)" stroke="#7C3AED" strokeWidth="3" filter="url(#loyaltyDropShadow)"/>
      {/* Heart icon */}
      <path d="M50 30 C45 20, 30 20, 30 35 C30 50, 50 65, 50 65 C50 65, 70 50, 70 35 C70 20, 55 20, 50 30 Z" fill="white"/>
      <circle cx="42" cy="33" r="2" fill="#FFE4E1"/>
      <text x="50" y="75" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white">PLATFORM</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#7C3AED">ENTHUSIAST</text>
    </svg>
  );
};

// Export all loyalty badges
export const LoyaltyBadges = {
  loyalty_active: LoyaltyActiveBadge,
  loyalty_milestone: LoyaltyMilestoneBadge,
  loyalty_streak: LoyaltyStreakBadge,
  loyalty_engagement: LoyaltyEngagementBadge,
};