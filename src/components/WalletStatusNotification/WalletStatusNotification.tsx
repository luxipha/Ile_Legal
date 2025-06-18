import React from 'react';
import { CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

interface WalletStatusNotificationProps {
  isEnabled: boolean;
  walletBalance?: string;
}

export const WalletStatusNotification: React.FC<WalletStatusNotificationProps> = ({
  isEnabled,
  walletBalance = '0.00'
}) => {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className={`p-4 border-b ${isEnabled ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
        <h3 className="font-semibold text-gray-900">
          {isEnabled ? 'Wallet Address Available' : 'No Wallet Address'}
        </h3>
      </div>
      
      <div className="p-4">
        {isEnabled ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <p className="text-gray-600">
                Your USDC wallet address was created during registration.
              </p>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg mb-3 border border-amber-100">
              <p className="text-sm text-gray-500 mb-1">Current Balance</p>
              <p className="text-xl font-bold text-amber-700">${walletBalance} USDC</p>
            </div>
            
            <p className="text-sm text-gray-500">
              Payments are automatically processed to your wallet address.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircleIcon className="w-5 h-5 text-gray-500" />
              <p className="text-gray-600">
                No USDC wallet address found for your account.
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              Please contact support as USDC wallet addresses should be created during registration.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
