import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { PlusIcon, BanIcon as BankIcon, HashIcon, UserIcon, XIcon, CheckIcon } from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  currency: "NGN" | "USDC";
}

interface PaymentMethodsProps {
  bankAccounts: BankAccount[];
  onAddBankAccount: (account: Omit<BankAccount, "id">) => void;
  onSetDefault: (accountId: string) => void;
  onRemoveAccount: (accountId: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  bankAccounts,
  onAddBankAccount,
  onSetDefault,
  onRemoveAccount
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    currency: "NGN" as "NGN" | "USDC"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBankAccount({
      ...formData,
      isDefault: bankAccounts.length === 0 // First account becomes default
    });
    setFormData({
      bankName: "",
      accountNumber: "",
      accountName: "",
      currency: "NGN"
    });
    setShowAddForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="bg-white border border-gray-200 h-full min-h-[500px]">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 sm:mb-8">Payment Methods</h3>
        
        {/* Existing Bank Accounts */}
        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          {bankAccounts.map((account) => (
            <div key={account.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BankIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-base sm:text-lg truncate">{account.bankName}</div>
                    <div className="text-gray-500 text-sm sm:text-base">**** {account.accountNumber.slice(-4)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    account.currency === "NGN" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {account.currency}
                  </span>
                  {account.isDefault && (
                    <span className="bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      Default
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {!account.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetDefault(account.id)}
                    className="text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-none"
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveAccount(account.id)}
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Bank Account Form */}
        {showAddForm ? (
          <Card className="border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">Add Bank Account</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Currency:
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                    required
                  >
                    <option value="NGN">Nigerian Naira (NGN)</option>
                    <option value="USDC">USD Coin (USDC)</option>
                  </select>
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Bank Name:
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                      <BankIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      placeholder="Bank Name"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Account Number:
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                      <HashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Account Number"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Account Name:
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                      <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      placeholder="Account Name"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
                  >
                    Add Account
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Add New Bank Account Button */
          <Button 
            onClick={() => setShowAddForm(true)}
            variant="outline" 
            className="w-full py-3 sm:py-4 text-sm sm:text-base border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Add New Bank Account
          </Button>
        )}
      </CardContent>
    </Card>
  );
};