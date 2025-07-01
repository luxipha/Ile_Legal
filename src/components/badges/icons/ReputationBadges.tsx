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

// Novice Badge (0-24 points)
export const NoviceBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="noviceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B7355" />
          <stop offset="100%" stopColor="#6B5B47" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#noviceGrad)" stroke="#6B5B47" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,20 56,36 74,36 60,48 66,64 50,52 34,64 40,48 26,36 44,36" fill="#F4E4BC" stroke="#8B7355" strokeWidth="1"/>
      <text x="50" y="90" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">NOVICE</text>
    </svg>
  );
};

// Competent Badge (25-49 points)
export const CompetentBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="competentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#A0A0A0" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#competentGrad)" stroke="#A0A0A0" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,20 56,36 74,36 60,48 66,64 50,52 34,64 40,48 26,36 44,36" fill="#F0F0F0" stroke="#C0C0C0" strokeWidth="1"/>
      <polygon points="50,25 54,33 63,33 56,39 59,47 50,42 41,47 44,39 37,33 46,33" fill="#E0E0E0"/>
      <text x="50" y="90" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">COMPETENT</text>
    </svg>
  );
};

// Proficient Badge (50-74 points)
export const ProficientBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="proficientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#proficientGrad)" stroke="#B8860B" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,20 56,36 74,36 60,48 66,64 50,52 34,64 40,48 26,36 44,36" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
      <polygon points="50,25 54,33 63,33 56,39 59,47 50,42 41,47 44,39 37,33 46,33" fill="#FFA500"/>
      <circle cx="50" cy="40" r="3" fill="#FFD700"/>
      <text x="50" y="90" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">PROFICIENT</text>
    </svg>
  );
};

// Expert Badge (75-89 points)
export const ExpertBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="expertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#4A90E2" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#expertGrad)" stroke="#4A90E2" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,18 58,34 76,34 62,46 70,62 50,50 30,62 38,46 24,34 42,34" fill="#87CEEB" stroke="#4A90E2" strokeWidth="1"/>
      <polygon points="50,23 55,31 64,31 58,36 61,44 50,39 39,44 42,36 36,31 45,31" fill="#B0E0E6"/>
      <circle cx="50" cy="38" r="2" fill="#4A90E2"/>
      <rect x="48" y="45" width="4" height="8" fill="#4A90E2" rx="2"/>
      <text x="50" y="90" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">EXPERT</text>
    </svg>
  );
};

// Master Badge (90-100 points)
export const MasterBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="masterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DDA0DD" />
          <stop offset="50%" stopColor="#8A2BE2" />
          <stop offset="100%" stopColor="#DDA0DD" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#masterGrad)" stroke="#8A2BE2" strokeWidth="3" filter="url(#dropShadow)"/>
      <polygon points="50,15 60,32 79,32 64,45 74,62 50,49 26,62 36,45 21,32 40,32" fill="#DDA0DD" stroke="#8A2BE2" strokeWidth="1"/>
      <polygon points="50,20 56,30 67,30 59,36 63,46 50,40 37,46 41,36 33,30 44,30" fill="#E6E6FA"/>
      <circle cx="50" cy="35" r="2" fill="#8A2BE2"/>
      <polygon points="50,40 52,44 56,44 53,47 54,51 50,49 46,51 47,47 44,44 48,44" fill="#8A2BE2"/>
      <text x="50" y="90" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">MASTER</text>
    </svg>
  );
};