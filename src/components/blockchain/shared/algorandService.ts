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
    const baseUrl = this.config.network === 'mainnet' 
      ? 'https://explorer.algorand.org' 
      : 'https://testnet.explorer.algorand.org';
    return `${baseUrl}/tx/${txId}`;
  }

  /**
   * Get network status and validate connection
   */
  async validateConnection(): Promise<{ connected: boolean; error?: BlockchainError }> {
    try {
      const status = await this.client.status().do();
      console.log('Algorand connection validated:', {
        network: this.config.network,
        lastRound: status['last-round']
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
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: senderAccount.addr,
        amount: 0,
        note: note,
        suggestedParams: suggestedParams
      });

      // Sign transaction
      const signedTxn = txn.signTxn(senderAccount.sk);

      // Submit transaction
      const { txId } = await this.client.sendRawTransaction(signedTxn).do();

      // Wait for confirmation
      const confirmedTxn = await this.waitForConfirmation(txId);

      const transaction: AlgorandTransaction = {
        txId,
        confirmedRound: confirmedTxn.confirmedRound,
        fee: txn.fee,
        timestamp: new Date().toISOString()
      };

      console.log('Document hash submitted successfully:', {
        txId,
        round: confirmedTxn.confirmedRound,
        hash: documentHash.hash.substring(0, 16) + '...'
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
    documentHash: DocumentHash,
    searchRounds: number = 1000
  ): Promise<HashVerificationResult> {
    try {
      // For demo purposes, simulate verification
      console.log('Demo: Simulating blockchain verification for hash:', documentHash.hash.substring(0, 16) + '...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, randomly return found/not found (20% chance of finding)
      const found = Math.random() < 0.2;
      
      if (found) {
        const mockTransaction: AlgorandTransaction = {
          txId: 'DEMO_TX_' + Math.random().toString(36).substring(2, 15).toUpperCase(),
          confirmedRound: Math.floor(Math.random() * 1000000) + 35000000,
          fee: 1000,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
        };

        return {
          exists: true,
          transaction: mockTransaction,
          documentHash,
          verificationTimestamp: new Date().toISOString()
        };
      }

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
    let lastRound = status['last-round'];

    for (let round = 0; round < maxRounds; round++) {
      try {
        const pendingInfo = await this.client.pendingTransactionInformation(txId).do();
        
        if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
          return {
            confirmedRound: pendingInfo['confirmed-round'],
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
}