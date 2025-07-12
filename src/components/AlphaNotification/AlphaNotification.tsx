import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { X, AlertTriangle, TestTube } from 'lucide-react';

interface AlphaNotificationProps {
  className?: string;
}

export const AlphaNotification: React.FC<AlphaNotificationProps> = ({ className = '' }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has dismissed this notification before
    const dismissed = localStorage.getItem('alpha-notification-dismissed');
    return !dismissed;
  });

  // Don't show on service landing pages (marketing pages)
  const isLandingPage = location.pathname.startsWith('/services/');
  
  const handleDismiss = () => {
    setIsVisible(false);
    // Remember that user dismissed this notification
    localStorage.setItem('alpha-notification-dismissed', 'true');
  };

  // Don't show if dismissed or on landing pages
  if (!isVisible || isLandingPage) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#FEC85F] to-yellow-400 text-[#1B1828] border-b border-yellow-500 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <TestTube className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-sm sm:text-base">
                🚧 Alpha Testing Phase
              </span>
              <span className="hidden sm:inline text-sm ml-2">
                - This is a test environment. All payments are disabled. Your feedback helps us improve!
              </span>
              <div className="sm:hidden text-xs mt-1">
                Test environment - Payments disabled
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-[#1B1828] hover:bg-black/10 p-2 h-auto flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Alternative persistent version that always shows (except on landing pages)
export const AlphaNotificationPersistent: React.FC<AlphaNotificationProps> = ({ className = '' }) => {
  const location = useLocation();
  
  // Don't show on service landing pages (marketing pages)
  const isLandingPage = location.pathname.startsWith('/services/');
  
  if (isLandingPage) return null;

  return (
    <div className={`bg-gradient-to-r from-orange-500 to-red-500 text-white border-b border-red-600 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-sm">
            ⚠️ ALPHA TEST - Payments Disabled - For Testing Only
          </span>
        </div>
      </div>
    </div>
  );
};