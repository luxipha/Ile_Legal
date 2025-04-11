import React from 'react';

interface IleLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const IleLogo: React.FC<IleLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { width: 40, height: 40 },
    md: { width: 56, height: 56 },
    lg: { width: 80, height: 80 },
  };

  const dimensions = sizeMap[size];

  return (
    <div 
      className={`logo-container ${className}`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--gold), var(--amber))',
        padding: '2px',
        boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
        animation: 'pulse 2s infinite'
      }}
    >
      <div 
        style={{
          width: '90%',
          height: '90%',
          borderRadius: '50%',
          background: 'var(--navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'lg' ? '24px' : size === 'md' ? '18px' : '14px',
          fontWeight: 'bold',
          color: 'var(--gold)'
        }}
      >
        ILE
      </div>
    </div>
  );
};

export default IleLogo;