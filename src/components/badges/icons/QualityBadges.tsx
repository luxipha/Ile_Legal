import React from 'react';

interface BadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getBadgeSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return { width: 32, height: 32, fontSize: '5px' };
    case 'md': return { width: 48, height: 48, fontSize: '7px' };
    case 'lg': return { width: 64, height: 64, fontSize: '9px' };
    default: return { width: 48, height: 48, fontSize: '7px' };
  }
};

// 5-Star Streak Badge
export const FiveStarStreakBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA500" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#streakGrad)" stroke="#FFD700" strokeWidth="3" filter="url(#dropShadow)"/>
      <g filter="url(#glow)">
        <polygon points="30,35 33,42 41,42 35,47 37,54 30,50 23,54 25,47 19,42 27,42" fill="white"/>
        <polygon points="40,30 43,37 51,37 45,42 47,49 40,45 33,49 35,42 29,37 37,37" fill="white"/>
        <polygon points="50,25 53,32 61,32 55,37 57,44 50,40 43,44 45,37 39,32 47,32" fill="white"/>
        <polygon points="60,30 63,37 71,37 65,42 67,49 60,45 53,49 55,42 49,37 57,37" fill="white"/>
        <polygon points="70,35 73,42 81,42 75,47 77,54 70,50 63,54 65,47 59,42 67,42" fill="white"/>
      </g>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">5-STAR STREAK</text>
    </svg>
  );
};

// Client Favorite Badge
export const ClientFavoriteBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="favoriteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF69B4" />
          <stop offset="100%" stopColor="#FF6B6B" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#favoriteGrad)" stroke="#FF6B6B" strokeWidth="3" filter="url(#dropShadow)"/>
      <path d="M50,65 C40,55 25,40 25,30 C25,25 30,20 37,20 C42,20 47,23 50,28 C53,23 58,20 63,20 C70,20 75,25 75,30 C75,40 60,55 50,65 Z" fill="white"/>
      <circle cx="50" cy="75" r="8" fill="white" fillOpacity="0.9"/>
      <text x="50" y="79" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="#FF6B6B">4.8</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">CLIENT FAVORITE</text>
    </svg>
  );
};

// Quick Responder Badge
export const QuickResponderBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="quickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#26A69A" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#quickGrad)" stroke="#4ECDC4" strokeWidth="3" filter="url(#dropShadow)"/>
      <path d="M45,25 L35,45 L45,45 L40,75 L65,45 L55,45 L60,25 Z" fill="white"/>
      <circle cx="65" cy="35" r="6" fill="white" fillOpacity="0.9"/>
      <line x1="65" y1="35" x2="65" y2="32" stroke="#4ECDC4" strokeWidth="1"/>
      <line x1="65" y1="35" x2="67" y2="35" stroke="#4ECDC4" strokeWidth="1"/>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">QUICK RESPONDER</text>
    </svg>
  );
};

// Perfectionist Badge
export const PerfectionistBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="perfectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9B59B6" />
          <stop offset="100%" stopColor="#8E44AD" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#perfectGrad)" stroke="#9B59B6" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,25 60,40 50,55 40,40" fill="white"/>
      <polygon points="50,30 55,38 50,46 45,38" fill="#9B59B6" fillOpacity="0.3"/>
      <g opacity="0.8">
        <polygon points="35,30 37,34 42,34 38,37 40,42 35,39 30,42 32,37 28,34 33,34" fill="white" transform="scale(0.6) translate(10,10)"/>
        <polygon points="65,30 67,34 72,34 68,37 70,42 65,39 60,42 62,37 58,34 63,34" fill="white" transform="scale(0.6) translate(30,10)"/>
        <polygon points="35,70 37,74 42,74 38,77 40,82 35,79 30,82 32,77 28,74 33,74" fill="white" transform="scale(0.6) translate(10,50)"/>
        <polygon points="65,70 67,74 72,74 68,77 70,82 65,79 60,82 62,77 58,74 63,74" fill="white" transform="scale(0.6) translate(30,50)"/>
      </g>
      <circle cx="50" cy="65" r="6" fill="white" fillOpacity="0.9"/>
      <text x="50" y="69" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="#9B59B6">10</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">PERFECTIONIST</text>
    </svg>
  );
};