import React from 'react';

interface DocumentPreviewProps {
  file: File;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ 
  file, 
  className = '',
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  const iconSize = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  const getFileIcon = (fileType: string) => {
    // Since we only support PDFs, always return PDF icon
    return '📄';
  };

  const createPreviewUrl = () => {
    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Failed to create preview URL:', error);
      return null;
    }
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 ${className}`}>
      {/* Since we only support PDFs, always show PDF icon with enhanced styling */}
      <div className="w-full h-full bg-red-50 border-2 border-red-200 rounded border shadow-sm flex flex-col items-center justify-center">
        <span className={`${iconSize[size]} text-red-600`}>📄</span>
        {size !== 'small' && (
          <span className="text-xs text-red-500 font-medium mt-1">PDF</span>
        )}
      </div>
    </div>
  );
};