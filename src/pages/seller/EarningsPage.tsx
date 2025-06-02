import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Ban as Bank, Clock, TrendingUp } from 'lucide-react';
import { Dialog } from '@headlessui/react';

const EarningsPage: React.FC = () => {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // Mock data for earnings
  const earnings = {
    available: 150000,
    pending: 65000,
    totalEarned: 450000,
    recentTransactions: [
      {
        id: 'tr1',
        type: 'earning',
        amount: 65000,
        description: 'Payment for Land Title Verification',
        date: '2025-04-22',
      },
      {
        id: 'tr2',
        type: 'withdrawal',
        amount: 100000,
        description: 'Withdrawal to Bank Account',
        date: '2025-04-20',
      },
    ],
    bankAccounts: [
      {
        id: 'bank1',
        bank: 'First Bank',
        accountNumber: '**** 1234',
        isDefault: true,
      },
    ],
  };

  const handleWithdraw = () => {
    // Here you would typically make an API call to process the withdrawal
    console.log('Processing withdrawal:', { amount: withdrawAmount, bank: selectedBank });
    setIsWithdrawModalOpen(false);
    setWithdrawAmount('');
  };

  const handleAddBank = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Here you would typically make an API call to add the bank account
    const formData = new FormData(e.currentTarget);
    console.log('Adding bank account:', {
      bankName: formData.get('bankName'),
      accountNumber: formData.get('accountNumber'),
      accountName: formData.get('accountName'),
    });
    setIsAddBankModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Balance</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">₦{earnings.available.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary-500" />
          </div>
          <button 
            className="mt-4 btn-primary w-full"
            onClick={() => setIsWithdrawModalOpen(true)}
          >
            Withdraw Funds
          </button>
        </div>

        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Earnings</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">₦{earnings.pending.toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-warning-500" />
          </div>
        </div>

        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Earned</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">₦{earnings.totalEarned.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-success-500" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {earnings.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {transaction.type === 'earning' ? (
                    <div className="h-10 w-10 rounded-full bg-success-100 flex items-center justify-center">
                      <ArrowUpRight className="h-5 w-5 text-success-500" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <ArrowDownRight className="h-5 w-5 text-primary-500" />
                    </div>
                  )}
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    transaction.type === 'earning' ? 'text-success-500' : 'text-primary-500'
                  }`}>
                    {transaction.type === 'earning' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Payment Methods</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {earnings.bankAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center">
                  <Bank className="h-6 w-6 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{account.bank}</p>
                    <p className="text-sm text-gray-500">Account: {account.accountNumber}</p>
                  </div>
                </div>
                {account.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Default
                  </span>
                )}
              </div>
            ))}
            <button 
              className="btn-outline w-full flex items-center justify-center"
              onClick={() => setIsAddBankModalOpen(true)}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Add New Bank Account
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <Dialog
        open={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Withdraw Funds
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1 input"
                  placeholder="Enter amount"
                  max={earnings.available}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Bank Account
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="mt-1 input"
                >
                  <option value="">Select a bank account</option>
                  {earnings.bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank} - {account.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="btn-ghost"
                onClick={() => setIsWithdrawModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || !selectedBank}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Add Bank Account Modal */}
      <Dialog
        open={isAddBankModalOpen}
        onClose={() => setIsAddBankModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Add Bank Account
            </Dialog.Title>

            <form onSubmit={handleAddBank} className="space-y-4">
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  className="mt-1 input"
                  required
                />
              </div>

              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  className="mt-1 input"
                  required
                />
              </div>

              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                  Account Name
                </label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  className="mt-1 input"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsAddBankModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default EarningsPage;