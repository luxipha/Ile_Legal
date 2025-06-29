import algosdk from 'algosdk';
import { 
  AlgorandConfig, 
  DocumentHash, 
  AlgorandTransaction, 
  HashSubmissionResult, 
  HashVerificationResult,
  BlockchainError 
} from './types';

export class AlgorandService {
  private client: algosdk.Algodv2;
  private config: AlgorandConfig;

  constructor(config?: AlgorandConfig) {
    // Default to TestNet configuration
    this.config = config || {
      server: 'https://testnet-api.algonode.cloud',
      port: 443,
      token: '',
      network: 'testnet'
    };

    this.client = new algosdk.Algodv2(
      this.config.token,
      this.config.server,
      this.config.port
    );
  }

  /**
   * Get AlgoExplorer URL for a transaction
   */
  getExplorerUrl(txId: string): string {
    // Use Pera Explorer as it's more reliable
    return `https://testnet.explorer.perawallet.app/tx/${txId}`;
  }

  /**
   * Get network status and validate connection
   */
  async validateConnection(): Promise<{ connected: boolean; error?: BlockchainError }> {
    try {
      const status = await this.client.status().do();
      console.log('Algorand connection validated:', {
        network: this.config.network,
        lastRound: status.lastRound
      });
      
      return { connected: true };
    } catch (error) {
      console.error('Failed to connect to Algorand network:', error);
      return {
        connected: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: `Failed to connect to Algorand ${this.config.network}`,
          details: error
        }
      };
    }
  }

  /**
   * Submit document hash to Algorand blockchain as a note transaction
   */
  async submitDocumentHash(
    documentHash: DocumentHash,
    senderAccount: algosdk.Account
  ): Promise<HashSubmissionResult> {
    try {
      // Validate connection first
      const connectionCheck = await this.validateConnection();
      if (!connectionCheck.connected) {
        return {
          success: false,
          error: connectionCheck.error?.message || 'Network connection failed',
          documentHash
        };
      }

      // Get suggested transaction parameters
      const suggestedParams = await this.client.getTransactionParams().do();
      console.log('🔍 Suggested params debug:', suggestedParams);
      console.log('Genesis ID type:', typeof suggestedParams.genesisID);
      console.log('Genesis hash type:', typeof suggestedParams.genesisHash);

      // Create note with document hash and metadata
      const noteString = JSON.stringify({
        hash: documentHash.hash,
        fileName: documentHash.fileName,
        fileSize: documentHash.fileSize,
        algorithm: documentHash.algorithm,
        timestamp: documentHash.timestamp,
        purpose: 'document-verification'
      });
      const note = new TextEncoder().encode(noteString);

      // Create transaction (sending 0 ALGO to self with note containing hash)
      console.log('🔍 Transaction creation debug:');
      console.log('senderAccount exists:', !!senderAccount);
      console.log('senderAccount.addr exists:', !!senderAccount?.addr);
      console.log('senderAccount.addr value:', senderAccount?.addr);
      
      const fromAddress = senderAccount.addr.toString();
      const toAddress = senderAccount.addr.toString();
      console.log('From address:', fromAddress);
      console.log('To address:', toAddress);
      
      // Use correct parameter names for algosdk v3
      const txnParams = {
        sender: fromAddress,    // Changed from 'from' to 'sender'
        receiver: toAddress,    // Changed from 'to' to 'receiver'
        amount: 0,
        note: note,
        suggestedParams: suggestedParams
      };
      
      console.log('Transaction params:', txnParams);
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject(txnParams);

      // Sign transaction
      const signedTxn = txn.signTxn(senderAccount.sk);

      // Submit transaction
      console.log('🚀 Submitting transaction to Algorand...');
      console.log('Raw transaction size:', signedTxn.length, 'bytes');
      
      const submitResult = await this.client.sendRawTransaction(signedTxn).do();
      console.log('📝 Submit result:', submitResult);
      console.log('Submission successful:', !!submitResult.txid);
      
      // Extract transaction ID (correct field name is 'txid')
      const txId = submitResult.txid;
      console.log('Transaction ID extracted:', txId);
      
      // Verify transaction exists by querying it directly
      try {
        const txInfo = await this.client.pendingTransactionInformation(txId).do();
        console.log('🔍 Transaction info from Algorand API:', txInfo);
        
        // Check if transaction has an error
        if (txInfo.poolError && txInfo.poolError !== '') {
          console.error('❌ Transaction pool error:', txInfo.poolError);
          throw new Error(`Transaction failed: ${txInfo.poolError}`);
        }
        
        console.log('✅ Transaction in mempool successfully');
      } catch (verifyError) {
        console.log('⚠️ Could not verify transaction immediately:', verifyError);
        throw new Error(`Transaction verification failed: ${verifyError}`);
      }

      // Wait at least 1 round for confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      try {
        const confirmedTxn = await this.waitForConfirmation(txId, 3); // Wait max 3 rounds
        console.log('🎉 Transaction confirmed in round:', confirmedTxn.confirmedRound);
        
        const transaction: AlgorandTransaction = {
          txId,
          confirmedRound: confirmedTxn.confirmedRound,
          fee: Number(txn.fee),
          timestamp: new Date().toISOString()
        };
        
        return {
          success: true,
          transaction,
          documentHash
        };
        
      } catch (confirmError) {
        console.warn('⚠️ Confirmation timeout, but transaction was submitted:', confirmError);
        // Return success even if confirmation times out
      }
      
      const transaction: AlgorandTransaction = {
        txId,
        confirmedRound: 0, // Will be confirmed later by network
        fee: Number(txn.fee), // Convert bigint to number
        timestamp: new Date().toISOString()
      };

      console.log('Document hash submitted successfully:', {
        txId,
        hash: documentHash.hash.substring(0, 16) + '...',
        status: 'submitted'
      });

      return {
        success: true,
        transaction,
        documentHash
      };

    } catch (error) {
      console.error('Failed to submit document hash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        documentHash
      };
    }
  }

  /**
   * Verify if a document hash exists on the blockchain
   */
  async verifyDocumentHash(
    documentHash: DocumentHash
  ): Promise<HashVerificationResult> {
    try {
      console.log('🔍 Searching blockchain for hash:', documentHash.hash.substring(0, 16) + '...');
      
      // First check localStorage for recently submitted transactions
      const stored = localStorage.getItem('algorand_transactions');
      if (stored) {
        try {
          const transactions = JSON.parse(stored);
          const found = transactions.find((tx: any) => tx.hash === documentHash.hash);
          
          if (found) {
            console.log('✅ Document hash found in local transaction history');
            return {
              exists: true,
              transaction: {
                txId: found.txId,
                confirmedRound: found.confirmedRound || 0,
                fee: found.fee || 1000,
                timestamp: found.timestamp
              },
              documentHash,
              verificationTimestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.error('Error checking localStorage:', error);
        }
      }

      // Try to search actual blockchain transactions (limited in browser)
      console.log('🔍 Checking recent blockchain transactions...');
      
      // For production, you would use Algorand Indexer API to search transactions
      // Since we don't have indexer access in this demo, we return not found
      console.log('⚠️ Document hash not found in recent transactions');
      
      return {
        exists: false,
        documentHash,
        verificationTimestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save transaction to localStorage for verification
   */
  saveTransaction(transaction: AlgorandTransaction, documentHash: DocumentHash): void {
    const stored = localStorage.getItem('algorand_transactions');
    const transactions = stored ? JSON.parse(stored) : [];
    
    // Add hash to transaction object for verification
    const txWithHash = {
      ...transaction,
      hash: documentHash.hash,
      fileName: documentHash.fileName,
      fileSize: documentHash.fileSize
    };
    
    transactions.unshift(txWithHash);
    
    // Keep only last 50 transactions
    if (transactions.length > 50) {
      transactions.splice(50);
    }
    
    localStorage.setItem('algorand_transactions', JSON.stringify(transactions));
    console.log('💾 Transaction saved to localStorage for verification');
  }

  /**
   * Get transaction details by ID
   */
  async getTransactionDetails(txId: string): Promise<any> {
    try {
      const txInfo = await this.client.pendingTransactionInformation(txId).do();
      return txInfo;
    } catch (error) {
      throw new Error(`Failed to get transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForConfirmation(txId: string, maxRounds: number = 5): Promise<any> {
    const status = await this.client.status().do();
    let lastRound = status.lastRound;

    for (let round = 0; round < maxRounds; round++) {
      try {
        const pendingInfo = await this.client.pendingTransactionInformation(txId).do();
        
        if (pendingInfo.confirmedRound !== null && pendingInfo.confirmedRound !== undefined && pendingInfo.confirmedRound > 0) {
          return {
            confirmedRound: pendingInfo.confirmedRound,
            txId: txId
          };
        }

        lastRound++;
        await this.client.statusAfterBlock(lastRound).do();
      } catch (error) {
        throw new Error(`Transaction confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error('Transaction not confirmed within expected rounds');
  }

  /**
   * Create a test account (for development/testing only)
   */
  static createTestAccount(): algosdk.Account {
    return algosdk.generateAccount();
  }

  /**
   * Get account information
   */
  async getAccountInfo(address: string): Promise<any> {
    try {
      return await this.client.accountInformation(address).do();
    } catch (error) {
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Static method for simple document hash submission (for IPFS integration)
   */
  static async submitDocumentHash(fileHash: string): Promise<string> {
    try {
      // Check if we have production Algorand credentials
      const algorandMnemonic = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ALGORAND_MNEMONIC : process.env.VITE_ALGORAND_MNEMONIC) || '';
      const algorandNetwork = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ALGORAND_NETWORK : process.env.VITE_ALGORAND_NETWORK) || 'testnet';
      
      console.log('🔍 ENV DEBUG:');
      console.log('Network:', algorandNetwork);
      console.log('Mnemonic exists:', !!algorandMnemonic);
      console.log('Mnemonic first 10 chars:', algorandMnemonic.substring(0, 10) + '...');
      
      if (!algorandMnemonic) {
        throw new Error('🔄 Algorand credentials not configured - VITE_ALGORAND_MNEMONIC is missing');
        // COMMENTED OUT MOCK FOR DEBUGGING:
        // const mockTxId = `${algorandNetwork.toUpperCase()}_DEV_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        // console.log(`📝 Mock Algorand transaction: ${mockTxId}`);
        // return mockTxId;
      }
      
      // Production mode: use real Algorand account
      console.log('🔗 Submitting to real Algorand blockchain...');
      
      // Create service instance
      const service = new AlgorandService();
      
      // Create account from mnemonic
      console.log('🔑 Converting mnemonic to account...');
      console.log('Mnemonic length:', algorandMnemonic.split(' ').length, 'words');
      const account = algosdk.mnemonicToSecretKey(algorandMnemonic);
      console.log('Account address:', account.addr.toString());
      console.log('Account created successfully:', !!account.addr);
      
      // Validate account has funds (optional check)
      try {
        const accountInfo = await service.getAccountInfo(account.addr.toString());
        if (accountInfo.amount < 100000) { // 0.1 ALGO minimum
          console.warn('⚠️ Low account balance, transaction may fail');
        }
      } catch (balanceError) {
        console.warn('Could not check account balance:', balanceError);
      }
      
      // Create document hash object
      const documentHash: DocumentHash = {
        hash: fileHash,
        fileName: 'legal-document',
        fileSize: 0,
        algorithm: 'SHA-256',
        timestamp: new Date().toISOString()
      };
      
      // Submit to blockchain
      const result = await service.submitDocumentHash(documentHash, account);
      
      if (result.success && result.transaction) {
        console.log(`✅ Successfully submitted to Algorand: ${result.transaction.txId}`);
        return result.transaction.txId;
      } else {
        throw new Error(result.error || 'Failed to submit to blockchain');
      }
    } catch (error) {
      console.error('Algorand submission error:', error);
      // COMMENTED OUT FALLBACK FOR DEBUGGING:
      // const mockTxId = `DEV_FALLBACK_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      // console.log(`🔄 Using fallback transaction ID: ${mockTxId}`);
      // return mockTxId;
      throw error; // Let the real error bubble up
    }
  }
}

// Export default instance for convenience
export const algorandService = new AlgorandService();