// components/ui/ErrorDisplay.tsx
import React from 'react';

interface ErrorDisplayProps {
  error: Error | string | null;
  className?: string;
  onRetry?: () => void;
}

/**
 * A reusable error display component with optional retry button
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  className = '',
  onRetry
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`p-4 rounded-md bg-red-50 border border-red-200 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-500" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            An error occurred
          </h3>
          <div className="mt-1 text-sm text-red-700">
            {errorMessage}
          </div>
          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
