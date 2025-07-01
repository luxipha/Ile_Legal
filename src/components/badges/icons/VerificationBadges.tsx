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

// Identity Verified Badge
export const IdentityVerifiedBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="identityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#007BFF" />
          <stop offset="100%" stopColor="#0056b3" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#identityGrad)" stroke="#007BFF" strokeWidth="3" filter="url(#dropShadow)"/>
      <path d="M50,20 C60,20 68,25 68,35 L68,50 C68,65 59,75 50,80 C41,75 32,65 32,50 L32,35 C32,25 40,20 50,20 Z" fill="white"/>
      <path d="M50,25 C57,25 63,28 63,35 L63,48 C63,60 56,68 50,72 C44,68 37,60 37,48 L37,35 C37,28 43,25 50,25 Z" fill="url(#identityGrad)" fillOpacity="0.3"/>
      <path d="M42,45 L48,52 L58,38" stroke="#007BFF" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="42" y="58" width="16" height="12" fill="white" rx="1"/>
      <rect x="44" y="60" width="12" height="2" fill="#007BFF"/>
      <rect x="44" y="63" width="8" height="1" fill="#007BFF" fillOpacity="0.6"/>
      <rect x="44" y="65" width="6" height="1" fill="#007BFF" fillOpacity="0.6"/>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">IDENTITY VERIFIED</text>
    </svg>
  );
};

// Professional Credentials Verified Badge
export const ProfessionalCredentialsBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="credentialsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#28A745" />
          <stop offset="100%" stopColor="#1e7e34" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#credentialsGrad)" stroke="#28A745" strokeWidth="3" filter="url(#dropShadow)"/>
      <path d="M50,20 C60,20 68,25 68,35 L68,50 C68,65 59,75 50,80 C41,75 32,65 32,50 L32,35 C32,25 40,20 50,20 Z" fill="white"/>
      <path d="M50,25 C57,25 63,28 63,35 L63,48 C63,60 56,68 50,72 C44,68 37,60 37,48 L37,35 C37,28 43,25 50,25 Z" fill="url(#credentialsGrad)" fillOpacity="0.3"/>
      <rect x="42" y="40" width="16" height="3" fill="#28A745"/>
      <polygon points="50,35 45,40 55,40" fill="#28A745"/>
      <line x1="55" y1="37" x2="60" y2="35" stroke="#28A745" strokeWidth="1"/>
      <circle cx="60" cy="35" r="1" fill="#28A745"/>
      <rect x="40" y="55" width="20" height="15" fill="white" stroke="#28A745" strokeWidth="1"/>
      <line x1="43" y1="60" x2="57" y2="60" stroke="#28A745" strokeWidth="1"/>
      <line x1="43" y1="63" x2="54" y2="63" stroke="#28A745" strokeWidth="0.5"/>
      <line x1="43" y1="65" x2="52" y2="65" stroke="#28A745" strokeWidth="0.5"/>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">PROFESSIONAL</text>
    </svg>
  );
};

// Bar License Verified Badge
export const BarLicenseVerifiedBadge: React.FC<BadgeProps> = ({ className = "", size = 'md' }) => {
  const { width, height, fontSize } = getBadgeSize(size);
  
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6F42C1" />
          <stop offset="100%" stopColor="#5a2d91" />
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="url(#barGrad)" stroke="#6F42C1" strokeWidth="3" filter="url(#dropShadow)"/>
      <path d="M50,20 C60,20 68,25 68,35 L68,50 C68,65 59,75 50,80 C41,75 32,65 32,50 L32,35 C32,25 40,20 50,20 Z" fill="white"/>
      <path d="M50,25 C57,25 63,28 63,35 L63,48 C63,60 56,68 50,72 C44,68 37,60 37,48 L37,35 C37,28 43,25 50,25 Z" fill="url(#barGrad)" fillOpacity="0.3"/>
      <line x1="50" y1="32" x2="50" y2="52" stroke="#6F42C1" strokeWidth="2"/>
      <line x1="40" y1="38" x2="60" y2="38" stroke="#6F42C1" strokeWidth="2"/>
      <line x1="42" y1="38" x2="42" y2="42" stroke="#6F42C1" strokeWidth="1"/>
      <ellipse cx="42" cy="44" rx="4" ry="2" fill="none" stroke="#6F42C1" strokeWidth="1"/>
      <line x1="58" y1="38" x2="58" y2="42" stroke="#6F42C1" strokeWidth="1"/>
      <ellipse cx="58" cy="44" rx="4" ry="2" fill="none" stroke="#6F42C1" strokeWidth="1"/>
      <rect x="47" y="52" width="6" height="3" fill="#6F42C1"/>
      <rect x="40" y="58" width="20" height="12" fill="white" stroke="#6F42C1" strokeWidth="1"/>
      <text x="50" y="67" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="#6F42C1">BAR</text>
      <text x="50" y="88" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="bold" fill="#2c3e50">BAR LICENSE</text>
    </svg>
  );
};