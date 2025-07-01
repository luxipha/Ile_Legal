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

// First Gig Complete Badge
export const FirstGigBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="firstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#28A745" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#firstGrad)" stroke="#28A745" strokeWidth="3" filter="url(#dropShadow)"/>
      <path d="M30 35 L45 50 L70 25" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <circle cx="50" cy="60" r="8" fill="white" fillOpacity="0.3"/>
      <text x="50" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#28A745">1</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">FIRST GIG</text>
    </svg>
  );
};

// 5 Gigs Complete Badge
export const FiveGigsBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#20B2AA" />
          <stop offset="100%" stopColor="#17A2B8" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#fiveGrad)" stroke="#17A2B8" strokeWidth="3" filter="url(#dropShadow)"/>
      <rect x="40" y="30" width="20" height="25" fill="white" rx="2"/>
      <line x1="35" y1="40" x2="65" y2="40" stroke="#17A2B8" strokeWidth="2"/>
      <line x1="35" y1="45" x2="65" y2="45" stroke="#17A2B8" strokeWidth="2"/>
      <circle cx="50" cy="65" r="8" fill="white" fillOpacity="0.3"/>
      <text x="50" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#17A2B8">5</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">5 GIGS</text>
    </svg>
  );
};

// 10 Gigs Complete Badge
export const TenGigsBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#tenGrad)" stroke="#FFC107" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,25 55,40 70,40 58,50 63,65 50,57 37,65 42,50 30,40 45,40" fill="white"/>
      <circle cx="50" cy="65" r="8" fill="white" fillOpacity="0.3"/>
      <text x="50" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#FFC107">10</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">10 GIGS</text>
    </svg>
  );
};

// 25 Gigs Complete Badge
export const TwentyFiveGigsBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="twentyFiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8C42" />
          <stop offset="100%" stopColor="#FD7E14" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#twentyFiveGrad)" stroke="#FD7E14" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,20 58,35 75,35 62,47 69,62 50,52 31,62 38,47 25,35 42,35" fill="white"/>
      <polygon points="50,25 54,32 61,32 57,36 59,43 50,39 41,43 43,36 39,32 46,32" fill="#FD7E14"/>
      <circle cx="50" cy="65" r="8" fill="white" fillOpacity="0.3"/>
      <text x="50" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="#FD7E14">25</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">25 GIGS</text>
    </svg>
  );
};

// 50 Gigs Complete Badge
export const FiftyGigsBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fiftyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E74C3C" />
          <stop offset="100%" stopColor="#DC3545" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#fiftyGrad)" stroke="#DC3545" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,18 60,32 77,32 64,44 74,60 50,48 26,60 36,44 23,32 40,32" fill="white"/>
      <polygon points="50,23 56,30 63,30 59,34 61,41 50,37 39,41 41,34 37,30 44,30" fill="#DC3545"/>
      <circle cx="42" cy="40" r="2" fill="white"/>
      <circle cx="58" cy="40" r="2" fill="white"/>
      <circle cx="50" cy="65" r="8" fill="white" fillOpacity="0.3"/>
      <text x="50" y="70" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="#DC3545">50</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">50 GIGS</text>
    </svg>
  );
};

// 100 Gigs Complete Badge
export const HundredGigsBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hundredGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6F42C1" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#hundredGrad)" stroke="#6F42C1" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,15 62,28 77,28 66,40 77,55 62,47 50,60 38,47 23,55 34,40 23,28 38,28" fill="white"/>
      <polygon points="50,20 58,26 65,26 61,30 63,37 50,33 37,37 39,30 35,26 42,26" fill="#6F42C1"/>
      <circle cx="44" cy="35" r="1.5" fill="white"/>
      <circle cx="56" cy="35" r="1.5" fill="white"/>
      <circle cx="50" cy="42" r="1.5" fill="white"/>
      <circle cx="50" cy="65" r="8" fill="white" fillOpacity="0.3"/>
      <text x="50" y="67" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="bold" fill="#6F42C1">100</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">100 GIGS</text>
    </svg>
  );
};