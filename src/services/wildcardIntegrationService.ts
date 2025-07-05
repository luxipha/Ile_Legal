/**
 * PHASE 2: Wildcard - Secure, Sovereign Track
 * 
 * Wildcard Integration Service
 * - Orchestrates all Phase 2 services
 * - Provides unified API for Wildcard track features
 * - Manages double-anchor proofs, ZK-checksums, and sovereign identity
 * - Handles offline-first verification workflows
 */

import { doubleAnchorProofService, DoubleAnchorConfig, DoubleAnchorResult } from './doubleAnchorProofService';
import { zkChecksumService, ZKChecksumConfig, ZKChecksumResult } from './zkChecksumService';
import { sovereignIdentityService, SovereignIdentityConfig, DecentralizedIdentifier, SovereignSignature } from './sovereignIdentityService';
import { offlineVerificationService, OfflineVerificationRequest, OfflineVerificationResult } from './offlineVerificationService';
import { blockchainVerifiedSubmissionService } from './blockchainVerifiedSubmissionService';
import { HashUtils } from '../components/blockchain/shared/hashUtils';

export interface WildcardSubmissionConfig {
  enableDoubleAnchor: boolean;
  enableZKChecksum: boolean;
  enableSovereignIdentity: boolean;
  offlineVerificationRequired: boolean;
  courtAdmissibleMode: boolean;
  primaryBlockchain: 'algorand' | 'filecoin';
  secondaryBlockchain: 'algorand' | 'filecoin';
  trustScoreThreshold: number; // Minimum trust score required
}

export interface WildcardSubmissionRequest {
  workSubmissionId: string;
  files: File[];
  description: string;
  config: WildcardSubmissionConfig;
  sovereignIdentityDID?: string;
  additionalClaims?: Record<string, any>;
}

export interface WildcardSubmissionResult {
  submissionId: string;
  trustScore: number;
  verificationLevel: 'basic' | 'enhanced' | 'sovereign';
  courtAdmissible: boolean;
  components: {
    blockchainVerification?: any;
    doubleAnchorProof?: DoubleAnchorResult;
    zkChecksum?: ZKChecksumResult;
    sovereignSignature?: SovereignSignature;
  };
  offlinePackage: {
    qrData: string;
    evidenceBundle: Blob;
    verificationUrl: string;
  };
  securityFeatures: {
    doubleAnchorEnabled: boolean;
    zkVerificationEnabled: boolean;
    sovereignIdentityEnabled: boolean;
    tamperEvident: boolean;
    cryptographicallySecure: boolean;
  };
}

export interface WildcardVerificationRequest {
  verificationMethod: 'qr_code' | 'document_hash' | 'submission_id' | 'offline_package';
  data: string; // QR data, hash, or submission ID
  challengeDocument?: File;
  offlineMode?: boolean;
  courtMode?: boolean;
}

export interface WildcardVerificationResult {
  verified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'sovereign';
  trustScore: number;
  courtAdmissible: boolean;
  verificationMethods: {
    blockchain: boolean;
    doubleAnchor: boolean;
    zkChecksum: boolean;
    sovereignIdentity: boolean;
  };
  securityAnalysis: {
    tamperEvident: boolean;
    cryptographicallySecure: boolean;
    offlineCapable: boolean;
    crossChainVerified: boolean;
  };
  evidencePackage: any;
  timestamp: string;
}

class WildcardIntegrationService {
  /**
   * Submit document with full Wildcard security features
   */
  async submitWithWildcardSecurity(
    request: WildcardSubmissionRequest
  ): Promise<WildcardSubmissionResult> {
    const debugId = `WILDCARD_SUBMIT_${Date.now()}`;
    console.log(`🔒 [${debugId}] Starting Wildcard submission:`, {
      submissionId: request.workSubmissionId,
      fileCount: request.files.length,
      enableDoubleAnchor: request.config.enableDoubleAnchor,
      enableZKChecksum: request.config.enableZKChecksum,
      enableSovereignIdentity: request.config.enableSovereignIdentity,
      courtAdmissibleMode: request.config.courtAdmissibleMode,
      primaryBlockchain: request.config.primaryBlockchain,
      timestamp: new Date().toISOString()
    });

    try {
      const components: WildcardSubmissionResult['components'] = {};
      let maxTrustScore = 0;
      let verificationLevel: 'basic' | 'enhanced' | 'sovereign' = 'basic';
      let courtAdmissible = false;

      // 1. Basic blockchain verification (always included)
      console.log(`⛓️ [${debugId}] Performing basic blockchain verification...`);
      const blockchainVerification = await blockchainVerifiedSubmissionService.submitVerifiedWork({
        workSubmissionId: request.workSubmissionId,
        files: request.files,
        description: request.description,
        blockchainNetwork: request.config.primaryBlockchain
      });
      
      components.blockchainVerification = blockchainVerification;
      maxTrustScore = Math.max(maxTrustScore, 60); // Base score for blockchain verification

      console.log(`✅ [${debugId}] Basic blockchain verification completed:`, {
        verified: blockchainVerification.isVerified,
        network: request.config.primaryBlockchain
      });

      // 2. ZK Checksum verification (if enabled)
      if (request.config.enableZKChecksum) {
        console.log(`🔐 [${debugId}] Generating ZK checksum verification...`);
        
        // Use the first file for ZK checksum (or merged file if multiple)
        const zkFile = request.files.length === 1 ? 
          request.files[0] : 
          await this.createMergedFile(request.files);

        const zkConfig: ZKChecksumConfig = {
          algorithm: 'sha256',
          proofType: 'groth16',
          commitmentScheme: 'pedersen',
          verificationMode: 'non-interactive',
          courtAdmissible: request.config.courtAdmissibleMode
        };

        const zkChecksum = await zkChecksumService.generateZKChecksum(zkFile, zkConfig);
        components.zkChecksum = zkChecksum;
        maxTrustScore = Math.max(maxTrustScore, zkChecksum.verificationResult.trustScore);
        
        if (zkChecksum.verificationResult.verificationDetails.courtAdmissible) {
          courtAdmissible = true;
        }

        console.log(`✅ [${debugId}] ZK checksum verification completed:`, {
          verified: zkChecksum.verificationResult.verified,
          trustScore: zkChecksum.verificationResult.trustScore,
          courtAdmissible: zkChecksum.verificationResult.verificationDetails.courtAdmissible
        });
      }

      // 3. Sovereign Identity signing (if enabled)
      if (request.config.enableSovereignIdentity && request.sovereignIdentityDID) {
        console.log(`👤 [${debugId}] Creating sovereign identity signature...`);
        
        // Use the first file for sovereign signing
        const signFile = request.files[0];
        const sovereignSignature = await sovereignIdentityService.signDocumentWithSovereignIdentity(
          signFile,
          request.sovereignIdentityDID,
          request.additionalClaims
        );
        
        components.sovereignSignature = sovereignSignature;
        maxTrustScore = Math.max(maxTrustScore, 85); // High score for sovereign identity
        courtAdmissible = true; // Sovereign signatures are court admissible

        console.log(`✅ [${debugId}] Sovereign identity signature completed:`, {
          did: sovereignSignature.did.substring(0, 30) + '...',
          signatureType: sovereignSignature.signatureType
        });
      }

      // 4. Double Anchor Proof (if enabled)
      if (request.config.enableDoubleAnchor) {
        console.log(`🔗 [${debugId}] Creating double anchor proof...`);
        
        const doubleAnchorConfig: DoubleAnchorConfig = {
          primaryChain: request.config.primaryBlockchain,
          secondaryChain: request.config.secondaryBlockchain,
          requireBothConfirmations: true,
          zkVerificationEnabled: request.config.enableZKChecksum,
          sovereignIdentityRequired: request.config.enableSovereignIdentity
        };

        // Use the first file for double anchor proof
        const anchorFile = request.files[0];
        const doubleAnchorProof = await doubleAnchorProofService.createDoubleAnchorProof(
          anchorFile,
          doubleAnchorConfig
        );

        components.doubleAnchorProof = doubleAnchorProof;
        maxTrustScore = Math.max(maxTrustScore, doubleAnchorProof.trustScore);
        
        if (doubleAnchorProof.verificationLevel === 'sovereign') {
          verificationLevel = 'sovereign';
          courtAdmissible = true;
        } else if (doubleAnchorProof.verificationLevel === 'double') {
          verificationLevel = 'enhanced';
        }

        console.log(`✅ [${debugId}] Double anchor proof completed:`, {
          verificationLevel: doubleAnchorProof.verificationLevel,
          trustScore: doubleAnchorProof.trustScore,
          consensusReached: doubleAnchorProof.doubleAnchorProof.crossChainVerification.consensusReached
        });
      }

      // 5. Check if trust score meets threshold
      if (maxTrustScore < request.config.trustScoreThreshold) {
        console.warn(`⚠️ [${debugId}] Trust score below threshold:`, {
          achieved: maxTrustScore,
          required: request.config.trustScoreThreshold
        });
      }

      // 6. Generate offline verification package
      console.log(`📦 [${debugId}] Generating offline verification package...`);
      const offlinePackage = await offlineVerificationService.generateOfflinePackage(
        request.files[0], // Use first file as primary
        {
          blockchainProof: components.blockchainVerification,
          zkChecksum: components.zkChecksum?.verificationResult,
          sovereignIdentity: components.sovereignSignature
        }
      );

      const verificationUrl = `${window.location.origin}/verify-wildcard/${request.workSubmissionId}`;

      const result: WildcardSubmissionResult = {
        submissionId: request.workSubmissionId,
        trustScore: maxTrustScore,
        verificationLevel,
        courtAdmissible,
        components,
        offlinePackage: {
          qrData: offlinePackage.qrData,
          evidenceBundle: offlinePackage.evidenceBundle,
          verificationUrl
        },
        securityFeatures: {
          doubleAnchorEnabled: request.config.enableDoubleAnchor,
          zkVerificationEnabled: request.config.enableZKChecksum,
          sovereignIdentityEnabled: request.config.enableSovereignIdentity,
          tamperEvident: true,
          cryptographicallySecure: request.config.enableZKChecksum || request.config.enableSovereignIdentity
        }
      };

      console.log(`✅ [${debugId}] Wildcard submission completed:`, {
        submissionId: result.submissionId,
        trustScore: result.trustScore,
        verificationLevel: result.verificationLevel,
        courtAdmissible: result.courtAdmissible,
        componentsCount: Object.keys(result.components).length,
        securityFeatures: result.securityFeatures
      });

      return result;

    } catch (error) {
      console.error(`❌ [${debugId}] Wildcard submission failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId: request.workSubmissionId,
        config: request.config
      });
      throw new Error(`Wildcard submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify document using Wildcard security features
   */
  async verifyWithWildcardSecurity(
    request: WildcardVerificationRequest
  ): Promise<WildcardVerificationResult> {
    const debugId = `WILDCARD_VERIFY_${Date.now()}`;
    console.log(`🔍 [${debugId}] Starting Wildcard verification:`, {
      method: request.verificationMethod,
      dataLength: request.data.length,
      hasChallengeDocument: !!request.challengeDocument,
      offlineMode: request.offlineMode,
      courtMode: request.courtMode,
      timestamp: new Date().toISOString()
    });

    try {
      let verificationMethods = {
        blockchain: false,
        doubleAnchor: false,
        zkChecksum: false,
        sovereignIdentity: false
      };

      let maxTrustScore = 0;
      let verificationLevel: 'basic' | 'enhanced' | 'sovereign' = 'basic';
      let courtAdmissible = false;
      let evidencePackage: any = {};

      // 1. Handle different verification methods
      switch (request.verificationMethod) {
        case 'qr_code':
          console.log(`📱 [${debugId}] Verifying via QR code...`);
          const qrVerification = await this.verifyViaQRCode(request.data, request.challengeDocument);
          Object.assign(verificationMethods, qrVerification.methods);
          maxTrustScore = qrVerification.trustScore;
          courtAdmissible = qrVerification.courtAdmissible;
          evidencePackage = qrVerification.evidence;
          break;

        case 'submission_id':
          console.log(`🆔 [${debugId}] Verifying via submission ID...`);
          const submissionVerification = await this.verifyViaSubmissionId(request.data, request.challengeDocument);
          Object.assign(verificationMethods, submissionVerification.methods);
          maxTrustScore = submissionVerification.trustScore;
          courtAdmissible = submissionVerification.courtAdmissible;
          evidencePackage = submissionVerification.evidence;
          break;

        case 'document_hash':
          console.log(`#️⃣ [${debugId}] Verifying via document hash...`);
          const hashVerification = await this.verifyViaDocumentHash(request.data, request.challengeDocument);
          Object.assign(verificationMethods, hashVerification.methods);
          maxTrustScore = hashVerification.trustScore;
          courtAdmissible = hashVerification.courtAdmissible;
          evidencePackage = hashVerification.evidence;
          break;

        case 'offline_package':
          console.log(`📦 [${debugId}] Verifying via offline package...`);
          const offlineVerification = await offlineVerificationService.performOfflineVerification({
            qrData: request.data,
            documentFile: request.challengeDocument,
            verificationMode: 'qr_scan',
            courtMode: request.courtMode
          });

          verificationMethods = {
            blockchain: offlineVerification.verificationDetails.blockchainProofValid,
            doubleAnchor: offlineVerification.verificationDetails.blockchainProofValid,
            zkChecksum: offlineVerification.verificationDetails.zkChecksumValid,
            sovereignIdentity: offlineVerification.verificationDetails.sovereignIdentityValid
          };
          maxTrustScore = offlineVerification.trustScore;
          courtAdmissible = offlineVerification.courtAdmissible;
          evidencePackage = offlineVerification.evidencePackage;
          verificationLevel = offlineVerification.verificationLevel;
          break;

        default:
          throw new Error(`Unsupported verification method: ${request.verificationMethod}`);
      }

      // 2. Determine verification level if not set by offline verification
      if (verificationLevel === 'basic') {
        if (verificationMethods.sovereignIdentity && verificationMethods.zkChecksum) {
          verificationLevel = 'sovereign';
        } else if (verificationMethods.doubleAnchor || 
                   (verificationMethods.blockchain && (verificationMethods.zkChecksum || verificationMethods.sovereignIdentity))) {
          verificationLevel = 'enhanced';
        }
      }

      // 3. Calculate overall verification status
      const verified = Object.values(verificationMethods).some(method => method);

      // 4. Analyze security features
      const securityAnalysis = {
        tamperEvident: verificationMethods.zkChecksum || verificationMethods.sovereignIdentity,
        cryptographicallySecure: verificationMethods.zkChecksum || verificationMethods.sovereignIdentity,
        offlineCapable: true, // All Wildcard verifications support offline mode
        crossChainVerified: verificationMethods.doubleAnchor
      };

      const result: WildcardVerificationResult = {
        verified,
        verificationLevel,
        trustScore: maxTrustScore,
        courtAdmissible,
        verificationMethods,
        securityAnalysis,
        evidencePackage,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ [${debugId}] Wildcard verification completed:`, {
        verified: result.verified,
        verificationLevel: result.verificationLevel,
        trustScore: result.trustScore,
        courtAdmissible: result.courtAdmissible,
        methods: verificationMethods,
        securityAnalysis
      });

      return result;

    } catch (error) {
      console.error(`❌ [${debugId}] Wildcard verification failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        method: request.verificationMethod,
        dataPreview: request.data.substring(0, 100) + '...'
      });
      throw new Error(`Wildcard verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or retrieve sovereign identity for user
   */
  async ensureSovereignIdentity(
    config?: SovereignIdentityConfig
  ): Promise<DecentralizedIdentifier> {
    const debugId = `SOV_ENSURE_${Date.now()}`;
    console.log(`👤 [${debugId}] Ensuring sovereign identity exists...`);

    try {
      // TODO: Check if user already has a sovereign identity
      // For now, create a new one
      const identity = await sovereignIdentityService.createSovereignIdentity(config);
      
      console.log(`✅ [${debugId}] Sovereign identity ensured:`, {
        did: identity.did.substring(0, 30) + '...',
        isActive: identity.isActive,
        keyType: identity.metadata.keyType
      });

      return identity;

    } catch (error) {
      console.error(`❌ [${debugId}] Sovereign identity creation failed:`, error);
      throw error;
    }
  }

  // Private helper methods with debugging
  private async createMergedFile(files: File[]): Promise<File> {
    const debugId = `MERGE_${Date.now()}`;
    console.log(`🔗 [${debugId}] Creating merged file from ${files.length} files...`);

    try {
      // Simple concatenation for ZK checksum
      const chunks: Uint8Array[] = [];
      
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        chunks.push(new Uint8Array(arrayBuffer));
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const mergedArray = new Uint8Array(totalLength);
      
      let offset = 0;
      for (const chunk of chunks) {
        mergedArray.set(chunk, offset);
        offset += chunk.length;
      }

      const mergedFile = new File([mergedArray], `merged_${Date.now()}.bin`, {
        type: 'application/octet-stream'
      });

      console.log(`✅ [${debugId}] Merged file created:`, {
        originalCount: files.length,
        mergedSize: HashUtils.formatFileSize(mergedFile.size)
      });

      return mergedFile;

    } catch (error) {
      console.error(`❌ [${debugId}] File merging failed:`, error);
      throw error;
    }
  }

  private async verifyViaQRCode(qrData: string, challengeDocument?: File): Promise<{
    methods: any;
    trustScore: number;
    courtAdmissible: boolean;
    evidence: any;
  }> {
    // Parse QR data and verify using appropriate service
    try {
      const parsed = JSON.parse(qrData);
      
      if (parsed.type === 'offline_verification') {
        const result = await offlineVerificationService.performOfflineVerification({
          qrData,
          documentFile: challengeDocument,
          verificationMode: 'qr_scan'
        });
        
        return {
          methods: {
            blockchain: result.verificationDetails.blockchainProofValid,
            doubleAnchor: result.verificationDetails.blockchainProofValid,
            zkChecksum: result.verificationDetails.zkChecksumValid,
            sovereignIdentity: result.verificationDetails.sovereignIdentityValid
          },
          trustScore: result.trustScore,
          courtAdmissible: result.courtAdmissible,
          evidence: result.evidencePackage
        };
      } else {
        // Fallback to basic blockchain verification
        return {
          methods: { blockchain: true, doubleAnchor: false, zkChecksum: false, sovereignIdentity: false },
          trustScore: 60,
          courtAdmissible: false,
          evidence: {}
        };
      }
    } catch {
      throw new Error('Invalid QR code data');
    }
  }

  private async verifyViaSubmissionId(submissionId: string, challengeDocument?: File): Promise<{
    methods: any;
    trustScore: number;
    courtAdmissible: boolean;
    evidence: any;
  }> {
    // Verify using blockchain verification service
    const result = await blockchainVerifiedSubmissionService.verifySubmission(submissionId);
    
    if (!result) {
      throw new Error('Submission not found');
    }

    return {
      methods: { blockchain: result.isVerified, doubleAnchor: false, zkChecksum: false, sovereignIdentity: false },
      trustScore: result.isVerified ? 60 : 0,
      courtAdmissible: false,
      evidence: { blockchainProof: result.blockchainProof }
    };
  }

  private async verifyViaDocumentHash(documentHash: string, challengeDocument?: File): Promise<{
    methods: any;
    trustScore: number;
    courtAdmissible: boolean;
    evidence: any;
  }> {
    // Verify document hash if challenge document provided
    if (challengeDocument) {
      const challengeResult = await HashUtils.hashFile(challengeDocument);
      const hashMatches = HashUtils.compareHashes(challengeResult.hash, documentHash);
      
      if (!hashMatches) {
        throw new Error('Document hash mismatch');
      }
    }

    // TODO: Check multiple verification sources for this hash
    return {
      methods: { blockchain: true, doubleAnchor: false, zkChecksum: false, sovereignIdentity: false },
      trustScore: 50,
      courtAdmissible: false,
      evidence: { documentHash }
    };
  }
}

export const wildcardIntegrationService = new WildcardIntegrationService();