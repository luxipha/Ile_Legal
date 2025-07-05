/**
 * Phase 4.5: FVM Contract Status Component
 * 
 * Displays FVM smart contract status for escrow and storage deals
 * Shows contract addresses, transaction history, and storage verification
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileTextIcon, 
  CoinsIcon, 
  HardDriveIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExternalLinkIcon 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ContractData {
  id: string;
  contractAddress: string;
  taskId: number;
  amount: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  taskTitle?: string;
}

interface FVMContractState {
  contracts: ContractData[];
  storageContracts: ContractData[];
  loading: boolean;
  error: string | null;
}

export const FVMContractStatus: React.FC = () => {
  const { user } = useAuth();
  const [contractState, setContractState] = useState<FVMContractState>({
    contracts: [],
    storageContracts: [],
    loading: false,
    error: null
  });

  useEffect(() => {
    if (user?.id) {
      loadFVMContracts();
    }
  }, [user?.id]);

  const loadFVMContracts = async () => {
    if (!user?.id) return;

    setContractState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load escrow contracts (for both buyers and sellers)
      const { data: escrowContracts, error: escrowError } = await supabase
        .from('fvm_contracts')
        .select(`
          *,
          Gigs!inner(title)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (escrowError) {
        console.log('FVM contracts table not found, using demo data');
        // Demo data for development
        setContractState(prev => ({
          ...prev,
          contracts: [
            {
              id: 'demo-1',
              contractAddress: 'f410f5qvr7oztlqbwtg3jgayk6ssgaojlcnvgpwmh6ca',
              taskId: 12345,
              amount: '150.000000',
              status: 'escrowed',
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              taskTitle: 'Legal Document Review - Demo'
            }
          ],
          storageContracts: [
            {
              id: 'storage-demo-1',
              contractAddress: 'f410f5qvr7oztlqbwtg3jgayk6ssgaojlcnvgpwmh6ca',
              taskId: 12345,
              amount: '5.000000',
              status: 'active',
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              taskTitle: 'Document Storage - Demo'
            }
          ],
          loading: false
        }));
        return;
      }

      // Load storage contracts from filecoin_storage table
      const { data: storageContracts, error: storageError } = await supabase
        .from('filecoin_storage')
        .select(`
          *
        `)
        .eq('user_id', user.id)
        .order('upload_timestamp', { ascending: false })
        .limit(5);

      if (storageError) {
        console.log('Storage contracts error:', storageError);
      }

      setContractState(prev => ({
        ...prev,
        contracts: escrowContracts?.map(contract => ({
          ...contract,
          taskTitle: contract.Gigs?.title || 'Unknown Task'
        })) || [],
        storageContracts: storageContracts?.map(storage => ({
          id: storage.id,
          contractAddress: storage.piece_id || storage.ipfs_cid,
          taskId: 0,
          amount: '0.000000',
          status: storage.is_verified ? 'active' : 'pending',
          createdAt: storage.upload_timestamp,
          expiresAt: new Date(new Date(storage.upload_timestamp).getTime() + (storage.storage_duration || 30) * 24 * 60 * 60 * 1000).toISOString(),
          taskTitle: storage.original_filename || 'File Storage'
        })) || [],
        loading: false
      }));
    } catch (error) {
      setContractState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load contracts',
        loading: false
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'escrowed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatContractAddress = (address: string): string => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  const openFilfoxExplorer = (address: string) => {
    window.open(`https://calibration.filfox.info/en/address/${address}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Escrow Contracts */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileTextIcon className="w-6 h-6 text-blue-600" />
            FVM Escrow Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractState.loading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
              <p className="text-gray-600 mt-2">Loading contracts...</p>
            </div>
          ) : contractState.contracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No FVM contracts found</p>
              <p className="text-sm">Contracts will appear here when you make USDFC payments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contractState.contracts.map((contract) => (
                <div key={contract.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{contract.taskTitle}</h4>
                      <p className="text-sm text-gray-600">Task #{contract.taskId}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {getStatusIcon(contract.status)}
                      {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Contract Address:</div>
                      <div className="flex items-center gap-2 font-mono">
                        {formatContractAddress(contract.contractAddress)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openFilfoxExplorer(contract.contractAddress)}
                          className="p-1 h-auto"
                        >
                          <ExternalLinkIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Escrow Amount:</div>
                      <div className="font-semibold text-purple-800">
                        ${parseFloat(contract.amount).toFixed(6)} USDFC
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Created:</div>
                      <div>{new Date(contract.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Expires:</div>
                      <div>{new Date(contract.expiresAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Contracts */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDriveIcon className="w-6 h-6 text-green-600" />
            Storage Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractState.storageContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HardDriveIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No storage contracts found</p>
              <p className="text-sm">Storage deals will appear here for your tasks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contractState.storageContracts.map((contract) => (
                <div key={contract.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{contract.taskTitle}</h4>
                      <p className="text-sm text-gray-600">Storage Deal #{contract.id.slice(0, 8)}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {getStatusIcon(contract.status)}
                      {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Piece CID:</div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        {formatContractAddress(contract.contractAddress)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://filfox.info/en/deal/${contract.contractAddress}`, '_blank')}
                          className="p-1 h-auto"
                        >
                          <ExternalLinkIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Storage Duration:</div>
                      <div>30 days (until {new Date(contract.expiresAt).toLocaleDateString()})</div>
                    </div>
                    <div>
                      <div className="text-gray-600">File Size:</div>
                      <div>{/* File size would come from storage metadata */}N/A</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Storage Network:</div>
                      <div className="text-purple-600 font-medium">Filecoin</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {contractState.error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="text-red-800 font-medium">Error Loading Contracts</div>
            <div className="text-red-700 text-sm mt-1">{contractState.error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFVMContracts}
              className="mt-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};