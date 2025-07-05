import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, AlertCircleIcon, RefreshCcwIcon, CopyIcon } from 'lucide-react';
import { getUserWalletData } from '../../services/unifiedWalletService';
import { useAuth } from '../../contexts/AuthContext';

interface WalletStatusNotificationProps {
  isEnabled: boolean;
  walletBalance?: string;
}

export const WalletStatusNotification: React.FC<WalletStatusNotificationProps> = ({
  isEnabled,
  walletBalance: propWalletBalance
}) => {
  const { user } = useAuth();
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWalletInfo = async () => {
    if (!user?.id || !isEnabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 [WalletNotification] Loading wallet data for user:', user.id);
      
      // Use the same service that works for payment pages
      const unifiedWalletData = await getUserWalletData(user.id);
      
      console.log('📊 [WalletNotification] Unified wallet data loaded:', {
        hasEth: unifiedWalletData.hasEthWallet,
        hasCircle: unifiedWalletData.hasCircleWallet,
        balance: unifiedWalletData.balance,
        currency: unifiedWalletData.currency
      });
      
      if (!unifiedWalletData.hasEthWallet && !unifiedWalletData.hasCircleWallet) {
        console.log('⚠️  [WalletNotification] No wallets found for user');
        setError('No wallet found');
        return;
      }
      
      // Convert unified wallet data to notification format
      setWalletInfo({
        walletId: unifiedWalletData.circleWalletId || unifiedWalletData.ethAddress || 'unknown',
        address: unifiedWalletData.ethAddress || unifiedWalletData.circleWalletAddress || '',
        status: 'connected',
        balances: [
          { currency: unifiedWalletData.currency, amount: unifiedWalletData.balance }
        ],
        type: unifiedWalletData.hasEthWallet ? 'ethereum' : 'circle'
      });
      
      console.log('✅ [WalletNotification] Wallet info loaded successfully');
    } catch (err) {
      console.error('Error loading wallet info:', err);
      setError('Wallet is being created...');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEnabled && user?.id) {
      loadWalletInfo();
    }
  }, [isEnabled, user?.id]);

  const walletBalance = walletInfo?.balances?.[0]?.amount || propWalletBalance || '0.00';
  const walletCurrency = walletInfo?.balances?.[0]?.currency || 'USD';
  const walletType = walletInfo?.type || 'unknown';
  
  const copyWalletAddress = () => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address);
      // Could add a toast notification here
    }
  };
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className={`p-4 border-b ${isEnabled ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
        <h3 className="font-semibold text-gray-900">
          {isEnabled ? 'Wallet Address Available' : 'No Wallet Address'}
        </h3>
      </div>
      
      <div className="p-4">
        {isEnabled ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <p className="text-gray-600">
                {walletType === 'metamask' 
                  ? 'Your MetaMask wallet is connected.' 
                  : 'Your USDC wallet address was created during registration.'}
              </p>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg mb-3 border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Current Balance</p>
                <button
                  onClick={loadWalletInfo}
                  disabled={isLoading}
                  className="text-amber-600 hover:text-amber-700 disabled:opacity-50"
                >
                  <RefreshCcwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : (
                <p className="text-xl font-bold text-amber-700">
                  {walletCurrency === 'ETH' ? '' : '$'}{isLoading ? '...' : walletBalance} {walletCurrency}
                </p>
              )}
            </div>
            
            {walletInfo?.address && (
              <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Wallet Address</p>
                  <button
                    onClick={copyWalletAddress}
                    className="text-gray-600 hover:text-gray-700"
                    title="Copy address"
                  >
                    <CopyIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-700 break-all">
                  {walletInfo.address}
                </p>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Payments are automatically processed securely. No action needed.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircleIcon className="w-5 h-5 text-gray-500" />
              <p className="text-gray-600">
                No USDC wallet address found for your account.
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              Please contact support as USDC wallet addresses should be created during registration.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
