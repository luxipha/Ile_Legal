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
      className={`ile-logo ${className}`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        borderRadius: '50%',
        background: '#FDD15F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
        animation: 'pulse 2s infinite',
      }}
    >
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
          }
        }
      `}</style>
      <img 
        src="/logo.png" 
        alt="Ile Logo" 
        style={{
          width: '400%',
          objectFit: 'contain',
          transform: 'scale(1.2)',
        }}
      />
    </div>
  );
};

export default IleLogo;