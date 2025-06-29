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
  walletAddress?: string;
  hasWallet: boolean;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  amount,
  taskTitle,
  walletBalance = "0.00",
  walletAddress,
  hasWallet
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'paystack' | null>(null);
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
        walletAddress,
        walletBalance
      });
      onClose();
    }
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return 'No wallet address';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const walletBalanceNum = parseFloat(walletBalance);
  const amountNum = parseFloat(amount.replace(/[₦,]/g, ''));
  // Check balance against converted USDC amount
  const requiredUsdcAmount = conversion?.totalAmount || 0;
  const hasEnoughBalance = walletBalanceNum >= requiredUsdcAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Choose Payment Method</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Payment Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{taskTitle}</h3>
            <div className="text-2xl font-bold text-gray-900 mb-3">{amount}</div>
            
            {/* Currency Conversion Info */}
            {conversion && (
              <div className="border-t pt-3 mt-3">
                <div className="text-sm text-gray-600 mb-2">Wallet Payment Conversion:</div>
                <div className="flex items-center justify-between text-sm">
                  <span>₦{conversion.originalAmount.toLocaleString()}</span>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">${conversion.convertedAmount} USDC</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>Conversion fee: ${conversion.fee} USDC</span>
                  <span className="font-medium">Total: ${conversion.totalAmount} USDC</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Rate: 1 USDC = ₦{conversion.exchangeRate.toLocaleString()}
                </div>
              </div>
            )}
            
            {loadingConversion && (
              <div className="text-sm text-gray-500 mt-2">Calculating conversion...</div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4 mb-6">
            {/* Wallet Payment */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'wallet' 
                  ? 'ring-2 ring-[#FEC85F] border-[#FEC85F]' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${!hasWallet || !hasEnoughBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => hasWallet && hasEnoughBalance && handleMethodSelect('wallet')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1B1828] rounded-lg flex items-center justify-center">
                    <WalletIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Crypto Wallet</h4>
                    {hasWallet ? (
                      <div className="text-sm text-gray-600">
                        <div>Balance: ${walletBalance} USDC</div>
                        <div>Address: {formatWalletAddress(walletAddress || '')}</div>
                        {conversion && (
                          <div className="text-xs text-blue-600 mt-1">
                            Required: ${conversion.totalAmount} USDC (includes fee)
                          </div>
                        )}
                        {!hasEnoughBalance && (
                          <div className="text-red-600 font-medium mt-1">
                            Insufficient balance
                            {conversion && ` (need $${(requiredUsdcAmount - walletBalanceNum).toFixed(6)} more)`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No wallet connected</div>
                    )}
                  </div>
                  {selectedMethod === 'wallet' && hasWallet && hasEnoughBalance && (
                    <div className="w-5 h-5 bg-[#FEC85F] rounded-full flex items-center justify-center">
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
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00C896] rounded-lg flex items-center justify-center">
                    <CreditCardIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Card Payment</h4>
                    <div className="text-sm text-gray-600">
                      Pay with debit card, credit card, or bank transfer
                    </div>
                  </div>
                  {selectedMethod === 'paystack' && (
                    <div className="w-5 h-5 bg-[#FEC85F] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#1B1828] rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!selectedMethod}
              className="flex-1 bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};