import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { XIcon, ChevronDownIcon, HashIcon, BanIcon as BankIcon, WalletIcon } from "lucide-react";
import { paymentIntegrationService } from "../../services/paymentIntegrationService";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  currency: "NGN" | "USDC";
}

interface WithdrawFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
  bankAccounts: BankAccount[];
  walletAddress?: string;
  hasWallet?: boolean;
  userId?: string;
  onWithdrawalSuccess?: (withdrawalId: string, method: string) => void;
}

export const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  bankAccounts,
  walletAddress,
  hasWallet = false,
  userId,
  onWithdrawalSuccess
}) => {
  const [amount, setAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bank' | 'wallet'>('bank');
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) return;

    setIsProcessing(true);
    try {
      const withdrawalRequest = {
        userId,
        amount: parseFloat(amount),
        method: withdrawalMethod,
        bankAccountId: withdrawalMethod === 'bank' ? selectedAccount : undefined,
        walletAddress: withdrawalMethod === 'wallet' ? walletAddress : undefined
      };

      const result = await paymentIntegrationService.processWithdrawal(withdrawalRequest);
      
      if (result.success) {
        alert(`Withdrawal successful! ${result.message} (Estimated time: ${result.estimatedTime})`);
        onWithdrawalSuccess?.(result.withdrawalId, withdrawalMethod);
        onClose();
        setAmount("");
        setSelectedAccount("");
      } else {
        alert(`Withdrawal failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Withdrawal processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedBankAccount = bankAccounts.find(account => account.id === selectedAccount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white w-full max-w-md">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-[#FEC85F] text-2xl font-bold">ilé</div>
              <div className="text-gray-600 text-sm">Legal</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdraw Funds</h2>

            <form onSubmit={handleWithdraw} className="space-y-6">
              {/* Withdrawal Method Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Withdrawal Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Bank Transfer */}
                  <Card
                    className={`cursor-pointer transition-all ${
                      withdrawalMethod === 'bank'
                        ? 'ring-2 ring-[#FEC85F] border-[#FEC85F]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setWithdrawalMethod('bank')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1B1828] rounded-lg flex items-center justify-center">
                          <BankIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Bank Transfer</div>
                          <div className="text-xs text-gray-600">To bank account</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Wallet Transfer */}
                  <Card
                    className={`cursor-pointer transition-all ${
                      withdrawalMethod === 'wallet'
                        ? 'ring-2 ring-[#FEC85F] border-[#FEC85F]'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!hasWallet ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => hasWallet && setWithdrawalMethod('wallet')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1B1828] rounded-lg flex items-center justify-center">
                          <WalletIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Crypto Wallet</div>
                          <div className="text-xs text-gray-600">
                            {hasWallet ? 'To wallet address' : 'No wallet connected'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Amount</h3>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <HashIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-lg"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Available balance: {availableBalance}
                </p>
              </div>

              {/* Destination Selection */}
              {withdrawalMethod === 'bank' ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Bank Account</h3>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                      className="w-full flex items-center justify-between px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-left"
                    >
                      <span className="text-gray-600">
                        {selectedBankAccount ? 
                          `${selectedBankAccount.bankName} - ${selectedBankAccount.accountNumber}` : 
                          "Select bank account"
                        }
                      </span>
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Dropdown */}
                    {showAccountDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                        {bankAccounts.map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccount(account.id);
                              setShowAccountDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="text-left">
                              <div className="font-medium text-gray-900">{account.bankName}</div>
                              <div className="text-sm text-gray-500">**** {account.accountNumber.slice(-4)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                account.currency === "NGN" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {account.currency}
                              </span>
                              {account.isDefault && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Wallet Address</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-mono text-sm text-gray-700">
                      {walletAddress ? 
                        `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` :
                        'No wallet address available'
                      }
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Funds will be transferred to your connected wallet
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-3 text-[#1B1828] border-[#1B1828]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!amount || (withdrawalMethod === 'bank' && !selectedAccount) || (withdrawalMethod === 'wallet' && !walletAddress) || isProcessing}
                  className="flex-1 py-3 bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : (withdrawalMethod === 'bank' ? 'Withdraw to Bank' : 'Withdraw to Wallet')}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};