import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PaymentMethods } from "../../components/PaymentMethods";
import { WithdrawFundsModal } from "../../components/WithdrawFundsModal";
import { Header } from "../../components/Header/Header";
import { SellerSidebar } from "../../components/SellerSidebar/SellerSidebar";
import { 
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  currency: "NGN" | "USDC";
}

export const Earnings = (): JSX.Element => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      bankName: "First Bank",
      accountNumber: "1234567890",
      accountName: "Demo Seller",
      isDefault: true,
      currency: "NGN"
    }
  ]);

  const transactions = [
    {
      id: 1,
      type: "payment",
      description: "Payment for Land Title Verification",
      date: "22/04/2025",
      amount: "+65,000",
      icon: "up",
      color: "text-green-600"
    },
    {
      id: 2,
      type: "withdrawal",
      description: "Withdrawal to Bank Account",
      date: "20/04/2025",
      amount: "-100,000",
      icon: "down",
      color: "text-red-600"
    }
  ];

  const handleAddBankAccount = (account: Omit<BankAccount, "id">) => {
    const newAccount: BankAccount = {
      ...account,
      id: Date.now().toString()
    };
    
    // If this is the first account or it's set as default, update other accounts
    if (account.isDefault) {
      setBankAccounts(prev => prev.map(acc => ({ ...acc, isDefault: false })));
    }
    
    setBankAccounts(prev => [...prev, newAccount]);
  };

  const handleSetDefault = (accountId: string) => {
    setBankAccounts(prev => prev.map(acc => ({
      ...acc,
      isDefault: acc.id === accountId
    })));
  };

  const handleRemoveAccount = (accountId: string) => {
    setBankAccounts(prev => {
      const filtered = prev.filter(acc => acc.id !== accountId);
      // If we removed the default account, make the first remaining account default
      if (filtered.length > 0 && !filtered.some(acc => acc.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="earnings" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Earnings" />

        {/* Earnings Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Top Stats Cards - Equal Width */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Available Balance */}
              <Card className="bg-[#FEC85F] border-0">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-[#1B1828] text-sm font-medium mb-2">Available Balance</h3>
                    <div className="text-3xl font-bold text-[#1B1828] mb-4">₦150,000</div>
                    <Button 
                      onClick={() => setShowWithdrawModal(true)}
                      className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white w-full"
                    >
                      Withdraw Funds
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Earnings */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Earnings</h3>
                    <div className="text-3xl font-bold text-gray-900">₦65,000</div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Earned */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium mb-2">Total Earned</h3>
                    <div className="text-3xl font-bold text-gray-900">₦450,000</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section - 60% and 40% Grid */}
            <div className="grid grid-cols-5 gap-6">
              {/* Recent Transactions - 60% width (3 columns) */}
              <div className="col-span-3">
                <Card className="bg-white border border-gray-200 h-full">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Transactions</h3>
                    
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {transaction.type === 'payment' ? (
                                <TrendingUpIcon className="w-5 h-5 text-green-600" />
                              ) : (
                                <TrendingDownIcon className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{transaction.description}</div>
                              <div className="text-sm text-gray-500">{transaction.date}</div>
                            </div>
                          </div>
                          <div className={`font-bold text-lg ${transaction.color}`}>
                            {transaction.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods - 40% width (2 columns) */}
              <div className="col-span-2">
                <PaymentMethods
                  bankAccounts={bankAccounts}
                  onAddBankAccount={handleAddBankAccount}
                  onSetDefault={handleSetDefault}
                  onRemoveAccount={handleRemoveAccount}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Withdraw Funds Modal */}
      <WithdrawFundsModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance="₦150,000"
        bankAccounts={bankAccounts}
      />
    </div>
  );
};