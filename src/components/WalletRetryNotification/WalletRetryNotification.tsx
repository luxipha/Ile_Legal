import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, CheckCircle, X } from 'lucide-react';
import { walletRetryService } from '../../services/walletRetryService';
import { useAuth } from '../../contexts/AuthContext';

interface WalletRetryNotificationProps {
  className?: string;
}

export const WalletRetryNotification: React.FC<WalletRetryNotificationProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [needsRetry, setNeedsRetry] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [retryMessage, setRetryMessage] = useState('');
  const [retrySuccess, setRetrySuccess] = useState(false);

  useEffect(() => {
    const checkWalletStatus = async () => {
      if (user?.id) {
        const needsRetry = await walletRetryService.userNeedsWalletRetry(user.id);
        setNeedsRetry(needsRetry);
      }
    };

    checkWalletStatus();
  }, [user?.id]);

  const handleRetry = async () => {
    if (!user?.id) return;

    setIsRetrying(true);
    setRetryMessage('');
    
    try {
      const result = await walletRetryService.retryWalletCreation(user.id);
      
      if (result.success) {
        setRetrySuccess(true);
        setRetryMessage(result.message);
        setNeedsRetry(false);
        
        // Auto-hide success notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      } else {
        setRetryMessage(result.message);
      }
    } catch (error) {
      setRetryMessage(`Failed to retry wallet creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!needsRetry || !showNotification) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {retrySuccess ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {retrySuccess ? 'Wallet Setup Complete!' : 'Wallet Setup Incomplete'}
          </h3>
          
          <div className="mt-2 text-sm text-yellow-700">
            {retrySuccess ? (
              <p>Your Circle wallet has been successfully created and linked to your account.</p>
            ) : (
              <>
                <p>
                  Your account was created successfully, but we weren't able to set up your Circle wallet for payments. 
                  This may have been due to a temporary service issue.
                </p>
                <p className="mt-1">
                  Click the button below to complete your wallet setup and enable payment functionality.
                </p>
              </>
            )}
            
            {retryMessage && (
              <p className={`mt-2 text-sm ${retrySuccess ? 'text-green-600' : 'text-red-600'}`}>
                {retryMessage}
              </p>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            {!retrySuccess && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Setting up wallet...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Complete Wallet Setup
                  </>
                )}
              </Button>
            )}
            
            <button
              onClick={handleDismiss}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
        
        <div className="ml-auto flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="bg-yellow-50 rounded-md p-1.5 text-yellow-400 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};