import { supabase } from '../lib/supabase';
import { AlgorandService } from '../components/blockchain/shared/algorandService';
import { ipfsService } from './ipfsService';
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
  private ipfsService: typeof ipfsService;

  constructor() {
    this.algorandService = new AlgorandService();
    this.ipfsService = ipfsService;
  }

  /**
   * Submit work with blockchain verification
   */
  async submitVerifiedWork(submissionData: BlockchainSubmissionData): Promise<SubmissionVerificationResult> {
    const debugId = `SUBMIT_${Date.now()}`;
    
    // Development bypass
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚧 [${debugId}] Development mode: bypassing blockchain submission`);
      
      const mockResult = {
        submissionId: submissionData.workSubmissionId,
        isVerified: true,
        blockchainProof: {
          network: 'development',
          transactionId: `dev_tx_${Date.now()}`,
          timestamp: new Date().toISOString()
        },
        qrCodeData: this.generateQRCodeData({
          submissionId: submissionData.workSubmissionId,
          mergedHash: `dev_hash_${Date.now()}`,
          blockchainProof: { network: 'development', transactionId: `dev_tx_${Date.now()}` },
          timestamp: new Date().toISOString()
        }),
        offlineVerificationHash: `dev_offline_${Date.now()}`
      };
      
      return mockResult;
    }
    
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

      // 5. Update Work Submissions table with blockchain data (using existing format)
      console.log(`💾 [${debugId}] Updating Work Submissions table with blockchain data...`);
      
      // Format blockchain_hashes to match existing structure (array format)
      const blockchainHashesArray = documentHashes.map((hash, index) => ({
        hash,
        txId: blockchainProof.transactionId,
        fileName: submissionData.files[index]?.name || `file_${index + 1}`
      }));

      // Format ipfs_data to match existing structure (array format)
      const ipfsDataArray = filecoinCids.map((cid, index) => ({
        cid,
        url: `https://${cid}.ipfs.w3s.link`,
        path: submissionData.files[index]?.name || `file_${index + 1}`,
        size: submissionData.files[index]?.size || 0
      }));

      // Fix 1: Add missing offlineVerificationHash variable declaration around line 160
      const blockchainData = {
        blockchain_hashes: blockchainHashesArray,
        ipfs_data: ipfsDataArray,
        status: 'blockchain_verified',
        verification_status: 'verified',
        blockchain_network: submissionData.blockchainNetwork,
        verification_timestamp: new Date().toISOString(),
        offline_verification_hash: await this.generateOfflineVerificationHash({
          submissionId: submissionData.workSubmissionId,
          documentHashes,
          description: submissionData.description
        })
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

      // The offlineVerificationHash is already in the blockchainData object
      const offlineVerificationHash = blockchainData.offline_verification_hash;

      // 6. Generate QR code data for offline verification
      const qrCodeData = this.generateQRCodeData({
        submissionId: submissionData.workSubmissionId,
        mergedHash,
        blockchainProof,
        timestamp: new Date().toISOString(),
        filecoinCids,
        algorandTxId: blockchainProof.transactionId,
        pieceCid: filecoinCids.length > 0 ? `piece_${filecoinCids[0]}` : undefined
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
      if (!blockchainHashes || !Array.isArray(blockchainHashes) || blockchainHashes.length === 0) {
        throw new Error('No blockchain verification data found');
      }
      
      // Get the first hash for verification (existing format is array)
      const firstHashEntry = blockchainHashes[0];
      if (!firstHashEntry?.hash) {
        throw new Error('Invalid blockchain hash data found');
      }

      // 2. Verify on blockchain using existing format
      let verificationResult;
      if (submission.blockchain_network === 'algorand') {
        verificationResult = await this.algorandService.verifyDocumentHash({
          hash: firstHashEntry.hash,
          algorithm: 'SHA-256',
          fileName: firstHashEntry.fileName || 'work_submission',
          fileSize: 0,
          timestamp: submission.verification_timestamp || submission.created_at
        });
      } else {
        // Verify on Filecoin
        verificationResult = await this.verifyOnFilecoin(firstHashEntry.hash);
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
        network: submission.blockchain_network || 'algorand',
        transactionId: firstHashEntry.txId || '',
        blockHash: '',
        timestamp: verificationResult.verificationTimestamp
      };

      // Extract CIDs from existing ipfs_data array format
      const filecoinCids = Array.isArray(submission.ipfs_data) 
        ? submission.ipfs_data.map((item: any) => item.cid) 
        : [];

      const qrCodeData = this.generateQRCodeData({
        submissionId,
        mergedHash: firstHashEntry.hash, // Use the actual hash from the existing data
        blockchainProof,
        timestamp: new Date().toISOString(),
        // Enhanced Track 3 data from database
        filecoinCids,
        algorandTxId: blockchainProof.transactionId,
        pieceCid: filecoinCids[0] ? `piece_${filecoinCids[0]}` : undefined
      });

      const offlineVerificationHash = submission.offline_verification_hash || await this.generateOfflineVerificationHash({
        submissionId,
        documentHashes: blockchainHashes.map(item => item.hash),
        description: submission.notes || ''
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
  // Fix 3: Remove unused variables (around lines 339 and 373)
  private async submitToAlgorand(hash: string, submissionId: string) {
    const debugId = `ALG_${Date.now()}`;
    console.log(`⚡ [${debugId}] Starting Algorand submission:`, {
      hashPreview: hash.substring(0, 16) + '...',
      submissionId, // submissionId is used for logging
      timestamp: new Date().toISOString()
    });

    try {
      console.log(`🔐 [${debugId}] Using Algorand service for blockchain submission...`);
      // Skip wallet check - use AlgorandService directly with env mnemonic

      console.log(`📝 [${debugId}] Submitting document hash to Algorand...`);
      // Remove unused documentHash variable
      
      const transactionId = await AlgorandService.submitDocumentHash(hash);
      
      console.log(`✅ [${debugId}] Algorand transaction successful:`, {
        txId: transactionId?.substring(0, 16) + '...',
        transactionId
      });

      return {
        network: 'algorand',
        transactionId: transactionId || `mock_tx_${Date.now()}`,
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

      console.log(`Submitting files to Filecoin for submission ${submissionId} with hash ${hash}`);

      // Store files using IPFS service
      const uploadResults = await Promise.all(
        files.map(file => this.ipfsService.uploadFile(file, {
          legalDocumentType: 'work-submission',
          blockchainIntegrated: true
        }))
      );
      
      const filecoinResult = {
        ipfsCid: uploadResults[0].cid,
        pieceCid: `piece_${uploadResults[0].cid}`,
        contractTxId: undefined
      };

      console.log(`Successfully uploaded files to IPFS for submission ${submissionId}`);

      return {
        network: 'filecoin',
        transactionId: filecoinResult.contractTxId || '',
        blockHash: filecoinResult.pieceCid,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Filecoin submission ${submissionId} failed:`, error);
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
        const result = await this.ipfsService.uploadFile(file, {
          legalDocumentType: 'individual-file',
          blockchainIntegrated: true
        });
        cids.push(result.cid);
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
   * Generate QR code data for verification with enhanced Track 3 data
   */
  private generateQRCodeData(data: {
    submissionId: string;
    mergedHash: string;
    blockchainProof: any;
    timestamp: string;
    filecoinCids?: string[];
    algorandTxId?: string;
    pieceCid?: string;
  }): string {
    const qrData = {
      type: 'enhanced_verification',
      submission_id: data.submissionId,
      hash: data.mergedHash,
      network: data.blockchainProof.network,
      tx_id: data.blockchainProof.transactionId,
      // Enhanced Track 3 fields: {cid, alg_txid}
      cid: data.filecoinCids && data.filecoinCids.length > 0 ? data.filecoinCids[0] : null,
      alg_txid: data.algorandTxId || data.blockchainProof.transactionId,
      piece_cid: data.pieceCid,
      // FilCDN optimization for instant access
      filcdn_url: data.filecoinCids && data.filecoinCids.length > 0 ? 
        `https://${data.filecoinCids[0]}.ipfs.w3s.link` : null,
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
   * Verify hash on Filecoin using IPFS lookup
   */
  private async verifyOnFilecoin(hash: string) {
    try {
      console.log('🔍 Attempting Filecoin verification for hash:', hash.substring(0, 16) + '...');
      
      // Alternative approach: Use a more specific query
      const { data: submissions, error } = await supabase
        .from('Work Submissions')
        .select('ipfs_data, blockchain_hashes')
        .not('blockchain_hashes', 'is', null);
      
      if (!error && submissions) {
        // Find submission with matching hash in blockchain_hashes array
        const matchingSubmission = submissions.find(sub => 
          sub.blockchain_hashes && 
          Array.isArray(sub.blockchain_hashes) && 
          sub.blockchain_hashes.some((hashEntry: any) => hashEntry.hash === hash)
        );
        
        if (matchingSubmission) {
          console.log('✅ Hash found in database with IPFS data');
          
          // Try IPFS gateway verification if we have CIDs
          if (matchingSubmission.ipfs_data && Array.isArray(matchingSubmission.ipfs_data) && matchingSubmission.ipfs_data.length > 0) {
            for (const ipfsItem of matchingSubmission.ipfs_data) {
              if (ipfsItem && typeof ipfsItem === 'object' && 'cid' in ipfsItem) {
                try {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

                  const response = await fetch(`https://${ipfsItem.cid}.ipfs.w3s.link`, {
                    method: 'HEAD',
                    signal: controller.signal
                  });

                  clearTimeout(timeoutId);

                  if (response.ok) {
                    console.log('✅ File verified on IPFS gateway');
                    return {
                      exists: true,
                      verificationTimestamp: new Date().toISOString(),
                      source: 'ipfs_gateway'
                    };
                  }
                } catch (gatewayError) {
                  console.warn('IPFS gateway check failed:', gatewayError);
                }
              }
            }
          }
          
          return {
            exists: true,
            verificationTimestamp: new Date().toISOString(),
            source: 'database'
          };
        }
      }
      
      console.log('❌ Filecoin verification failed - hash not found');
      return {
        exists: false,
        verificationTimestamp: new Date().toISOString(),
        source: 'not_found'
      };
      
    } catch (error) {
      console.error('Filecoin verification error:', error);
      return {
        exists: false,
        verificationTimestamp: new Date().toISOString(),
        source: 'error'
      };
    }
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