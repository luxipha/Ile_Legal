import React from 'react';
import { WalletTestPanel } from '../../components/WalletTestPanel/WalletTestPanel';
import { Header } from '../../components/Header';
import { BuyerSidebar } from '../../components/BuyerSidebar/BuyerSidebar';
import { SellerSidebar } from '../../components/SellerSidebar/SellerSidebar';
import { useAuth } from '../../contexts/AuthContext';

export const WalletTest: React.FC = () => {
  const { user } = useAuth();

  // Determine which sidebar to show based on user role
  const Sidebar = user?.role === 'seller' ? SellerSidebar : BuyerSidebar;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar activePage="wallet-test" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Wallet System Test" userType={user?.role || 'buyer'} />

        {/* Test Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet System Testing</h1>
              <p className="text-gray-600">
                Test and debug wallet operations to ensure the user_wallets migration is working correctly.
              </p>
            </div>
            
            <WalletTestPanel />
          </div>
        </main>
      </div>
    </div>
  );
};