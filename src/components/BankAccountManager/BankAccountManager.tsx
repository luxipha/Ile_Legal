import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { bankAccountApi, BankAccount } from '../../services/paymentApi';
import { useToast } from '../ui/toast';
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon
} from 'lucide-react';

interface BankAccountManagerProps {
  isAdmin?: boolean;
}

export const BankAccountManager: React.FC<BankAccountManagerProps> = ({ isAdmin = false }) => {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    account_holder_name: '',
    account_number: '',
    bank_name: '',
    bank_code: '',
    routing_number: '',
    account_type: 'checking' as 'checking' | 'savings'
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const data = await bankAccountApi.getUserBankAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      addToast('Failed to load bank accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await bankAccountApi.addBankAccount(formData);
      addToast('Bank account added successfully', 'success');
      setShowAddForm(false);
      setFormData({
        account_holder_name: '',
        account_number: '',
        bank_name: '',
        bank_code: '',
        routing_number: '',
        account_type: 'checking'
      });
      await loadBankAccounts();
    } catch (error) {
      console.error('Error adding bank account:', error);
      addToast('Failed to add bank account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      await bankAccountApi.setPrimaryBankAccount(accountId);
      addToast('Primary account updated', 'success');
      await loadBankAccounts();
    } catch (error) {
      console.error('Error setting primary account:', error);
      addToast('Failed to update primary account', 'error');
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    
    try {
      await bankAccountApi.deleteBankAccount(accountId);
      addToast('Bank account deleted', 'success');
      await loadBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      addToast('Failed to delete bank account', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    return `****${accountNumber.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Bank Accounts</h2>
          <p className="text-gray-600">Manage your bank accounts for payments and withdrawals</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {/* Add Bank Account Form */}
      {showAddForm && (
        <Card className="border border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Bank Account</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Chase Bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bank_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="021000021"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Routing Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.routing_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, routing_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="021000021"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_type: e.target.value as 'checking' | 'savings' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? 'Adding...' : 'Add Account'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bank Accounts List */}
      <div className="space-y-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Accounts</h3>
              <p className="text-gray-600 mb-4">Add a bank account to receive payments and make withdrawals</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Your First Bank Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} className={`border ${account.is_primary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{account.bank_name}</h3>
                      {account.is_primary && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Primary
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {getStatusIcon(account.verification_status)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(account.verification_status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Account Holder:</span> {account.account_holder_name}
                      </div>
                      <div>
                        <span className="font-medium">Account Number:</span> {maskAccountNumber(account.account_number)}
                      </div>
                      <div>
                        <span className="font-medium">Account Type:</span> {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                      </div>
                      <div>
                        <span className="font-medium">Currency:</span> {account.currency}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!account.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(account.id)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};