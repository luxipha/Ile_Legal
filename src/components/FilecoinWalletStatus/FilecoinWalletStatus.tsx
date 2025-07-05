/**
 * Phase 4.5: Filecoin Wallet Status Component
 * 
 * Displays Filecoin wallet connection status and USDFC balance
 * Shows network status and storage capabilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FilmIcon, CoinsIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon } from 'lucide-react';
import { getUserWalletData } from '../../services/unifiedWalletService';
import { useAuth } from '../../contexts/AuthContext';

interface FilecoinWalletState {
  isConnected: boolean;
  address: string | null;
  usdfcBalance: string;
  network: string;
  loading: boolean;
  error: string | null;
}

export const FilecoinWalletStatus: React.FC = () => {
  const { user } = useAuth();
  const [walletState, setWalletState] = useState<FilecoinWalletState>({
    isConnected: false,
    address: null,
    usdfcBalance: '0.00',
    network: 'calibration',
    loading: false,
    error: null
  });

  useEffect(() => {
    if (user?.id) {
      loadFilecoinWalletStatus();
    }
  }, [user?.id]);

  const loadFilecoinWalletStatus = async () => {
    if (!user?.id) return;

    setWalletState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const walletData = await getUserWalletData(user.id);
      
      setWalletState(prev => ({
        ...prev,
        isConnected: walletData.hasFilecoinWallet,
        address: walletData.filecoinAddress || null,
        usdfcBalance: walletData.usdfcBalance || '0.00',
        loading: false
      }));
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load wallet status',
        loading: false
      }));
    }
  };

  const formatAddress = (address: string | null): string => {
    if (!address) return 'Not connected';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FilmIcon className="w-5 h-5 text-purple-600" />
          Filecoin Wallet Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {walletState.isConnected ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">
              {walletState.isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFilecoinWalletStatus}
            disabled={walletState.loading}
            className="flex items-center gap-1"
          >
            <RefreshCwIcon className={`w-3 h-3 ${walletState.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Wallet Address */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Filecoin Address:</div>
          <div className="p-2 bg-purple-50 rounded border text-sm font-mono">
            {formatAddress(walletState.address)}
          </div>
        </div>

        {/* USDFC Balance */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CoinsIcon className="w-5 h-5 text-purple-600" />
            <span className="font-medium">USDFC Balance</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-800">
              ${parseFloat(walletState.usdfcBalance).toFixed(6)}
            </div>
            <div className="text-xs text-purple-600">USD Coin on Filecoin</div>
          </div>
        </div>

        {/* Network Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Network:</span>
          <span className="font-medium capitalize bg-purple-100 px-2 py-1 rounded text-purple-800">
            {walletState.network}
          </span>
        </div>

        {/* Error Display */}
        {walletState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium">Connection Error</div>
            <div className="text-red-700 text-sm mt-1">{walletState.error}</div>
          </div>
        )}

        {/* Storage Capabilities */}
        {walletState.isConnected && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Storage Features:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                <span>FVM Contracts</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                <span>Deal Storage</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                <span>USDFC Payments</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                <span>Proof Verification</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};