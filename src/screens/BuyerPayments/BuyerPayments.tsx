import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { PaymentMethods } from "../../components/PaymentMethods";
import { Header } from "../../components/Header";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
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

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  currency: "NGN" | "USDC";
}

interface Task {
  id: number;
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
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      bankName: "First Bank",
      accountNumber: "1234567890",
      accountName: "Demo Client",
      isDefault: true,
      currency: "NGN"
    }
  ]);

  const tasks: Task[] = [
    {
      id: 1,
      title: "Land Title Verification - Victoria Island",
      provider: "Chioma Okonkwo",
      providerAvatar: "CO",
      amount: "₦65,000",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
      date: "28/04/2025",
      description: "Comprehensive title verification for commercial property in Victoria Island",
      category: "Title Verification"
    },
    {
      id: 2,
      title: "Contract Review for Commercial Lease",
      provider: "Adebayo Ogundimu",
      providerAvatar: "AO",
      amount: "₦45,000",
      status: "In Progress",
      statusColor: "bg-blue-100 text-blue-800",
      date: "25/04/2025",
      description: "Legal review of commercial lease agreement terms and conditions",
      category: "Contract Review"
    },
    {
      id: 3,
      title: "Property Survey - Lekki Phase 1",
      provider: "Funmi Adebisi",
      providerAvatar: "FA",
      amount: "₦80,000",
      status: "Pending Payment",
      statusColor: "bg-yellow-100 text-yellow-800",
      date: "30/04/2025",
      description: "Comprehensive property survey and boundary verification",
      category: "Property Survey"
    },
    {
      id: 4,
      title: "Due Diligence Report",
      provider: "Kemi Adeyemi",
      providerAvatar: "KA",
      amount: "₦120,000",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
      date: "20/04/2025",
      description: "Complete due diligence investigation for residential development",
      category: "Due Diligence"
    },
    {
      id: 5,
      title: "Legal Documentation Review",
      provider: "Tunde Bakare",
      providerAvatar: "TB",
      amount: "₦35,000",
      status: "Cancelled",
      statusColor: "bg-red-100 text-red-800",
      date: "15/04/2025",
      description: "Review of property transfer documentation",
      category: "Documentation"
    }
  ];

  const transactions = [
    {
      id: 1,
      type: "payment",
      description: "Payment to Chioma Okonkwo - Title Verification",
      date: "28/04/2025",
      amount: "-65,000",
      icon: "down",
      color: "text-red-600"
    },
    {
      id: 2,
      type: "payment",
      description: "Payment to Kemi Adeyemi - Due Diligence",
      date: "20/04/2025",
      amount: "-120,000",
      icon: "down",
      color: "text-red-600"
    },
    {
      id: 3,
      type: "refund",
      description: "Refund from Tunde Bakare - Cancelled Project",
      date: "16/04/2025",
      amount: "+35,000",
      icon: "up",
      color: "text-green-600"
    }
  ];

  // Calculate totals
  const completedTasks = tasks.filter(task => task.status === "Completed");
  const pendingTasks = tasks.filter(task => task.status === "Pending Payment");
  const totalSpent = completedTasks.reduce((sum, task) => sum + parseInt(task.amount.replace(/[₦,]/g, "")), 0);
  const pendingAmount = pendingTasks.reduce((sum, task) => sum + parseInt(task.amount.replace(/[₦,]/g, "")), 0);

  const handleAddBankAccount = (account: Omit<BankAccount, "id">) => {
    const newAccount: BankAccount = {
      ...account,
      id: Date.now().toString()
    };
    
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
      if (filtered.length > 0 && !filtered.some(acc => acc.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handlePayNow = (taskId: number) => {
    console.log("Processing payment for task:", taskId);
    // Handle payment logic
  };

  const handleViewDetails = (taskId: number) => {
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
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
              {task.providerAvatar}
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
        <Header title="Payments" userName="Demo Client" userType="buyer" />

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
                            {transactions.map((transaction) => (
                              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    transaction.type === 'refund' ? 'bg-green-100' : 'bg-red-100'
                                  }`}>
                                    {transaction.type === 'refund' ? (
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
                                  ₦{Math.abs(parseInt(transaction.amount)).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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
                            {selectedTask.providerAvatar}
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
    </div>
  );
};