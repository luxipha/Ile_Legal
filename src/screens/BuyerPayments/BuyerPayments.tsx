import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PaymentMethods, BankAccount } from "../../components/PaymentMethods";
import { Wallet } from "../../components/Wallet/Wallet";
import { PaymentMethodModal } from "../../components/PaymentMethodModal/PaymentMethodModal";
import { Header } from "../../components/Header";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { getUserWalletData, UnifiedWalletData } from "../../services/unifiedWalletService";
import { paymentIntegrationService } from "../../services/paymentIntegrationService";
import { usePaystackInline } from "../../hooks/usePaystackInline";
import { transactionService, Transaction, BankAccount as DBBankAccount } from "../../services/transactionService";
import { api } from "../../services/api";
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FileTextIcon,
  DollarSignIcon,
  ArrowLeftIcon
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  provider: string;
  providerAvatar: string;
  amount: string;
  status: "Completed" | "In Progress" | "Pending Payment" | "Cancelled";
  statusColor: string;
  date: string;
  description: string;
  category: string;
}

export const BuyerPayments = (): JSX.Element => {
  const { user } = useAuth();
  const { initializePayment } = usePaystackInline();

  // Convert database BankAccount to component BankAccount type
  const mapBankAccount = (dbAccount: DBBankAccount): BankAccount => ({
    id: dbAccount.id,
    bankName: dbAccount.bank_name,
    accountNumber: dbAccount.account_number,
    accountName: dbAccount.account_holder_name,
    isDefault: dbAccount.is_default,
    currency: dbAccount.currency as "NGN" | "USDC"
  });
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTaskForPayment, setSelectedTaskForPayment] = useState<Task | null>(null);
  const [fullWalletData, setFullWalletData] = useState<UnifiedWalletData | null>(null);
  const [walletData, setWalletData] = useState<{
    balance: string;
    address: string;
    currency: string;
  } | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load wallet data
        const walletData = await getUserWalletData(user.id);
        setFullWalletData(walletData);
        setWalletData({
          balance: walletData.balance,
          address: walletData.ethAddress || walletData.circleWalletAddress || '',
          currency: walletData.currency
        });

        // Load bank accounts
        const accounts = await transactionService.getUserBankAccounts();
        setBankAccounts(accounts.map(mapBankAccount));

        // Load transactions
        const userTransactions = await transactionService.getUserTransactions(user.id, 20);
        setTransactions(userTransactions);

        // Load user's gigs (convert to tasks format)
        const userGigs = await api.gigs.getMyGigs(user.id);
        console.log('userGigs:', userGigs);
        const formattedTasks = userGigs.map(gig => {
          // Find the accepted bid to get seller information
          const acceptedBid = gig.bids_data?.find((bid: any) => bid.status === 'accepted');
          const sellerName = acceptedBid?.seller 
            ? `${acceptedBid.seller.first_name} ${acceptedBid.seller.last_name}`.trim()
            : 'Unassigned';
          const sellerAvatar = acceptedBid?.seller?.avatar_url 
            ? acceptedBid.seller.avatar_url 
            : sellerName.charAt(0).toUpperCase();
          
          return {
            id: gig.id,
            title: gig.title,
            provider: sellerName,
            providerAvatar: sellerAvatar,
            amount: `₦${acceptedBid?.amount?.toLocaleString() || gig.budget.toLocaleString()}`,
            status: mapGigStatusToTaskStatus(gig.status),
            statusColor: getStatusColor(gig.status),
            date: new Date(gig.created_at).toLocaleDateString('en-GB'),
            description: gig.description,
            category: gig.categories?.[0] || 'General'
          };
        });
        setTasks(formattedTasks);

      } catch (error: any) {
        console.error('Error loading payment data:', error);
        setError(error.message || 'Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Helper functions to map gig status to task status
  const mapGigStatusToTaskStatus = (gigStatus: string): Task['status'] => {
    switch (gigStatus) {
      case 'completed':
      case 'paid':
      
        return 'Completed';
      case 'assigned':
      case 'in_progress':
        return 'In Progress';
      case 'active':
      case 'open':
      case 'pending_payment':
        return 'Pending Payment';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending Payment';
    }
  };

  const getStatusColor = (gigStatus: string): string => {
    switch (gigStatus) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'assigned':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'active':
      case 'open':
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate totals from real data
  const completedTasks = tasks.filter(task => task.status === "Completed" || task.status === "Pending Payment");
  const pendingTasks = tasks.filter(task => task.status === "Pending Payment");
  const totalSpent = completedTasks.reduce((sum, task) => sum + parseInt(task.amount.replace(/[₦,]/g, "")), 0);
  const pendingAmount = pendingTasks.reduce((sum, task) => sum + parseInt(task.amount.replace(/[₦,]/g, "")), 0);

  // Format transactions for display
  const formattedTransactions = transactions.map(transaction => ({
    id: transaction.id,
    type: transaction.type,
    description: transaction.description,
    date: new Date(transaction.created_at).toLocaleDateString('en-GB'),
    amount: transaction.type === 'payment_sent' || transaction.type === 'withdrawal' 
      ? `-${transaction.amount.toLocaleString()}`
      : `+${transaction.amount.toLocaleString()}`,
    icon: transaction.type === 'payment_sent' || transaction.type === 'withdrawal' ? "down" : "up",
    color: transaction.type === 'payment_sent' || transaction.type === 'withdrawal' 
      ? "text-red-600" : "text-green-600"
  }));

  const handleAddBankAccount = async (account: Omit<BankAccount, "id">) => {
    try {
      // Convert component BankAccount to database BankAccount format
      const dbAccount: Omit<DBBankAccount, "id" | "user_id" | "created_at" | "updated_at"> = {
        account_holder_name: account.accountName,
        bank_name: account.bankName,
        account_number: account.accountNumber,
        account_type: 'checking',
        currency: account.currency,
        is_default: account.isDefault,
        is_verified: false
      };
      
      const newDbAccount = await transactionService.addBankAccount(dbAccount);
      setBankAccounts(prev => [...prev, mapBankAccount(newDbAccount)]);
    } catch (error: any) {
      console.error('Error adding bank account:', error);
      setError(error.message || 'Failed to add bank account');
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
      setError(error.message || 'Failed to set default account');
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      await transactionService.deleteBankAccount(accountId);
      setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error: any) {
      console.error('Error removing bank account:', error);
      setError(error.message || 'Failed to remove bank account');
    }
  };

  const handlePayNow = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTaskForPayment(task);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentMethodSelect = async (method: 'wallet' | 'paystack', _details?: any) => {
    if (!selectedTaskForPayment || !user) return;

    try {
      const amountNum = parseFloat(selectedTaskForPayment.amount.replace(/[₦,]/g, ''));
      
      const paymentRequest = {
        taskId: Number(selectedTaskForPayment.id),
        amount: amountNum,
        currency: 'NGN',
        buyerId: user.id,
        sellerId: user.id, // Use current user as seller for demo
        method: method,
        description: selectedTaskForPayment.title
      };

      console.log('Processing payment:', paymentRequest);
      const result = await paymentIntegrationService.processPayment(paymentRequest);
      
      if (result.success) {
        console.log('Payment successful:', result);
        
        if (result.useInline && result.inlineConfig) {
          // Use Paystack Inline for better UX
          console.log('Starting Paystack inline payment:', result.inlineConfig);
          
          initializePayment({
            key: result.inlineConfig.publicKey,
            email: result.inlineConfig.email,
            amount: result.inlineConfig.amount,
            currency: result.inlineConfig.currency,
            ref: result.inlineConfig.reference,
            metadata: result.inlineConfig.metadata,
            channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
            onSuccess: (transaction) => {
              console.log('Payment completed successfully:', transaction);
              alert(`Payment successful! Reference: ${transaction.reference}`);
              
              // Update payment status in database
              paymentIntegrationService.updatePaymentStatus(result.transactionId, 'completed', transaction);
              
              // Close modal and refresh
              setShowPaymentModal(false);
              setSelectedTaskForPayment(null);
            },
            onCancel: () => {
              console.log('Payment cancelled by user');
              alert('Payment was cancelled.');
            },
            onClose: () => {
              console.log('Payment popup closed');
            }
          });
          
        } else if (result.paymentUrl) {
          // Fallback to redirect for demo/mock payments
          console.log('Redirecting to Paystack:', result.paymentUrl);
          window.location.href = result.paymentUrl;
          return;
        } else {
          alert(`Payment ${result.success ? 'successful' : 'failed'}: ${result.message}`);
        }
      } else {
        alert(`Payment failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed. Please try again.');
    }
    
    setShowPaymentModal(false);
    setSelectedTaskForPayment(null);
  };

  const handleViewDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setViewMode('details');
    }
  };
  
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTask(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "In Progress":
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case "Pending Payment":
        return <DollarSignIcon className="w-5 h-5 text-yellow-600" />;
      case "Cancelled":
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <FileTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderTaskCard = (task: Task) => (
    console.log('task', task),
    <Card key={task.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(task.status)}
              <h4 className="font-semibold text-gray-900">{task.title}</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {task.category}
              </span>
              <span>{task.date}</span>
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="text-xl font-bold text-gray-900 mb-2">{task.amount}</div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${task.statusColor}`}>
              {task.status}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium overflow-hidden">
              {task.providerAvatar && (
                task.providerAvatar.startsWith('http://') ||
                task.providerAvatar.startsWith('https://') ||
                task.providerAvatar.startsWith('data:image/')
              ) ? (
                <img 
                  src={task.providerAvatar} 
                  alt={task.provider}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`${task.providerAvatar && (
                task.providerAvatar.startsWith('http://') ||
                task.providerAvatar.startsWith('https://') ||
                task.providerAvatar.startsWith('data:image/')
              ) ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                {task.providerAvatar || task.provider.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700">{task.provider}</span>
          </div>
          
          <div className="flex gap-2">
            {task.status === "Pending Payment" && (
              <Button
                onClick={() => handlePayNow(task.id)}
                className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-4 py-2 text-sm"
              >
                Pay Now
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleViewDetails(task.id)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <BuyerSidebar activePage="payments" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Payments" userType="buyer" />

        {/* Payments Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {viewMode === 'list' ? (
              <>
                {/* Top Stats Cards - Equal Width */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {/* Total Amount Spent */}
                  <Card className="bg-[#1B1828] border-0">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-white text-sm font-medium mb-2">Total Amount Spent</h3>
                        <div className="text-3xl font-bold text-white mb-4">₦{totalSpent.toLocaleString()}</div>
                        <div className="text-sm text-gray-300">
                          {completedTasks.length} completed projects
                        </div>
                      </div>
                    </CardContent>
                  </Card>

              {/* Pending Payment */}
                  <Card className="bg-[#FEC85F] border-0">
                    <CardContent className="p-6">
                      <div>
                        <h3 className="text-[#1B1828] text-sm font-medium mb-2">Pending Payment</h3>
                        <div className="text-3xl font-bold text-[#1B1828] mb-4">₦{pendingAmount.toLocaleString()}</div>
                        <div className="text-sm text-[#1B1828]/80">
                          {pendingTasks.length} pending {pendingTasks.length === 1 ? 'payment' : 'payments'}
                        </div>
                      </div>
                    </CardContent>
              </Card>

              {/* Completed Payment */}
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div>
                        <h3 className="text-gray-600 text-sm font-medium mb-2">Completed Payments</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-4">{completedTasks.length}</div>
                        <div className="text-sm text-gray-600">
                          This month: {completedTasks.filter(task => new Date(task.date.split('/').reverse().join('-')) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length}
                        </div>
                      </div>
                    </CardContent>
              </Card>
                </div>

                {/* Bottom Section - 60% and 40% Grid */}
                <div className="grid grid-cols-5 gap-6">
                  {/* Task Cards - 60% width (3 columns) */}
                  <div className="col-span-3">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Recent Tasks</h3>
                      <p className="text-gray-600">Track payments and manage your legal service tasks</p>
                    </div>
                    
                    <div className="space-y-4">
                      {tasks.map(task => renderTaskCard(task))}
                    </div>

                    {/* Recent Transactions */}
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Transactions</h3>
                      
                      <Card className="bg-white border border-gray-200">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {formattedTransactions.map((transaction) => (
                              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    transaction.icon === 'up' ? 'bg-green-100' : 'bg-red-100'
                                  }`}>
                                    {transaction.icon === 'up' ? (
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
                                  ₦{Math.abs(parseInt(transaction.amount.replace(/[+\-,]/g, ''))).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
              </div>

                  {/* Right Column - Payment Methods & Wallet */}
                  <div className="col-span-2 space-y-6">
                    {/* Wallet Section - Top of right column */}
                    {walletData && (
                      <Card className="shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Wallet</h3>
                          <Wallet
                            balance={walletData.balance}
                            address={walletData.address}
                            currency={walletData.currency}
                          />
                        </CardContent>
                        <CardContent className="p-6">
                       {/* Payment Methods Section */}
                    <PaymentMethods
                      bankAccounts={bankAccounts}
                      onAddBankAccount={handleAddBankAccount}
                      onSetDefault={handleSetDefault}
                      onRemoveAccount={handleRemoveAccount}
                    /></CardContent>
                      </Card>
                    )}
                    
                 
               
              </div>
            </div>
              </>
            ) : viewMode === 'details' && selectedTask ? (
              <div className="bg-white rounded-lg shadow p-6">
                {/* Back Button */}
                <Button 
                  variant="ghost" 
                  onClick={handleBackToList}
                  className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Payments
                </Button>

                {/* Task Details Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h1>
                    <div className="flex items-center gap-4 text-gray-600">
                      <span>Date: {selectedTask.date}</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedTask.statusColor}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTask.amount}</div>
                </div>

                {/* Task Details Content */}
                <div className="grid grid-cols-3 gap-8 mb-8">
                  {/* Main Details - 2/3 width */}
                  <div className="col-span-2 space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Description</h3>
                        <p className="text-gray-600 mb-6">{selectedTask.description}</p>
                        
                        <h4 className="text-md font-semibold text-gray-900 mb-2">Category</h4>
                        <p className="text-gray-600 mb-4">{selectedTask.category}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Provider Details - 1/3 width */}
                  <div className="col-span-1">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider</h3>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                            {selectedTask.providerAvatar && (
                              selectedTask.providerAvatar.startsWith('http://') ||
                              selectedTask.providerAvatar.startsWith('https://') ||
                              selectedTask.providerAvatar.startsWith('data:image/')
                            ) ? (
                              <img 
                                src={selectedTask.providerAvatar} 
                                alt={selectedTask.provider}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span className={`${selectedTask.providerAvatar && (
                              selectedTask.providerAvatar.startsWith('http://') ||
                              selectedTask.providerAvatar.startsWith('https://') ||
                              selectedTask.providerAvatar.startsWith('data:image/')
                            ) ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                              {selectedTask.providerAvatar || selectedTask.provider.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{selectedTask.provider}</h4>
                            <p className="text-gray-600 text-sm">{selectedTask.category} Specialist</p>
                          </div>
                        </div>

                        {selectedTask.status === "Pending Payment" && (
                          <Button
                            onClick={() => handlePayNow(selectedTask.id)}
                            className="w-full bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] mt-4"
                          >
                            Pay Now
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* Payment Method Selection Modal */}
      {selectedTaskForPayment && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTaskForPayment(null);
          }}
          onSelectMethod={handlePaymentMethodSelect}
          amount={selectedTaskForPayment.amount}
          taskTitle={selectedTaskForPayment.title}
          walletBalance={walletData?.balance}
          walletAddress={walletData?.address}
          hasWallet={fullWalletData?.hasEthWallet || fullWalletData?.hasCircleWallet || false}
        />
      )}
    </div>
  );
};