// components/Messaging/UnreadMessageIndicator.tsx
import React from 'react';

interface UnreadMessageIndicatorProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

/**
 * A component that displays an unread message count badge
 * Used in conversation lists and message threads to indicate unread messages
 */
export const UnreadMessageIndicator: React.FC<UnreadMessageIndicatorProps> = ({
  count,
  className = '',
  showZero = false
}) => {
  // Don't render anything if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <div 
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 
        rounded-full text-xs font-medium text-white bg-blue-600 
        ${count === 0 ? 'bg-gray-400' : 'bg-blue-600'} 
        ${className}`}
      aria-label={`${count} unread message${count !== 1 ? 's' : ''}`}
    >
      {count}
    </div>
  );
};
