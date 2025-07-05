/**
 * Phase 4: USDFC Payment Demo Component
 * 
 * Demo component to test USDFC on Filecoin payment integration
 * Shows both USDC and USDFC payment options using existing PaymentMethodModal
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { WalletIcon, CoinsIcon, FilmIcon } from 'lucide-react';
import { PaymentMethodModal } from '../PaymentMethodModal/PaymentMethodModal';
import { getUserWalletData, createMultichainWallet } from '../../services/unifiedWalletService';
import { paymentIntegrationService } from '../../services/paymentIntegrationService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface PaymentDemoState {
  walletData: any;
  loading: boolean;
  error: string | null;
  showPaymentModal: boolean;
  selectedDemoAmount: string;
  paymentResult: any;
}

export const USDFCPaymentDemo: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PaymentDemoState>({
    walletData: null,
    loading: false,
    error: null,
    showPaymentModal: false,
    selectedDemoAmount: '₦5,000',
    paymentResult: null
  });

  const debugId = `USDFC_DEMO_${Date.now()}`;

  // Load wallet data when component mounts
  useEffect(() => {
    if (user?.id) {
      loadWalletData();
    }
  }, [user?.id]);

  const createDemoFilecoinWallet = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      console.log(`🪙 [${debugId}] Creating demo Filecoin wallet...`);
      
      // Generate a demo Filecoin address (f1 format)
      const demoFilecoinAddress = `f1${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      await createMultichainWallet(
        user.id,
        'FILECOIN',
        demoFilecoinAddress,
        `filecoin-${user.id}-${Date.now()}`
      );

      // Also add some demo USDFC balance to the database
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          usdfc_balance: 100.50, // Demo balance
          balance_usdc: 0
        })
        .eq('user_id', user.id)
        .eq('blockchain', 'FILECOIN');

      if (updateError) {
        console.warn('Failed to update USDFC balance:', updateError);
      }

      console.log(`✅ [${debugId}] Demo Filecoin wallet created with address: ${demoFilecoinAddress}`);
    } catch (error) {
      console.error(`❌ [${debugId}] Failed to create demo Filecoin wallet:`, error);
      throw error;
    }
  };

  const loadWalletData = async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log(`🧪 [${debugId}] Loading wallet data for USDFC demo...`);
      let walletData = await getUserWalletData(user.id);
      
      // If no Filecoin wallet, create one automatically
      if (!walletData.hasFilecoinWallet) {
        console.log(`🪙 [${debugId}] No Filecoin wallet found, creating demo wallet...`);
        await createDemoFilecoinWallet();
        
        // Reload wallet data after creating Filecoin wallet
        walletData = await getUserWalletData(user.id);
      }
      
      console.log(`✅ [${debugId}] Wallet data loaded:`, {
        hasFilecoin: walletData.hasFilecoinWallet,
        usdcBalance: walletData.usdcBalance,
        usdfcBalance: walletData.usdfcBalance,
        supportedChains: walletData.supportedChains
      });

      setState(prev => ({
        ...prev,
        walletData,
        loading: false
      }));
    } catch (error) {
      console.error(`❌ [${debugId}] Failed to load wallet data:`, error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load wallet data',
        loading: false
      }));
    }
  };

  const handlePaymentMethodSelect = async (method: 'wallet' | 'paystack', details?: any) => {
    console.log(`💳 [${debugId}] Payment method selected:`, {
      method,
      details,
      selectedToken: details?.selectedToken,
      preferredChain: details?.preferredChain
    });

    if (method === 'wallet' && details) {
      try {
        setState(prev => ({ ...prev, loading: true }));

        // Create demo payment request
        const paymentRequest = {
          taskId: 999999, // Demo task ID
          amount: 5000, // ₦5,000
          currency: 'NGN',
          buyerId: user!.id,
          sellerId: 'demo-seller-id',
          method: 'wallet' as const,
          description: 'USDFC Payment Demo - Testing Phase 4 Integration',
          preferredToken: details.selectedToken,
          preferredChain: details.preferredChain
        };

        console.log(`🚀 [${debugId}] Processing demo payment:`, paymentRequest);
        
        // Note: In demo mode, we won't actually process the payment
        // Just simulate the flow and log the configuration
        const simulatedResult = {
          success: true,
          transactionId: `demo_${Date.now()}`,
          message: `Demo payment configured successfully with ${details.selectedToken} on ${details.preferredChain || 'optimal'} chain`,
          token: details.selectedToken,
          chain: details.preferredChain,
          walletAddress: details.walletAddress
        };

        setState(prev => ({
          ...prev,
          paymentResult: simulatedResult,
          loading: false
        }));

        console.log(`✅ [${debugId}] Demo payment simulation completed:`, simulatedResult);

      } catch (error) {
        console.error(`❌ [${debugId}] Demo payment failed:`, error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Demo payment failed',
          loading: false
        }));
      }
    }
  };

  const demoAmounts = ['₦1,000', '₦5,000', '₦10,000', '₦25,000'];

  if (!user) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Please log in to test USDFC payments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CoinsIcon className="w-6 h-6" />
            Phase 4: USDFC on Filecoin Payment Demo
          </CardTitle>
          <p className="text-purple-100">
            Testing USDFC (USD Coin on Filecoin) payment integration with existing components
          </p>
        </CardHeader>
      </Card>

      {/* Wallet Status */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-blue-600" />
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.loading && (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
              <p className="text-gray-600 mt-2">Loading wallet data...</p>
            </div>
          )}

          {state.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700">{state.error}</p>
              <Button 
                onClick={loadWalletData} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {state.walletData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* USDC Balance */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">USD</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">USDC Balance</h4>
                    <p className="text-xs text-blue-600">Ethereum & Layer 2</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-800">
                  ${parseFloat(state.walletData.usdcBalance || '0').toFixed(6)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {state.walletData.hasCircleWallet ? '✅ Wallet Connected' : '❌ No Wallet'}
                </p>
              </div>

              {/* USDFC Balance */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <FilmIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800">USDFC Balance</h4>
                    <p className="text-xs text-purple-600">Filecoin Network</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-800">
                  ${parseFloat(state.walletData.usdfcBalance || '0').toFixed(6)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-purple-600">
                    {state.walletData.hasFilecoinWallet ? '✅ Filecoin Wallet' : '❌ No Filecoin Wallet'}
                  </p>
                  {!state.walletData.hasFilecoinWallet && (
                    <Button
                      onClick={async () => {
                        setState(prev => ({ ...prev, loading: true }));
                        try {
                          await createDemoFilecoinWallet();
                          await loadWalletData();
                        } catch (error) {
                          console.error('Failed to create Filecoin wallet:', error);
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                      disabled={state.loading}
                    >
                      Create Demo Wallet
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Supported Chains */}
          {state.walletData?.supportedChains && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">Supported Networks:</h5>
              <div className="flex flex-wrap gap-2">
                {state.walletData.supportedChains.map((chain: string) => (
                  <span 
                    key={chain}
                    className={`px-2 py-1 text-xs rounded-full ${
                      chain === 'FILECOIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {chain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Demo */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle>Payment Demo</CardTitle>
          <p className="text-sm text-gray-600">
            Test USDFC payment flow with simulated transactions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Selection */}
          <div>
            <h5 className="font-medium mb-2">Select Demo Amount:</h5>
            <div className="flex gap-2">
              {demoAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setState(prev => ({ ...prev, selectedDemoAmount: amount }))}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    state.selectedDemoAmount === amount
                      ? 'bg-purple-100 border-purple-300 text-purple-800'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Payment Button */}
          <Button
            onClick={() => setState(prev => ({ ...prev, showPaymentModal: true }))}
            disabled={!state.walletData || state.loading}
            className="w-full"
            size="lg"
          >
            <CoinsIcon className="w-4 h-4 mr-2" />
            Test USDFC Payment - {state.selectedDemoAmount}
          </Button>

          {/* Payment Result */}
          {state.paymentResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-semibold text-green-800 mb-2">Demo Payment Result</h5>
              <div className="space-y-2 text-sm">
                <div><strong>Status:</strong> {state.paymentResult.success ? '✅ Success' : '❌ Failed'}</div>
                <div><strong>Token:</strong> {state.paymentResult.token}</div>
                <div><strong>Chain:</strong> {state.paymentResult.chain || 'Auto-selected'}</div>
                <div><strong>Transaction ID:</strong> {state.paymentResult.transactionId}</div>
                <div><strong>Message:</strong> {state.paymentResult.message}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={state.showPaymentModal}
        onClose={() => setState(prev => ({ ...prev, showPaymentModal: false }))}
        onSelectMethod={handlePaymentMethodSelect}
        amount={state.selectedDemoAmount}
        taskTitle="USDFC Payment Demo"
        walletBalance={state.walletData?.usdcBalance || '0.00'}
        usdfcBalance={state.walletData?.usdfcBalance || '0.00'}
        walletAddress={state.walletData?.circleWalletAddress}
        filecoinAddress={state.walletData?.filecoinAddress}
        hasWallet={state.walletData?.hasCircleWallet || false}
        hasFilecoinWallet={state.walletData?.hasFilecoinWallet || false}
      />
    </div>
  );
};