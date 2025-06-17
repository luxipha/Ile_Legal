import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { XIcon, ChevronDownIcon, HashIcon } from "lucide-react";

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
}

export const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  bankAccounts
}) => {
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Withdrawing:", { amount, selectedAccount });
    onClose();
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
              {/* Amount Input */}
              <div>
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

              {/* Bank Account Selection */}
              <div>
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
                  disabled={!amount || !selectedAccount}
                  className="flex-1 py-3 bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
                >
                  Withdraw
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};