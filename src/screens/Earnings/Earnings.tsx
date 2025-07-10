import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PaymentMethods } from "../../components/PaymentMethods";
import { WithdrawFundsModal } from "../../components/WithdrawFundsModal";
import { Wallet } from "../../components/Wallet/Wallet";
import { Header } from "../../components/Header/Header";
import { SellerSidebar } from "../../components/SellerSidebar/SellerSidebar";
import { DisputeForm, DisputeData } from "../../components/DisputeForm/DisputeForm";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../../contexts/AuthContext";
import { getUserWalletData, UnifiedWalletData } from "../../services/unifiedWalletService";
import { transactionService, Transaction as ApiTransaction, BankAccount as ApiBankAccount, EarningSummary } from "../../services/transactionService";
import { FVMContractStatus } from "../../components/FVMContractStatus/FVMContractStatus";
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon
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
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [disputeTransactionId, setDisputeTransactionId] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<UnifiedWalletData | null>(null);
  const { addToast } = useToast();
  const [bankAccounts, setBankAccounts] = useState<ApiBankAccount[]>([]);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [earningSummary, setEarningSummary] = useState<EarningSummary | null>(null);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      try {
        console.log('💰 [Earnings] Loading earnings data for user:', user.id);
        
        // Load wallet data
        console.log('🔍 [Earnings] Fetching unified wallet data...');
        const walletData = await getUserWalletData(user.id);
        console.log('📊 [Earnings] Wallet data loaded:', {
          hasEth: !!walletData.ethAddress,
          hasCircle: !!walletData.circleWalletId,
          balance: walletData.balance,
          currency: walletData.currency
        });
        setWalletData(walletData);

        // Load bank accounts
        console.log('🏦 [Earnings] Loading bank accounts...');
        const accounts = await transactionService.getUserBankAccounts();
        console.log('📊 [Earnings] Bank accounts loaded:', accounts.length);
        setBankAccounts(accounts);

        // Load transactions
        console.log('📜 [Earnings] Loading transactions...');
        const userTransactions = await transactionService.getUserTransactions(user.id, 20);
        console.log('📊 [Earnings] Transactions loaded:', userTransactions.length);
        setTransactions(userTransactions);

        // Load earning summary
        console.log('📈 [Earnings] Loading earning summary...');
        const summary = await transactionService.getEarningSummary(user.id);
        console.log('📊 [Earnings] Summary loaded:', summary);
        setEarningSummary(summary);

      } catch (error: any) {
        console.error('Error loading earnings data:', error);
        addToast(error.message || 'Failed to load earnings data', 'error');
      }
    };

    loadData();
  }, [user?.id]);

  // Format transactions for display
  const formattedTransactions = transactions.map(transaction => ({
    id: transaction.id,
    type: transaction.type === 'payment_received' ? 'payment' : 'withdrawal',
    description: transaction.description,
    date: new Date(transaction.created_at).toLocaleDateString('en-GB'),
    amount: transaction.type === 'payment_received' 
      ? `+${transaction.amount.toLocaleString()}`
      : `-${transaction.amount.toLocaleString()}`,
    icon: transaction.type === 'payment_received' ? 'up' : 'down',
    color: transaction.type === 'payment_received' ? 'text-green-600' : 'text-red-600',
    counterparty: transaction.counterparty_name
  }));

  const handleAddBankAccount = async (account: Omit<BankAccount, "id">) => {
    try {
      const newAccount = await transactionService.addBankAccount({
        account_holder_name: account.accountName,
        bank_name: account.bankName,
        account_number: account.accountNumber,
        account_type: 'checking',
        currency: account.currency,
        is_default: account.isDefault,
        is_verified: false
      });
      setBankAccounts(prev => [...prev, newAccount]);
    } catch (error: any) {
      console.error('Error adding bank account:', error);
      addToast(error.message || 'Failed to add bank account', 'error');
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      await transactionService.updateBankAccount(accountId, { is_default: true });
      setBankAccounts(prev => prev.map(acc => ({
        ...acc,
        is_default: acc.id === accountId
      })));
    } catch (error: any) {
      console.error('Error setting default account:', error);
      addToast(error.message || 'Failed to set default account', 'error');
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      await transactionService.deleteBankAccount(accountId);
      setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error: any) {
      console.error('Error removing bank account:', error);
      addToast(error.message || 'Failed to remove bank account', 'error');
    }
  };
  
  const handleOpenDispute = (transactionId: string) => {
    setDisputeTransactionId(transactionId);
  };
  
  const handleCancelDispute = () => {
    setDisputeTransactionId(null);
  };
  
  const handleSubmitDispute = async (disputeData: DisputeData) => {
    try {
      if (!user?.id) {
        addToast("Authentication required", "error");
        return;
      }

      // Find the transaction to get gig and counterparty details
      const transaction = transactions.find(t => t.id === disputeData.transactionId.toString());
      if (!transaction) {
        addToast("Transaction not found", "error");
        return;
      }

      // Map DisputeForm data to API format
      const apiDisputeData = {
        gig_id: transaction.gig_id || disputeData.transactionId.toString(),
        buyer_id: transaction.type === 'payment_sent' ? user.id : transaction.counterparty_id || '',
        seller_id: transaction.type === 'payment_sent' ? transaction.counterparty_id || '' : user.id,
        details: `${disputeData.disputeType}: ${disputeData.description}`,
        comments: disputeData.requestedResolution,
      };

      // Import and call the API
      const { api } = await import('../../services/api');
      await api.disputes.createDispute(apiDisputeData);
      
      addToast("Your dispute has been submitted successfully", "success");
      setDisputeTransactionId(null);
    } catch (error) {
      console.error('Error submitting dispute:', error);
      addToast("Failed to submit dispute. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="earnings" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Header - Hidden on mobile since SellerSidebar provides mobile nav */}
        <div className="hidden md:block">
          <Header title="Earnings" />
        </div>

        {/* Earnings Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Top Stats Cards - Equal Width */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Available Balance */}
              <Card className="bg-[#FEC85F] border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-[#1B1828] text-xs sm:text-sm font-medium mb-2">Available Balance</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-[#1B1828] mb-3 sm:mb-4">
                      ₦{earningSummary?.available_balance?.toLocaleString() || '0'}
                    </div>
                    <Button 
                      onClick={() => setShowWithdrawModal(true)}
                      className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white w-full text-sm sm:text-base py-2 sm:py-3"
                    >
                      Withdraw Funds
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Earnings */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div>
                    <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2">Pending Earnings</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      ₦{earningSummary?.pending_earnings?.toLocaleString() || '0'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Earned */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div>
                    <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2">Total Earned</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      ₦{earningSummary?.total_earned?.toLocaleString() || '0'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section - 60% and 40% Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
              {/* Recent Transactions - 60% width (3 columns) */}
              <div className="lg:col-span-3">
                <Card className="bg-white border border-gray-200 h-full">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent Transactions</h3>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {formattedTransactions.map((transaction) => (
                        <div key={transaction.id} className="mb-2">
                          {/* Mobile Layout */}
                          <div className="block sm:hidden">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                  {transaction.type === 'payment' ? (
                                    <TrendingUpIcon className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDownIcon className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm truncate">{transaction.description}</div>
                                  <div className="text-xs text-gray-500">{transaction.date}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className={`font-bold text-base ${transaction.color}`}>
                                  ₦{Math.abs(parseInt(transaction.amount.replace(/[+\-,]/g, ''))).toLocaleString()}
                                </div>
                                {transaction.type === 'payment' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenDispute(transaction.id)}
                                    className="flex items-center gap-1 text-amber-600 border-amber-200 hover:bg-amber-50 text-xs px-2 py-1"
                                  >
                                    <AlertCircleIcon className="w-3 h-3" />
                                    Report
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:block">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                              <div className="flex items-center gap-3">
                                <div className={`font-bold text-lg ${transaction.color}`}>
                                  ₦{Math.abs(parseInt(transaction.amount.replace(/[+\-,]/g, ''))).toLocaleString()}
                                </div>
                                {transaction.type === 'payment' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenDispute(transaction.id)}
                                    className="flex items-center gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                                  >
                                    <AlertCircleIcon className="w-4 h-4" />
                                    Report
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {disputeTransactionId === transaction.id && (
                            <DisputeForm
                              transactionId={transaction.id}
                              transactionTitle={transaction.description}
                              transactionAmount={transaction.amount}
                              counterpartyName={transaction.counterparty || 'Counterparty'}
                              onSubmit={handleSubmitDispute}
                              onCancel={handleCancelDispute}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods - 40% width (2 columns) */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Crypto Wallet */}
                {walletData && (
                  <Wallet 
                    balance={walletData.balance}
                    address={walletData.ethAddress || walletData.circleWalletAddress || ''}
                    currency={walletData.currency}
                  />
                )}
                
                <div>
                  <PaymentMethods
                    bankAccounts={bankAccounts.map(acc => ({
                      id: acc.id,
                      bankName: acc.bank_name,
                      accountNumber: acc.account_number,
                      accountName: acc.account_holder_name,
                      isDefault: acc.is_default,
                      currency: acc.currency as "NGN" | "USDC"
                    }))}
                    onAddBankAccount={handleAddBankAccount}
                    onSetDefault={handleSetDefault}
                    onRemoveAccount={handleRemoveAccount}
                  />
                </div>
              </div>
            </div>

            {/* FVM Contract Status Section */}
            <div className="mt-4 sm:mt-6">
              <FVMContractStatus />
            </div>
          </div>
        </main>
      </div>

      {/* Withdraw Funds Modal */}
      <WithdrawFundsModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={`₦${earningSummary?.available_balance?.toLocaleString() || '0'}`}
        bankAccounts={bankAccounts.map(acc => ({
          id: acc.id,
          bankName: acc.bank_name,
          accountNumber: acc.account_number,
          accountName: acc.account_holder_name,
          isDefault: acc.is_default,
          currency: acc.currency as "NGN" | "USDC"
        }))}
        walletAddress={walletData?.ethAddress || walletData?.circleWalletAddress}
        hasWallet={walletData?.hasEthWallet || walletData?.hasCircleWallet || false}
        userId={user?.id}
        onWithdrawalSuccess={(withdrawalId, method) => {
          console.log(`Withdrawal ${withdrawalId} via ${method} completed`);
          addToast(`Withdrawal request submitted successfully via ${method}`, "success");
        }}
      />
    </div>
  );
};