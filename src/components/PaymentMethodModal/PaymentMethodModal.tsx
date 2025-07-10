import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { WalletIcon, CreditCardIcon, XIcon, ArrowRightIcon } from "lucide-react";
import { currencyConversionService, ConversionResult } from "../../services/currencyConversionService";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'wallet' | 'paystack', details?: any) => void;
  amount: string;
  taskTitle: string;
  walletBalance?: string;
  usdfcBalance?: string;
  walletAddress?: string;
  filecoinAddress?: string;
  hasWallet: boolean;
  hasFilecoinWallet?: boolean;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  amount,
  taskTitle,
  walletBalance = "0.00",
  usdfcBalance = "0.00",
  walletAddress,
  filecoinAddress,
  hasWallet,
  hasFilecoinWallet = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'paystack' | null>(null);
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDFC'>('USDC');
  const [conversion, setConversion] = useState<ConversionResult | null>(null);
  const [loadingConversion, setLoadingConversion] = useState(false);

  // Calculate conversion when component loads
  useEffect(() => {
    if (isOpen) {
      calculateConversion();
    }
  }, [isOpen, amount]);

  const calculateConversion = async () => {
    try {
      setLoadingConversion(true);
      const amountNum = parseFloat(amount.replace(/[₦,]/g, ''));
      const conversionResult = await currencyConversionService.convertNgnToUsdc(amountNum);
      setConversion(conversionResult);
    } catch (error) {
      console.error('Conversion calculation failed:', error);
    } finally {
      setLoadingConversion(false);
    }
  };

  if (!isOpen) return null;

  const handleMethodSelect = (method: 'wallet' | 'paystack') => {
    setSelectedMethod(method);
  };

  const handleConfirmPayment = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod, {
        amount,
        taskTitle,
        walletAddress: currentAddress,
        walletBalance: currentWalletBalance.toString(),
        selectedToken,
        preferredChain: selectedToken === 'USDFC' ? 'FILECOIN' : undefined
      });
      onClose();
    }
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return 'No wallet address';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const currentWalletBalance = selectedToken === 'USDC' ? parseFloat(walletBalance) : parseFloat(usdfcBalance);
  const amountNum = parseFloat(amount.replace(/[₦,]/g, ''));
  // Check balance against converted amount (same conversion rate for both USDC and USDFC)
  const requiredAmount = conversion?.totalAmount || 0;
  const hasEnoughBalance = currentWalletBalance >= requiredAmount;
  const currentAddress = selectedToken === 'USDC' ? walletAddress : filecoinAddress;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Choose Payment Method</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 sm:p-2"
            >
              <XIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Payment Details */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{taskTitle}</h3>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{amount}</div>
            
            {/* Currency Conversion Info */}
            {conversion && (
              <div className="border-t pt-3 mt-3">
                <div className="text-xs sm:text-sm text-gray-600 mb-2">Wallet Payment Conversion:</div>
                
                {/* Token Selection (Phase 4: USDFC Support) */}
                {(hasWallet || hasFilecoinWallet) && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">Payment Token:</div>
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      {hasWallet && (
                        <button
                          onClick={() => setSelectedToken('USDC')}
                          className={`px-2 sm:px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedToken === 'USDC' 
                              ? 'bg-blue-100 border-blue-300 text-blue-800' 
                              : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          USDC ({walletBalance})
                        </button>
                      )}
                      {hasFilecoinWallet && (
                        <button
                          onClick={() => setSelectedToken('USDFC')}
                          className={`px-2 sm:px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedToken === 'USDFC' 
                              ? 'bg-purple-100 border-purple-300 text-purple-800' 
                              : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          USDFC ({usdfcBalance})
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span>₦{conversion.originalAmount.toLocaleString()}</span>
                  <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-1" />
                  <span className="font-medium">${conversion.convertedAmount} {selectedToken}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 mt-1 gap-1 sm:gap-0">
                  <span>Conversion fee: ${conversion.fee} {selectedToken}</span>
                  <span className="font-medium">Total: ${conversion.totalAmount} {selectedToken}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Rate: 1 {selectedToken} = ₦{conversion.exchangeRate.toLocaleString()}
                  {selectedToken === 'USDFC' && <span className="text-purple-600 ml-1">(Filecoin Network)</span>}
                </div>
              </div>
            )}
            
            {loadingConversion && (
              <div className="text-sm text-gray-500 mt-2">Calculating conversion...</div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {/* Wallet Payment */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'wallet' 
                  ? 'ring-2 ring-[#FEC85F] border-[#FEC85F]' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${!(hasWallet || hasFilecoinWallet) || !hasEnoughBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => (hasWallet || hasFilecoinWallet) && hasEnoughBalance && handleMethodSelect('wallet')}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedToken === 'USDFC' ? 'bg-purple-600' : 'bg-[#1B1828]'
                  }`}>
                    <WalletIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                      Crypto Wallet 
                      {selectedToken === 'USDFC' && <span className="text-purple-600 ml-1">(Filecoin)</span>}
                    </h4>
                    {(hasWallet || hasFilecoinWallet) ? (
                      <div className="text-xs sm:text-sm text-gray-600">
                        <div className="break-all">Balance: ${currentWalletBalance.toFixed(6)} {selectedToken}</div>
                        <div className="break-all">Address: {formatWalletAddress(currentAddress || '')}</div>
                        {selectedToken === 'USDFC' && (
                          <div className="text-xs text-purple-600">
                            ⚡ Filecoin Native • Storage Optimized
                          </div>
                        )}
                        {conversion && (
                          <div className="text-xs text-blue-600 mt-1 break-all">
                            Required: ${conversion.totalAmount} {selectedToken} (includes fee)
                          </div>
                        )}
                        {!hasEnoughBalance && (
                          <div className="text-red-600 font-medium mt-1 text-xs sm:text-sm">
                            Insufficient balance
                            {conversion && ` (need $${(requiredAmount - currentWalletBalance).toFixed(6)} more)`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-500">No wallet connected</div>
                    )}
                  </div>
                  {selectedMethod === 'wallet' && (hasWallet || hasFilecoinWallet) && hasEnoughBalance && (
                    <div className="w-5 h-5 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-[#1B1828] rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Paystack Payment */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'paystack' 
                  ? 'ring-2 ring-[#FEC85F] border-[#FEC85F]' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMethodSelect('paystack')}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00C896] rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCardIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Card Payment</h4>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Pay with debit card, credit card, or bank transfer
                    </div>
                  </div>
                  {selectedMethod === 'paystack' && (
                    <div className="w-5 h-5 bg-[#FEC85F] rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-[#1B1828] rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-2 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!selectedMethod}
              className="flex-1 py-2.5 sm:py-2 text-sm sm:text-base bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};