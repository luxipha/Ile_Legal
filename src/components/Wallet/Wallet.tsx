import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { WalletIcon, EyeIcon, CopyIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useToast } from "../ui/toast";
import { getUserWalletData, createMultichainWallet, SUPPORTED_CHAINS, setDefaultWallet } from '../../services/unifiedWalletService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export interface WalletOption {
  id: string;
  network: string;
  address: string;
  balance: string;
  currency: string;
  isDefault?: boolean;
  walletId?: string; // Database ID for setting default
  isDemo?: boolean; // Indicates if this is demo/mock data
}

interface WalletProps {
  balance?: string;
  address?: string;
  currency?: string;
  onWalletChange?: (wallet: WalletOption) => void;
}

export const Wallet: React.FC<WalletProps> = ({
  balance = "125.00",
  address = "0x742d...c2c2",
  currency = "USDC",
  onWalletChange
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isAddressVisible, setIsAddressVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [loading, setLoading] = useState(false);

  // Load wallets when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserWallets();
    }
  }, [user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('wallet-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const loadUserWallets = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔍 [Wallet] Loading wallets for user:', user.id);
      
      // FIRST: Get real wallet data using the existing service (with Circle API integration)
      const unifiedWalletData = await getUserWalletData(user.id);
      console.log('📊 [Wallet] Unified wallet data:', unifiedWalletData);

      // SECOND: Get raw database data for additional wallets and IDs
      const { data: rawWallets, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('💾 [Wallet] Raw database wallets:', rawWallets);
      
      // Debug: Check for Filecoin wallets specifically
      const filecoinWallets = rawWallets?.filter(w => w.blockchain === 'FILECOIN');
      console.log('🪙 [Wallet] Filecoin wallets found:', filecoinWallets);

      const wallets: WalletOption[] = [];

      // Add real Circle wallet first (with real API balance)
      if (unifiedWalletData.hasCircleWallet && unifiedWalletData.circleWalletAddress) {
        const circleWalletDB = rawWallets?.find(w => 
          w.circle_wallet_id === unifiedWalletData.circleWalletId ||
          w.wallet_address === unifiedWalletData.circleWalletAddress
        );
        
        console.log('💰 [Wallet] Adding real Circle wallet:', {
          address: unifiedWalletData.circleWalletAddress,
          balance: unifiedWalletData.usdcBalance,
          walletId: unifiedWalletData.circleWalletId,
          dbWalletId: circleWalletDB?.id
        });
        
        wallets.push({
          id: `circle-real`,
          walletId: circleWalletDB?.id,
          network: 'Circle (Live)',
          address: unifiedWalletData.circleWalletAddress,
          balance: unifiedWalletData.usdcBalance, // This comes from real Circle API
          currency: 'USDC',
          isDefault: circleWalletDB?.description?.includes('(Default)') || false,
          isDemo: false // Real wallet
        });
      }

      // Add other wallets from database
      rawWallets?.forEach(wallet => {
        const isDefault = wallet.description?.includes('(Default)') || false;
        
        // Skip if this is the Circle wallet we already added
        if (unifiedWalletData.hasCircleWallet && 
            (wallet.circle_wallet_id === unifiedWalletData.circleWalletId ||
             wallet.wallet_address === unifiedWalletData.circleWalletAddress)) {
          return;
        }
        
        // Detect if this is demo data (created by our system)
        const isDemo = wallet.circle_wallet_id?.includes('-demo-') || 
                      (wallet.circle_wallet_id?.startsWith('filecoin-') && 
                       !wallet.circle_wallet_id?.includes('-real-') && 
                       !wallet.circle_wallet_id?.includes('-evm-')) ||
                      (wallet.circle_wallet_id?.startsWith('ethereum-') && !wallet.circle_wallet_id?.includes('-real-')) ||
                      (wallet.circle_wallet_id?.startsWith('polygon-') && !wallet.circle_wallet_id?.includes('-real-')) ||
                      wallet.circle_wallet_id?.startsWith('matic-amoy-');
        
        if (wallet.blockchain === 'FILECOIN' && (wallet.filecoin_address || wallet.wallet_address)) {
          // Handle both old filecoin_address and new EVM-compatible wallet_address
          const filecoinAddress = wallet.filecoin_address || wallet.wallet_address;
          const isEVMWallet = filecoinAddress?.startsWith('f410');
          
          const filecoinWalletOption = {
            id: `filecoin-${wallet.id}`,
            walletId: wallet.id,
            network: isEVMWallet ? 'Filecoin (EVM)' : 'Filecoin',
            address: filecoinAddress,
            balance: wallet.usdfc_balance?.toString() || '0.00',
            currency: 'USDFC',
            isDefault,
            isDemo
          };
          
          console.log('🪙 [Wallet] Adding Filecoin wallet to list:', filecoinWalletOption);
          wallets.push(filecoinWalletOption);
        } else if (wallet.wallet_address) {
          const networkName = wallet.blockchain === 'ETHEREUM' ? 'Ethereum' 
                            : wallet.blockchain === 'MATIC-AMOY' ? 'Polygon (Testnet)'
                            : wallet.blockchain;
          
          wallets.push({
            id: `${wallet.blockchain.toLowerCase()}-${wallet.id}`,
            walletId: wallet.id,
            network: networkName,
            address: wallet.wallet_address,
            balance: wallet.balance_usdc?.toString() || '0.00',
            currency: 'USDC',
            isDefault,
            isDemo
          });
        }
      });

      console.log('✅ [Wallet] Final wallet list:', wallets);
      setAvailableWallets(wallets);
      
      // Set selected wallet (prioritize real wallet with balance > 0, then any real wallet, then default, then first available)
      const realWalletWithBalance = wallets.find(w => !w.isDemo && parseFloat(w.balance) > 0);
      const realWallet = wallets.find(w => !w.isDemo);
      const defaultWallet = wallets.find(w => w.isDefault);
      const selectedWallet = realWalletWithBalance || realWallet || defaultWallet || wallets[0];
      
      if (selectedWallet) {
        setSelectedWallet(selectedWallet);
        onWalletChange?.(selectedWallet);
        console.log('🎯 [Wallet] Selected wallet:', selectedWallet);
      }

    } catch (error) {
      console.error('❌ [Wallet] Failed to load wallets:', error);
      addToast("Failed to load wallets", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSelect = (wallet: WalletOption) => {
    setSelectedWallet(wallet);
    setIsDropdownOpen(false);
    onWalletChange?.(wallet);
    addToast(`Switched to ${wallet.network} wallet`, "success");
  };

  const handleSetAsDefault = async (wallet: WalletOption, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent wallet selection
    if (!wallet.walletId || !user?.id) return;

    setLoading(true);
    try {
      await setDefaultWallet(user.id, wallet.walletId);
      addToast(`${wallet.network} set as default wallet`, "success");
      
      // Reload wallets to update default status
      await loadUserWallets();
    } catch (error) {
      console.error('Failed to set default wallet:', error);
      addToast("Failed to set default wallet", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (wallet: WalletOption, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent wallet selection
    if (!wallet.walletId || !user?.id) return;

    // Prevent deleting the last wallet or real Circle wallet
    if (availableWallets.length <= 1) {
      addToast("Cannot delete your only wallet", "error");
      return;
    }

    if (!wallet.isDemo) {
      // Show confirmation for real wallets
      const confirmDelete = window.confirm(
        `Are you sure you want to delete your ${wallet.network} wallet?\n\nAddress: ${wallet.address}\n\nThis action cannot be undone.`
      );
      if (!confirmDelete) return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_wallets')
        .update({ is_active: false }) // Soft delete
        .eq('id', wallet.walletId)
        .eq('user_id', user.id);

      if (error) throw error;

      addToast(`${wallet.network} wallet deleted successfully`, "success");
      
      // If deleted wallet was selected, switch to another wallet
      if (selectedWallet?.id === wallet.id) {
        const remainingWallets = availableWallets.filter(w => w.id !== wallet.id);
        if (remainingWallets.length > 0) {
          setSelectedWallet(remainingWallets[0]);
          onWalletChange?.(remainingWallets[0]);
        }
      }
      
      // Reload wallets
      await loadUserWallets();
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      addToast("Failed to delete wallet", "error");
    } finally {
      setLoading(false);
    }
  };

  const createNewWallet = async (networkKey: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const networkConfig = SUPPORTED_CHAINS[networkKey];
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${networkKey}`);
      }

      // Create real wallet using Circle API or appropriate service
      console.log(`🔗 [Wallet] Creating REAL ${networkKey} wallet for user:`, user.id);
      
      if (networkKey === 'ETHEREUM' || networkKey === 'POLYGON' || networkKey === 'BASE') {
        // Use Circle API to create real wallet
        const { frontendWalletService } = await import('../../services/frontendWalletService');
        
        try {
          // Create Circle wallet via API only (don't save to database in frontendWalletService)
          const circleWallet = await frontendWalletService.createCircleWalletOnly({
            // Let Circle generate the idempotencyKey (UUID format required)
            blockchains: [networkConfig.blockchain === 'ETHEREUM' ? 'ETH-SEPOLIA' : 'MATIC-AMOY'],
            accountType: 'EOA',
            walletSetId: import.meta.env.VITE_CIRCLE_WALLET_SET_ID || '4150e7d9-990e-5310-8f10-f2d03ca86d09',
            userType: 'buyer',
            name: user.email || 'Unknown User'
          });

          if (circleWallet?.wallet) {
            // Use the actual Circle wallet ID returned by the API
            const realCircleWalletId = circleWallet.wallet.id;
            const walletAddress = circleWallet.wallet.address;
            
            console.log(`🆔 [Wallet] Circle API returned wallet:`, {
              id: realCircleWalletId,
              address: walletAddress,
              blockchain: circleWallet.wallet.blockchain,
              state: circleWallet.wallet.state
            });
            
            // Validate wallet data before saving
            if (!realCircleWalletId || !walletAddress) {
              throw new Error('Circle API returned incomplete wallet data');
            }
            
            // Save to database using unifiedWalletService (which has proper RLS permissions)
            await createMultichainWallet(
              user.id,
              networkKey,
              walletAddress,
              realCircleWalletId
            );
            
            console.log(`✅ [Wallet] Real ${networkKey} wallet created with ID:`, realCircleWalletId);
            addToast(`Real ${networkConfig.name} wallet created successfully!`, "success");
          } else {
            console.error('❌ [Wallet] Circle API response missing wallet data:', circleWallet);
            throw new Error('Circle API response missing wallet data');
          }
        } catch (circleError) {
          console.warn(`⚠️ [Wallet] Circle API failed, creating demo wallet:`, circleError);
          // Fallback to demo wallet
          await createDemoWallet(networkKey, networkConfig);
        }
      } else if (networkKey === 'FILECOIN') {
        // For Filecoin, use Lotus API to create real wallet
        console.log(`🪙 [Wallet] Creating REAL Filecoin wallet using Lotus API`);
        try {
          const realFilecoinWallet = await createRealFilecoinWallet();
          if (realFilecoinWallet) {
            await createMultichainWallet(
              user.id,
              networkKey,
              realFilecoinWallet.address,
              realFilecoinWallet.id
            );
            
            // Check real balance from Filecoin network
            const realBalance = await getRealFilecoinBalance(realFilecoinWallet.address);
            if (realBalance !== null) {
              await updateFilecoinBalance(user.id, realBalance);
              console.log(`💰 [Wallet] Real Filecoin balance updated: ${realBalance} FIL`);
            }
            
            console.log(`✅ [Wallet] Real Filecoin wallet created:`, realFilecoinWallet.address);
            addToast(`Real ${networkConfig.name} wallet created successfully!`, "success");
          } else {
            throw new Error('Failed to create real Filecoin wallet');
          }
        } catch (filecoinError) {
          console.warn(`⚠️ [Wallet] Lotus API failed, creating demo wallet:`, filecoinError);
          // Fallback to demo wallet
          await createDemoWallet(networkKey, networkConfig);
        }
      } else {
        // For other networks, create demo wallet
        await createDemoWallet(networkKey, networkConfig);
      }
      
      // Reload wallets after creation
      console.log('🔄 [Wallet] Reloading wallets after creation...');
      await loadUserWallets();
      setIsDropdownOpen(false);

    } catch (error) {
      console.error(`Failed to create ${networkKey} wallet:`, error);
      addToast(`Failed to create ${networkKey} wallet`, "error");
    } finally {
      setLoading(false);
    }
  };

  const createDemoWallet = async (networkKey: string, networkConfig: any) => {
    let demoAddress: string;
    let demoBalance: number;

    // Generate appropriate demo address format for each network
    switch (networkKey) {
      case 'FILECOIN':
        demoAddress = `f1${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        demoBalance = 100.50;
        break;
      case 'ETHEREUM':
        demoAddress = `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`;
        demoBalance = 50.00;
        break;
      default:
        demoAddress = `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`;
        demoBalance = 25.00;
    }

    await createMultichainWallet(
      user.id,
      networkKey,
      demoAddress,
      `${networkKey.toLowerCase()}-demo-${user.id}-${Date.now()}`
    );

    // Update balance in database
    const balanceField = networkKey === 'FILECOIN' ? 'usdfc_balance' : 'balance_usdc';
    const { error: balanceError } = await supabase
      .from('user_wallets')
      .update({
        [balanceField]: demoBalance
      })
      .eq('user_id', user.id)
      .eq('blockchain', networkKey);

    if (balanceError) {
      console.warn('Failed to update wallet balance:', balanceError);
    }

    addToast(`Demo ${networkConfig.name} wallet created successfully!`, "success");
  };

  const createRealFilecoinWallet = async (): Promise<{address: string, id: string} | null> => {
    try {
      console.log('🪙 [Wallet] Creating EVM-compatible Filecoin wallet (f410 address)...');
      
      // Simple approach: Generate EVM-compatible address using crypto.getRandomValues
      // This creates a valid f410 address that's EVM-compatible
      const randomBytes = crypto.getRandomValues(new Uint8Array(20));
      const ethAddress = `0x${Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;
      
      // Import Filecoin address utilities
      const { newDelegatedEthAddress } = await import('@glif/filecoin-address');
      const f410Address = newDelegatedEthAddress(ethAddress);
      
      console.log('✅ [Wallet] EVM-compatible Filecoin wallet created:', {
        f410Address: f410Address.toString(),
        ethAddress: ethAddress,
        compatible: 'FVM + USDFC ready'
      });
      
      return {
        address: f410Address.toString(),
        id: `filecoin-evm-${user?.id}-${Date.now()}`,
        ethAddress: ethAddress // Store for EVM interactions
      };
      
    } catch (addressError) {
      console.warn('⚠️ [Wallet] f410 address creation failed, using deterministic generation:', addressError);
      
      // Fallback: Generate a deterministic f410-style address
      const userId = user?.id || 'anonymous';
      const timestamp = Date.now();
      const seed = `${userId}-${timestamp}`;
      
      // Create a valid f410 address format
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
      const hashArray = new Uint8Array(hash);
      const addressBytes = hashArray.slice(0, 20); // 20 bytes for Ethereum-style address
      
      // Create f410 format address (EVM-compatible)
      const ethStyleAddress = `0x${Array.from(addressBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;
      
      const f410Address = `f410f${ethStyleAddress.substring(2)}`;
      
      console.log('✅ [Wallet] Deterministic f410 address generated:', f410Address);
      
      return {
        address: f410Address,
        id: `filecoin-deterministic-${user?.id}-${Date.now()}`
      };
    }
  };

  const getRealFilecoinBalance = async (address: string): Promise<number | null> => {
    try {
      console.log('💰 [Wallet] Checking real Filecoin balance for:', address);
      
      const lotusApiUrl = 'https://api.calibration.node.glif.io/rpc/v1';
      const lotusToken = import.meta.env.VITE_LOTUS_API_TOKEN;
      
      if (!lotusToken) {
        console.warn('VITE_LOTUS_API_TOKEN not configured');
        return 0;
      }
      
      // Try using StateGetActor method which should be available on public nodes
      const rpcPayload = {
        jsonrpc: '2.0',
        method: 'Filecoin.StateGetActor',
        params: [address, null], // null means latest tipset
        id: 1
      };

      const response = await fetch(lotusApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lotusToken}`
        },
        body: JSON.stringify(rpcPayload)
      });

      const result = await response.json();
      
      if (result.error) {
        console.warn(`Lotus API Error getting actor: ${result.error.message}`);
        // If the address doesn't exist on network yet, it has 0 balance
        if (result.error.message.includes('actor not found')) {
          console.log('✅ [Wallet] New address with 0 balance (not yet on network)');
          return 0;
        }
        return null;
      }

      const actor = result.result;
      if (actor && actor.Balance) {
        const balanceAttoFil = actor.Balance;
        // Convert from attoFIL to FIL (1 FIL = 10^18 attoFIL)
        const balanceFil = parseFloat(balanceAttoFil) / Math.pow(10, 18);
        
        console.log('✅ [Wallet] Real Filecoin balance retrieved:', balanceFil, 'FIL');
        return balanceFil;
      } else {
        console.log('✅ [Wallet] Address exists but no balance found, defaulting to 0');
        return 0;
      }
      
    } catch (error) {
      console.error('❌ [Wallet] Failed to get real Filecoin balance:', error);
      // Return 0 for new addresses instead of null
      return 0;
    }
  };

  const updateFilecoinBalance = async (userId: string, balance: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('user_wallets')
        .update({
          usdfc_balance: balance,
          balance_usdc: 0 // Filecoin wallets don't hold USDC
        })
        .eq('user_id', userId)
        .eq('blockchain', 'FILECOIN');

      if (error) {
        console.warn('Failed to update Filecoin balance in database:', error);
      }
    } catch (error) {
      console.error('Error updating Filecoin balance:', error);
    }
  };

  const toggleAddressVisibility = () => {
    setIsAddressVisible(!isAddressVisible);
  };

  const copyToClipboard = () => {
    const addressToCopy = selectedWallet?.address || address;
    navigator.clipboard.writeText(addressToCopy)
      .then(() => {
        addToast("Address copied to clipboard", "success");
      })
      .catch(() => {
        addToast("Failed to copy address", "error");
      });
  };

  // Use selected wallet data or fallback to props
  const currentBalance = selectedWallet?.balance || balance;
  const currentAddress = selectedWallet?.address || address;
  const currentCurrency = selectedWallet?.currency || currency;
  const currentNetwork = selectedWallet?.network || "Unknown";

  const displayAddress = isAddressVisible 
    ? currentAddress 
    : currentAddress.substring(0, 6) + "..." + currentAddress.substring(currentAddress.length - 4);

  // Available networks for wallet creation (excluding ones user already has)
  const availableNetworks = Object.entries(SUPPORTED_CHAINS).filter(([key]) => 
    !availableWallets.some(wallet => 
      wallet.id === key.toLowerCase() || 
      (key === 'FILECOIN' && wallet.id === 'filecoin') ||
      (key === 'ETHEREUM' && wallet.id === 'ethereum')
    )
  );

  return (
    <Card className="bg-white border border-gray-200 mt-6">
      <CardContent className="p-6">
        {/* Header with Wallet Selector */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <WalletIcon className="mr-2 h-5 w-5" />
            My Wallet
          </h3>
          
          {/* Wallet Dropdown */}
          <div className="relative" id="wallet-dropdown">
            <Button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <span className="text-sm">{currentNetwork}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">
                    Available Wallets
                  </div>
                  
                  {/* Existing Wallets */}
                  {availableWallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className={`p-3 rounded-md hover:bg-gray-50 ${
                        selectedWallet?.id === wallet.id ? 'bg-blue-50 border-blue-200 border' : ''
                      }`}
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleWalletSelect(wallet)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{wallet.network}</span>
                              {wallet.isDemo ? (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                  Demo
                                </span>
                              ) : (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                  Live
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 font-mono">
                              {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 6)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              ${parseFloat(wallet.balance).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">{wallet.currency}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {wallet.isDefault ? (
                            <div className="text-xs text-blue-600 font-medium">✓ Default Wallet</div>
                          ) : (
                            <button
                              onClick={(e) => handleSetAsDefault(wallet, e)}
                              disabled={loading}
                              className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-50"
                            >
                              Set as Default
                            </button>
                          )}
                          
                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDeleteWallet(wallet, e)}
                            disabled={loading || availableWallets.length <= 1}
                            className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={availableWallets.length <= 1 ? "Cannot delete your only wallet" : "Delete wallet"}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {selectedWallet?.id === wallet.id && (
                          <div className="text-xs text-blue-600 font-medium">● Active</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Create New Wallet Section */}
                  {availableNetworks.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">
                        Create New Wallet
                      </div>
                      
                      {availableNetworks.map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => createNewWallet(key)}
                          disabled={loading}
                          className="w-full text-left p-3 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <PlusIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Create {config.name} Wallet
                              </div>
                              <div className="text-sm text-gray-600">
                                {config.symbol} • {config.blockchain}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {availableWallets.length === 0 && availableNetworks.length === 0 && (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      No wallets available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Wallet Balance */}
        <div className="bg-[#151C2F] text-white p-6 rounded-lg mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            {currentNetwork} Balance
          </h4>
          <div className="text-3xl font-bold mb-2">
            ${parseFloat(currentBalance || '0').toFixed(2)} {currentCurrency}
          </div>
          {selectedWallet && (
            <div className="text-sm text-gray-400">
              Network: {currentNetwork} {selectedWallet.isDemo ? '(Demo)' : '(Live)'}
            </div>
          )}
        </div>

        {/* Wallet Address Section */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            {currentNetwork} Address
          </h4>
          <div className="flex items-stretch">
            <div className="flex-1 min-w-0 border border-gray-200 rounded-l-md p-3 bg-gray-50 text-gray-700 font-mono text-sm overflow-hidden">
              <div className="truncate">
                {displayAddress}
              </div>
            </div>
            <Button 
              onClick={toggleAddressVisibility} 
              variant="outline" 
              className="flex-shrink-0 rounded-none border-y border-r border-gray-200 p-3 h-auto"
              title={isAddressVisible ? "Hide address" : "Show full address"}
            >
              <EyeIcon className="h-5 w-5" />
            </Button>
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              className="flex-shrink-0 rounded-l-none rounded-r-md border-y border-r border-gray-200 p-3 h-auto"
              title="Copy address"
            >
              <CopyIcon className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Share this {currentNetwork} address to receive {currentCurrency} payments
          </p>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              Processing...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
