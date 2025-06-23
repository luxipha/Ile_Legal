import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

interface LoadingTextProps {
  message: string;
  className?: string;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standardized loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  };

  const paddingClasses = {
    small: 'py-4',
    medium: 'py-6',
    large: 'py-8'
  };

  return (
    <div className={`text-center ${paddingClasses[size]} ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-[#1B1828] mx-auto mb-4 ${sizeClasses[size]}`}></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

/**
 * Simple loading text (for inline loading states)
 */
export const LoadingText: React.FC<LoadingTextProps> = ({ 
  message, 
  className = '' 
}) => {
  return (
    <div className={`text-gray-500 ${className}`}>
      {message}
    </div>
  );
};

/**
 * Standardized empty state component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && action}
    </div>
  );
};

/**
 * Skeleton loader for card-like content
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for list items
 */
export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};