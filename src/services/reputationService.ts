import { supabaseLocal as supabase } from '../lib/supabaseLocal';
import { ipfsService } from './ipfsService';
import { AlgorandService } from '../components/blockchain/shared/algorandService';

export interface ReputationScore {
  overall: number;
  legal_review: number;
  property_approval: number;
  dispute_resolution: number;
  total_completions: number;
  average_rating: number;
}

export interface ReputationEvent {
  id: string;
  user_id: string;
  event_type: string;
  gig_id?: string;
  reviewer_id?: string;
  score_change: number;
  rating: number;
  review_text: string;
  evidence_ipfs_cid?: string;
  blockchain_tx_id: string;
  timestamp: string;
  metadata: any;
}

export interface LegalCredential {
  id: string;
  credential_type: string;
  issuing_authority: string;
  credential_name: string;
  jurisdiction: string;
  verification_status: string;
  blockchain_tx_id?: string;
  ipfs_cid?: string;
  issued_date?: string;
  expiry_date?: string;
}

export interface CaseCompletion {
  id: string;
  case_type: string;
  case_title: string;
  completion_status: string;
  completion_date: string;
  client_id: string;
  quality_score: number;
  client_satisfaction: number;
  blockchain_verification_tx: string;
}

/**
 * On-Chain Reputation Management Service
 * Handles legal professional reputation tracking with blockchain verification
 */
export class ReputationService {
  private algorandService: AlgorandService;

  constructor() {
    this.algorandService = new AlgorandService();
  }

  /**
   * Calculate comprehensive reputation score for a user
   */
  async calculateReputationScore(userId: string): Promise<ReputationScore> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_overall_reputation', { user_uuid: userId });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        return {
          overall: parseFloat(result.overall_score) || 0,
          legal_review: parseFloat(result.legal_review_score) || 0,
          property_approval: parseFloat(result.property_approval_score) || 0,
          dispute_resolution: parseFloat(result.dispute_resolution_score) || 0,
          total_completions: parseInt(result.total_completions) || 0,
          average_rating: parseFloat(result.average_rating) || 0
        };
      }

      return {
        overall: 0,
        legal_review: 0,
        property_approval: 0,
        dispute_resolution: 0,
        total_completions: 0,
        average_rating: 0
      };
    } catch (error) {
      console.error('Error calculating reputation score:', error);
      throw error;
    }
  }

  /**
   * Record a reputation event with blockchain verification
   */
  async recordReputationEvent(
    userId: string,
    eventType: string,
    gigId: string,
    reviewerId: string,
    rating: number,
    reviewText: string,
    evidenceFiles: File[] = []
  ): Promise<string> {
    try {
      // Upload evidence to IPFS if provided
      let evidenceIpfsCid = '';
      if (evidenceFiles.length > 0) {
        const uploadResults = await ipfsService.uploadFiles(evidenceFiles, {
          category: `reputation-evidence-${Date.now()}`,
          legalDocumentType: 'reputation_evidence'
        });
        evidenceIpfsCid = uploadResults[0].cid;
      }

      // Get user's wallet address for blockchain recording
      const { data: profile } = await supabase
        .from('Profiles')
        .select('circle_wallet_address')
        .eq('id', userId)
        .single();

      if (!profile?.circle_wallet_address) {
        throw new Error('User wallet address not found');
      }

      // Calculate score change based on event type and rating
      const scoreChange = this.calculateScoreChange(eventType, rating);

      // Record event on Algorand blockchain
      const blockchainTxId = await this.recordOnBlockchain(
        profile.circle_wallet_address,
        eventType,
        scoreChange,
        evidenceIpfsCid,
        { gigId, reviewerId, reviewText, rating }
      );

      // Record in database
      const { data: reputationEvent, error } = await supabase
        .from('reputation_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          gig_id: gigId,
          reviewer_id: reviewerId,
          score_change: scoreChange,
          rating,
          review_text: reviewText,
          evidence_ipfs_cid: evidenceIpfsCid,
          blockchain_tx_id: blockchainTxId,
          verified_on_chain: true,
          metadata: { 
            algorand_network: 'testnet',
            evidence_files_count: evidenceFiles.length
          }
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Reputation event recorded: ${eventType} for user ${userId}, blockchain TX: ${blockchainTxId}`);
      return reputationEvent.id;

    } catch (error) {
      console.error('Error recording reputation event:', error);
      throw error;
    }
  }

  /**
   * Verify and record legal credentials with blockchain proof
   */
  async verifyLegalCredential(
    userId: string,
    credentialType: string,
    credentialName: string,
    issuingAuthority: string,
    jurisdiction: string,
    credentialFile: File,
    issuedDate?: string,
    expiryDate?: string
  ): Promise<string> {
    try {
      // Upload credential document to IPFS
      const uploadResult = await ipfsService.uploadFile(credentialFile, {
        legalDocumentType: 'legal_credential',
        blockchainIntegrated: true,
        courtAdmissible: true
      });

      // Get user's wallet address
      const { data: profile } = await supabase
        .from('Profiles')
        .select('circle_wallet_address')
        .eq('id', userId)
        .single();

      if (!profile?.circle_wallet_address) {
        throw new Error('User wallet address not found');
      }

      // Record credential verification on blockchain
      const blockchainTxId = await this.recordCredentialOnBlockchain(
        profile.circle_wallet_address,
        credentialType,
        issuingAuthority,
        uploadResult.cid
      );

      // Store credential in database
      const { data: credential, error } = await supabase
        .from('legal_credentials')
        .insert({
          user_id: userId,
          credential_type: credentialType,
          credential_name: credentialName,
          issuing_authority: issuingAuthority,
          jurisdiction,
          verification_status: 'verified',
          blockchain_tx_id: blockchainTxId,
          ipfs_cid: uploadResult.cid,
          issued_date: issuedDate,
          expiry_date: expiryDate,
          metadata: {
            file_name: credentialFile.name,
            file_size: credentialFile.size,
            verification_date: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Record as a reputation event
      await this.recordReputationEvent(
        userId,
        'credential_verified',
        '', // No gig ID for credentials
        userId, // Self-verification
        5, // Max rating for verified credentials
        `Verified ${credentialType}: ${credentialName}`,
        []
      );

      console.log(`Legal credential verified: ${credentialName} for user ${userId}`);
      return credential.id;

    } catch (error) {
      console.error('Error verifying legal credential:', error);
      throw error;
    }
  }

  /**
   * Record case completion with court-admissible documentation
   */
  async recordCaseCompletion(
    lawyerId: string,
    clientId: string,
    gigId: string,
    caseType: string,
    caseTitle: string,
    completionStatus: string,
    documents: File[],
    finalDeliverable: File,
    qualityScore: number,
    clientSatisfaction: number
  ): Promise<string> {
    try {
      // Upload all documents to IPFS
      const documentUploads = await ipfsService.uploadFiles(documents, {
        category: `case-${gigId}-documents`,
        legalDocumentType: 'case_documentation',
        courtAdmissible: true
      });

      const deliverableUpload = await ipfsService.uploadFile(finalDeliverable, {
        legalDocumentType: 'case_completion',
        courtAdmissible: true,
        blockchainIntegrated: true
      });

      // Get wallet addresses
      const { data: lawyerProfile } = await supabase
        .from('Profiles')
        .select('circle_wallet_address')
        .eq('id', lawyerId)
        .single();

      const { data: clientProfile } = await supabase
        .from('Profiles')
        .select('circle_wallet_address')
        .eq('id', clientId)
        .single();

      if (!lawyerProfile?.circle_wallet_address || !clientProfile?.circle_wallet_address) {
        throw new Error('Wallet addresses not found for participants');
      }

      // Record case completion on blockchain
      const blockchainTxId = await this.recordCaseCompletionOnBlockchain(
        lawyerProfile.circle_wallet_address,
        clientProfile.circle_wallet_address,
        caseType,
        completionStatus,
        deliverableUpload.cid
      );

      // Store completion record
      const { data: completion, error } = await supabase
        .from('legal_case_completions')
        .insert({
          user_id: lawyerId,
          case_type: caseType,
          case_title: caseTitle,
          gig_id: gigId,
          client_id: clientId,
          completion_status: completionStatus,
          completion_date: new Date().toISOString(),
          documentation_ipfs_cid: documentUploads.map(u => u.cid).join(','),
          final_deliverable_ipfs_cid: deliverableUpload.cid,
          blockchain_verification_tx: blockchainTxId,
          court_admissible: true,
          quality_score: qualityScore,
          client_satisfaction: clientSatisfaction,
          metadata: {
            documents_count: documents.length,
            total_file_size: documents.reduce((sum, file) => sum + file.size, 0) + finalDeliverable.size
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Record reputation event for successful completion
      if (completionStatus === 'completed') {
        await this.recordReputationEvent(
          lawyerId,
          'legal_case_completed',
          gigId,
          clientId,
          clientSatisfaction, // Use client satisfaction as rating
          `Case completed: ${caseTitle}`,
          []
        );
      }

      console.log(`Case completion recorded: ${caseTitle} for lawyer ${lawyerId}`);
      return completion.id;

    } catch (error) {
      console.error('Error recording case completion:', error);
      throw error;
    }
  }

  /**
   * Get user's reputation history and events
   */
  async getReputationHistory(userId: string, limit: number = 50): Promise<ReputationEvent[]> {
    try {
      const { data, error } = await supabase
        .from('reputation_events')
        .select(`
          *,
          gigs:gig_id(title, description),
          reviewer:reviewer_id(first_name, last_name, email)
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching reputation history:', error);
      throw error;
    }
  }

  /**
   * Get user's verified credentials
   */
  async getUserCredentials(userId: string): Promise<LegalCredential[]> {
    try {
      const { data, error } = await supabase
        .from('legal_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user credentials:', error);
      throw error;
    }
  }

  /**
   * Get user's case completion history
   */
  async getCaseCompletions(userId: string): Promise<CaseCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('legal_case_completions')
        .select(`
          *,
          client:client_id(first_name, last_name, email),
          gig:gig_id(title, description)
        `)
        .eq('user_id', userId)
        .order('completion_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching case completions:', error);
      throw error;
    }
  }

  /**
   * Add peer attestation/endorsement
   */
  async addPeerAttestation(
    subjectUserId: string,
    attesterId: string,
    attestationType: string,
    score: number,
    text: string,
    professionalRelationship: string,
    yearsKnown: number
  ): Promise<string> {
    try {
      // Get attester's wallet address
      const { data: attesterProfile } = await supabase
        .from('Profiles')
        .select('circle_wallet_address')
        .eq('id', attesterId)
        .single();

      if (!attesterProfile?.circle_wallet_address) {
        throw new Error('Attester wallet address not found');
      }

      // Record attestation on blockchain
      const blockchainTxId = await this.recordAttestationOnBlockchain(
        attesterProfile.circle_wallet_address,
        subjectUserId,
        attestationType,
        score,
        text
      );

      // Calculate attestation weight based on attester's reputation
      const attesterReputation = await this.calculateReputationScore(attesterId);
      const weight = Math.min(Math.max(attesterReputation.overall / 100, 0.1), 2.0);

      // Store attestation
      const { data: attestation, error } = await supabase
        .from('reputation_attestations')
        .insert({
          subject_user_id: subjectUserId,
          attester_id: attesterId,
          attestation_type: attestationType,
          attestation_score: score,
          attestation_text: text,
          professional_relationship: professionalRelationship,
          years_known: yearsKnown,
          blockchain_tx_id: blockchainTxId,
          weight: weight,
          verified: true,
          verification_method: 'blockchain'
        })
        .select()
        .single();

      if (error) throw error;

      // Record as reputation event
      const scoreChange = score * weight * 0.5; // Attestations have moderate impact
      await this.recordReputationEvent(
        subjectUserId,
        'peer_attestation_received',
        '', // No gig ID
        attesterId,
        score,
        `Peer attestation: ${text}`,
        []
      );

      return attestation.id;
    } catch (error) {
      console.error('Error adding peer attestation:', error);
      throw error;
    }
  }

  /**
   * Get reputation level description based on score
   */
  getReputationLevel(score: number): { level: string; description: string; color: string } {
    if (score >= 90) return { level: 'Master', description: 'Exceptional legal professional', color: '#8B5CF6' };
    if (score >= 75) return { level: 'Expert', description: 'Highly experienced and trusted', color: '#3B82F6' };
    if (score >= 50) return { level: 'Proficient', description: 'Competent and reliable', color: '#10B981' };
    if (score >= 25) return { level: 'Competent', description: 'Developing professional', color: '#F59E0B' };
    return { level: 'Novice', description: 'New to the platform', color: '#6B7280' };
  }

  // Private helper methods

  private calculateScoreChange(eventType: string, rating: number): number {
    const baseScoreMap: { [key: string]: number } = {
      'gig_completed': 3.0,
      'legal_case_completed': 5.0,
      'property_approved': 4.0,
      'dispute_resolved': 6.0,
      'credential_verified': 2.0,
      'peer_attestation_received': 1.5,
      'review_received': 2.5
    };

    const baseScore = baseScoreMap[eventType] || 1.0;
    const ratingMultiplier = rating / 5.0; // Normalize to 0-1

    return parseFloat((baseScore * ratingMultiplier).toFixed(2));
  }

  private async recordOnBlockchain(
    userAddress: string,
    eventType: string,
    scoreChange: number,
    evidenceHash: string,
    metadata: any
  ): Promise<string> {
    const noteData = {
      type: 'reputation_event',
      userAddress,
      eventType,
      scoreChange,
      evidenceHash,
      timestamp: new Date().toISOString(),
      metadata,
      version: '1.0'
    };

    return await this.algorandService.submitDocumentHash(
      JSON.stringify(noteData),
      'SHA-256',
      `reputation-event-${eventType}`,
      0, // No file size for reputation events
      noteData
    );
  }

  private async recordCredentialOnBlockchain(
    userAddress: string,
    credentialType: string,
    issuingAuthority: string,
    credentialHash: string
  ): Promise<string> {
    const noteData = {
      type: 'credential_verification',
      userAddress,
      credentialType,
      issuingAuthority,
      credentialHash,
      verifiedAt: new Date().toISOString(),
      version: '1.0'
    };

    return await this.algorandService.submitDocumentHash(
      JSON.stringify(noteData),
      'SHA-256',
      `credential-${credentialType}`,
      0,
      noteData
    );
  }

  private async recordCaseCompletionOnBlockchain(
    lawyerAddress: string,
    clientAddress: string,
    caseType: string,
    completionStatus: string,
    documentsHash: string
  ): Promise<string> {
    const noteData = {
      type: 'case_completion',
      lawyerAddress,
      clientAddress,
      caseType,
      completionStatus,
      documentsHash,
      completedAt: new Date().toISOString(),
      courtAdmissible: true,
      version: '1.0'
    };

    return await this.algorandService.submitDocumentHash(
      JSON.stringify(noteData),
      'SHA-256',
      `case-${caseType}`,
      0,
      noteData
    );
  }

  private async recordAttestationOnBlockchain(
    attesterAddress: string,
    subjectUserId: string,
    attestationType: string,
    score: number,
    text: string
  ): Promise<string> {
    const noteData = {
      type: 'peer_attestation',
      attesterAddress,
      subjectUserId,
      attestationType,
      score,
      attestationText: text,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    return await this.algorandService.submitDocumentHash(
      JSON.stringify(noteData),
      'SHA-256',
      `attestation-${attestationType}`,
      0,
      noteData
    );
  }
}

// Export singleton instance
export const reputationService = new ReputationService();