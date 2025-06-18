import React, { useState } from 'react';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { WalletIcon, EyeIcon, CopyIcon } from "lucide-react";
import { useToast } from "../ui/toast";

interface WalletProps {
  balance?: string;
  address?: string;
  currency?: string;
}

export const Wallet: React.FC<WalletProps> = ({
  balance = "125.00",
  address = "0x742d...c2c2",
  currency = "USDC"
}) => {
  const [isAddressVisible, setIsAddressVisible] = useState(false);
  const { addToast } = useToast();

  const toggleAddressVisibility = () => {
    setIsAddressVisible(!isAddressVisible);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address)
      .then(() => {
        addToast("Address copied to clipboard", "success");
      })
      .catch(() => {
        addToast("Failed to copy address", "error");
      });
  };

  const displayAddress = isAddressVisible ? address : address.substring(0, 6) + "..." + address.substring(address.length - 4);

  return (
    <Card className="bg-white border border-gray-200 mt-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <WalletIcon className="mr-2 h-5 w-5" />
            My Wallet
          </h3>
        </div>

        <div className="bg-[#151C2F] text-white p-6 rounded-lg mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Wallet Balance</h4>
          <div className="text-3xl font-bold mb-2">${balance} {currency}</div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Wallet Address</h4>
          <div className="flex items-center">
            <div className="flex-1 border border-gray-200 rounded-l-md p-3 bg-gray-50 text-gray-700 font-mono">
              {displayAddress}
            </div>
            <Button 
              onClick={toggleAddressVisibility} 
              variant="outline" 
              className="rounded-none border-y border-r border-gray-200 p-3 h-auto"
            >
              <EyeIcon className="h-5 w-5" />
            </Button>
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              className="rounded-l-none rounded-r-md border-y border-r border-gray-200 p-3 h-auto"
            >
              <CopyIcon className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Share this address to receive cryptocurrency payments
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
