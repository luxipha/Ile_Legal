import { supabase } from '../lib/supabase';
import { AlgorandService } from '../components/blockchain/shared/algorandService';
import { filecoinStorageService } from './filecoinStorageService';
import { HashUtils } from '../components/blockchain/shared/hashUtils';
import { unifiedWalletService } from './unifiedWalletService';

export interface BlockchainSubmissionData {
  workSubmissionId: string;
  files: File[];
  description: string;
  blockchainNetwork: 'algorand' | 'filecoin';
  verificationData?: {
    documentHashes: string[];
    mergedHash?: string;
    algorandTxId?: string;
    filecoinPieceCid?: string;
  };
}

export interface SubmissionVerificationResult {
  submissionId: string;
  isVerified: boolean;
  blockchainProof: {
    network: string;
    transactionId: string;
    blockHash?: string;
    timestamp: string;
  };
  qrCodeData: string;
  offlineVerificationHash: string;
}

class BlockchainVerifiedSubmissionService {
  private algorandService: AlgorandService;
  private filecoinService: typeof filecoinStorageService;

  constructor() {
    this.algorandService = new AlgorandService();
    this.filecoinService = filecoinStorageService;
  }

  /**
   * Submit work with blockchain verification
   */
  async submitVerifiedWork(submissionData: BlockchainSubmissionData): Promise<SubmissionVerificationResult> {
    const debugId = `SUBMIT_${Date.now()}`;
    console.log(`🚀 [${debugId}] Starting blockchain verified submission:`, {
      workSubmissionId: submissionData.workSubmissionId,
      fileCount: submissionData.files.length,
      network: submissionData.blockchainNetwork,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Process and hash all files
      console.log(`📁 [${debugId}] Processing ${submissionData.files.length} files for hashing...`);
      const fileResults = await HashUtils.hashMultipleFiles(submissionData.files);
      const documentHashes = fileResults.map(result => result.hash);
      
      console.log(`✅ [${debugId}] File hashing completed:`, {
        totalFiles: fileResults.length,
        hashes: documentHashes.map((hash, i) => ({
          file: submissionData.files[i].name,
          hash: hash.substring(0, 16) + '...',
          size: submissionData.files[i].size
        }))
      });
      
      // 2. Create merged hash for blockchain submission
      const mergedContent = documentHashes.join('|') + '|' + submissionData.description;
      console.log(`🔗 [${debugId}] Creating merged hash from content:`, {
        contentPreview: mergedContent.substring(0, 100) + '...',
        contentLength: mergedContent.length
      });
      
      const mergedHash = await this.generateMergedHash(mergedContent);
      console.log(`✅ [${debugId}] Merged hash generated:`, {
        mergedHash: mergedHash.substring(0, 16) + '...',
        fullLength: mergedHash.length
      });

      // 3. Submit to blockchain based on network preference
      console.log(`🌐 [${debugId}] Submitting to blockchain network: ${submissionData.blockchainNetwork}`);
      let blockchainProof;
      if (submissionData.blockchainNetwork === 'algorand') {
        console.log(`⚡ [${debugId}] Using Algorand network for submission`);
        blockchainProof = await this.submitToAlgorand(mergedHash, submissionData.workSubmissionId);
      } else {
        console.log(`🗃️ [${debugId}] Using Filecoin network for submission`);
        blockchainProof = await this.submitToFilecoin(submissionData.files, mergedHash, submissionData.workSubmissionId);
      }
      
      console.log(`✅ [${debugId}] Blockchain submission completed:`, {
        network: blockchainProof.network,
        transactionId: blockchainProof.transactionId.substring(0, 16) + '...',
        timestamp: blockchainProof.timestamp
      });

      // 4. Store individual files in Filecoin for redundancy
      console.log(`💾 [${debugId}] Storing ${submissionData.files.length} files in Filecoin for redundancy...`);
      const filecoinCids = await this.storeFilesInFilecoin(submissionData.files);
      console.log(`✅ [${debugId}] Filecoin redundant storage completed:`, {
        cidCount: filecoinCids.length,
        cids: filecoinCids.map(cid => cid.substring(0, 16) + '...')
      });

      // 5. Update Work Submissions table with blockchain data
      console.log(`💾 [${debugId}] Updating Work Submissions table with blockchain data...`);
      const blockchainData = {
        blockchain_hashes: {
          individual_hashes: documentHashes,
          merged_hash: mergedHash,
          algorithm: 'SHA-256',
          timestamp: new Date().toISOString()
        },
        ipfs_data: {
          filecoin_cids: filecoinCids,
          primary_storage: submissionData.blockchainNetwork,
          redundant_storage: 'filecoin'
        },
        status: 'blockchain_verified',
        verification_status: 'verified'
      };
      
      console.log(`📝 [${debugId}] Database update payload:`, {
        submissionId: submissionData.workSubmissionId,
        hashCount: documentHashes.length,
        primaryStorage: submissionData.blockchainNetwork,
        cidCount: filecoinCids.length
      });

      const { data: updatedSubmission, error: updateError } = await supabase
        .from('Work Submissions')
        .update(blockchainData)
        .eq('id', submissionData.workSubmissionId)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ [${debugId}] Database update failed:`, {
          error: updateError.message,
          code: updateError.code,
          details: updateError.details
        });
        throw updateError;
      }
      
      console.log(`✅ [${debugId}] Database update successful:`, {
        submissionId: updatedSubmission?.id,
        status: updatedSubmission?.status
      });

      // 6. Generate QR code data for offline verification
      const qrCodeData = this.generateQRCodeData({
        submissionId: submissionData.workSubmissionId,
        mergedHash,
        blockchainProof,
        timestamp: new Date().toISOString()
      });

      // 7. Create offline verification hash
      const offlineVerificationHash = await this.generateOfflineVerificationHash({
        submissionId: submissionData.workSubmissionId,
        documentHashes,
        description: submissionData.description
      });

      return {
        submissionId: submissionData.workSubmissionId,
        isVerified: true,
        blockchainProof,
        qrCodeData,
        offlineVerificationHash
      };

    } catch (error) {
      console.error(`❌ [${debugId}] Blockchain submission failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId: submissionData.workSubmissionId,
        network: submissionData.blockchainNetwork,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to submit work to blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a submitted work using blockchain
   */
  async verifySubmission(submissionId: string): Promise<SubmissionVerificationResult | null> {
    try {
      // 1. Get submission data from database
      const { data: submission, error } = await supabase
        .from('Work Submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error || !submission) {
        throw new Error('Submission not found');
      }

      const blockchainHashes = submission.blockchain_hashes;
      if (!blockchainHashes?.merged_hash) {
        throw new Error('No blockchain verification data found');
      }

      // 2. Verify on blockchain
      let verificationResult;
      if (submission.ipfs_data?.primary_storage === 'algorand') {
        verificationResult = await this.algorandService.verifyDocumentHash({
          hash: blockchainHashes.merged_hash,
          algorithm: 'SHA-256',
          fileName: 'work_submission',
          fileSize: 0,
          timestamp: blockchainHashes.timestamp
        });
      } else {
        // Verify on Filecoin
        verificationResult = await this.verifyOnFilecoin(blockchainHashes.merged_hash);
      }

      if (!verificationResult.exists) {
        return {
          submissionId,
          isVerified: false,
          blockchainProof: {
            network: 'unknown',
            transactionId: '',
            timestamp: new Date().toISOString()
          },
          qrCodeData: '',
          offlineVerificationHash: ''
        };
      }

      // 3. Generate verification response
      const blockchainProof = {
        network: submission.ipfs_data?.primary_storage || 'algorand',
        transactionId: verificationResult.transaction?.txId || '',
        blockHash: verificationResult.transaction?.confirmedRound?.toString(),
        timestamp: verificationResult.verificationTimestamp
      };

      const qrCodeData = this.generateQRCodeData({
        submissionId,
        mergedHash: blockchainHashes.merged_hash,
        blockchainProof,
        timestamp: new Date().toISOString()
      });

      const offlineVerificationHash = await this.generateOfflineVerificationHash({
        submissionId,
        documentHashes: blockchainHashes.individual_hashes,
        description: submission.description || ''
      });

      return {
        submissionId,
        isVerified: true,
        blockchainProof,
        qrCodeData,
        offlineVerificationHash
      };

    } catch (error) {
      console.error('Verification failed:', error);
      throw new Error(`Failed to verify submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit hash to Algorand blockchain
   */
  private async submitToAlgorand(hash: string, submissionId: string) {
    const debugId = `ALG_${Date.now()}`;
    console.log(`⚡ [${debugId}] Starting Algorand submission:`, {
      hashPreview: hash.substring(0, 16) + '...',
      submissionId,
      timestamp: new Date().toISOString()
    });

    try {
      console.log(`🔐 [${debugId}] Checking wallet connection...`);
      const wallet = await unifiedWalletService.getActiveWallet();
      if (!wallet || wallet.network !== 'algorand') {
        console.error(`❌ [${debugId}] Wallet check failed:`, {
          hasWallet: !!wallet,
          network: wallet?.network,
          expected: 'algorand'
        });
        throw new Error('No active Algorand wallet found');
      }

      console.log(`✅ [${debugId}] Wallet verified:`, {
        network: wallet.network,
        hasAddress: !!wallet.address
      });

      console.log(`📝 [${debugId}] Submitting document hash to Algorand...`);
      const documentHash = {
        hash,
        algorithm: 'SHA-256',
        fileName: `work_submission_${submissionId}`,
        fileSize: 0,
        timestamp: new Date().toISOString()
      };

      const transaction = await this.algorandService.submitDocumentHash(documentHash);
      
      console.log(`✅ [${debugId}] Algorand transaction successful:`, {
        txId: transaction.txId?.substring(0, 16) + '...',
        confirmedRound: transaction.confirmedRound
      });

      return {
        network: 'algorand',
        transactionId: transaction.txId,
        blockHash: transaction.confirmedRound?.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [${debugId}] Algorand submission failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId,
        hashPreview: hash.substring(0, 16) + '...'
      });
      throw new Error(`Algorand submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit files to Filecoin with FVM contracts
   */
  private async submitToFilecoin(files: File[], hash: string, submissionId: string) {
    try {
      const wallet = await unifiedWalletService.getActiveWallet();
      if (!wallet || wallet.network !== 'filecoin') {
        throw new Error('No active Filecoin wallet found');
      }

      // Store files and get piece CID
      const filecoinResult = await this.filecoinService.storeFiles(files, {
        description: `Work submission ${submissionId}`,
        metadata: {
          submissionId,
          verificationHash: hash,
          timestamp: new Date().toISOString()
        }
      });

      return {
        network: 'filecoin',
        transactionId: filecoinResult.contractTxId || '',
        blockHash: filecoinResult.pieceCid,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Filecoin submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store files in Filecoin for redundant storage
   */
  private async storeFilesInFilecoin(files: File[]): Promise<string[]> {
    try {
      const cids: string[] = [];
      for (const file of files) {
        const result = await this.filecoinService.storeFiles([file], {
          description: `Individual file: ${file.name}`,
          metadata: { filename: file.name, size: file.size }
        });
        cids.push(result.ipfsCid);
      }
      return cids;
    } catch (error) {
      console.warn('Failed to store files in Filecoin for redundancy:', error);
      return [];
    }
  }

  /**
   * Generate merged hash from multiple document hashes
   */
  private async generateMergedHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate QR code data for verification
   */
  private generateQRCodeData(data: {
    submissionId: string;
    mergedHash: string;
    blockchainProof: any;
    timestamp: string;
  }): string {
    const qrData = {
      type: 'gig_verification',
      submission_id: data.submissionId,
      hash: data.mergedHash,
      network: data.blockchainProof.network,
      tx_id: data.blockchainProof.transactionId,
      verified_at: data.timestamp,
      verification_url: `${window.location.origin}/verify/${data.submissionId}`
    };
    
    return JSON.stringify(qrData);
  }

  /**
   * Generate offline verification hash
   */
  private async generateOfflineVerificationHash(data: {
    submissionId: string;
    documentHashes: string[];
    description: string;
  }): Promise<string> {
    const offlineData = {
      submission_id: data.submissionId,
      document_hashes: data.documentHashes,
      description: data.description,
      timestamp: new Date().toISOString()
    };
    
    const content = JSON.stringify(offlineData);
    return this.generateMergedHash(content);
  }

  /**
   * Verify hash on Filecoin (placeholder - needs FVM integration)
   */
  private async verifyOnFilecoin(hash: string) {
    // TODO: Implement Filecoin verification using FVM contracts
    console.log('Filecoin verification not yet implemented for hash:', hash);
    return {
      exists: false,
      verificationTimestamp: new Date().toISOString()
    };
  }

  /**
   * Get submission verification status
   */
  async getSubmissionStatus(submissionId: string) {
    const { data: submission, error } = await supabase
      .from('Work Submissions')
      .select('verification_status, blockchain_hashes, ipfs_data, status')
      .eq('id', submissionId)
      .single();

    if (error) throw error;

    return {
      submissionId,
      verificationStatus: submission.verification_status || 'pending',
      hasBlockchainData: !!submission.blockchain_hashes,
      hasFilecoinStorage: !!submission.ipfs_data,
      status: submission.status
    };
  }
}

export const blockchainVerifiedSubmissionService = new BlockchainVerifiedSubmissionService();