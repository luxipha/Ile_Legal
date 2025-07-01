import { supabase } from '../lib/supabase';
import { ipfsService } from './ipfsService';
import { AlgorandService } from '../components/blockchain/shared/algorandService';
import algosdk from 'algosdk';
import { EarnedBadge } from '../components/badges';

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
   * Get user's earned badges from persistent storage
   */
  async getUserBadges(userId: string): Promise<{
    earned: EarnedBadge[];
    currentTier: EarnedBadge | null;
  }> {
    try {
      // First check if badges need to be updated
      await this.updateUserBadges(userId);

      // Get stored badges from database
      const { data: storedBadges, error } = await supabase
        .rpc('get_user_badges', { p_user_id: userId });

      if (error) {
        console.error('Error fetching stored badges:', error);
        return { earned: [], currentTier: null };
      }

      const earnedBadges: EarnedBadge[] = [];
      let currentTier: EarnedBadge | null = null;

      // Convert stored badges to EarnedBadge format
      for (const badge of storedBadges || []) {
        const earnedBadge: EarnedBadge = {
          id: badge.badge_id,
          type: badge.type as 'reputation' | 'achievement' | 'quality' | 'verification',
          name: badge.name,
          description: badge.description,
          earnedDate: badge.earned_date,
          tier: badge.tier as 'novice' | 'competent' | 'proficient' | 'expert' | 'master',
          rarity: badge.rarity as 'common' | 'rare' | 'epic' | 'legendary'
        };

        earnedBadges.push(earnedBadge);

        // Set current tier badge (highest reputation badge)
        if (badge.type === 'reputation') {
          currentTier = earnedBadge;
        }
      }

      return {
        earned: earnedBadges,
        currentTier
      };
    } catch (error) {
      console.error('Error getting user badges:', error);
      return { earned: [], currentTier: null };
    }
  }

  /**
   * Update user badges by checking current achievements and awarding new badges
   */
  async updateUserBadges(userId: string): Promise<void> {
    try {
      const reputationScore = await this.calculateReputationScore(userId);

      // Check and award tier badge
      await this.checkAndAwardTierBadge(userId, reputationScore);

      // Check and award achievement badges
      await this.checkAndAwardAchievementBadges(userId, reputationScore);

      // Check and award quality badges
      await this.checkAndAwardQualityBadges(userId, reputationScore);

      // Check and award verification badges
      await this.checkAndAwardVerificationBadges(userId);

    } catch (error) {
      console.error('Error updating user badges:', error);
    }
  }

  /**
   * Award a badge to a user (persistent storage)
   */
  async awardBadge(
    userId: string, 
    badgeId: string, 
    tier?: string, 
    metadata: any = {}, 
    blockchainTxId?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('award_badge', {
          p_user_id: userId,
          p_badge_id: badgeId,
          p_tier: tier || null,
          p_metadata: metadata,
          p_blockchain_tx_id: blockchainTxId || null
        });

      if (error) {
        console.error('Error awarding badge:', error);
        return null;
      }

      console.log(`Badge ${badgeId} awarded to user ${userId}`);
      return data;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return null;
    }
  }

  /**
   * Check and award appropriate tier badge based on reputation score
   */
  private async checkAndAwardTierBadge(userId: string, reputationScore: ReputationScore): Promise<void> {
    const { overall } = reputationScore;
    let badgeId: string;
    let tier: string;

    if (overall >= 90) {
      badgeId = 'tier_master';
      tier = 'master';
    } else if (overall >= 75) {
      badgeId = 'tier_expert';
      tier = 'expert';
    } else if (overall >= 50) {
      badgeId = 'tier_proficient';
      tier = 'proficient';
    } else if (overall >= 25) {
      badgeId = 'tier_competent';
      tier = 'competent';
    } else {
      badgeId = 'tier_novice';
      tier = 'novice';
    }

    // Check if user already has this exact tier badge
    const { data: hasBadge } = await supabase
      .rpc('user_has_badge', { p_user_id: userId, p_badge_id: badgeId });

    if (!hasBadge) {
      await this.awardBadge(userId, badgeId, tier, { score: overall });
    }
  }

  /**
   * Check and award achievement badges based on completion milestones
   */
  private async checkAndAwardAchievementBadges(userId: string, reputationScore: ReputationScore): Promise<void> {
    const { total_completions } = reputationScore;

    const achievementMilestones = [
      { threshold: 1, id: 'first_gig' },
      { threshold: 5, id: 'five_gigs' },
      { threshold: 10, id: 'ten_gigs' },
      { threshold: 25, id: 'twenty_five_gigs' },
      { threshold: 50, id: 'fifty_gigs' },
      { threshold: 100, id: 'hundred_gigs' }
    ];

    for (const milestone of achievementMilestones) {
      if (total_completions >= milestone.threshold) {
        // Check if user already has this badge
        const { data: hasBadge } = await supabase
          .rpc('user_has_badge', { p_user_id: userId, p_badge_id: milestone.id });

        if (!hasBadge) {
          await this.awardBadge(userId, milestone.id, undefined, { 
            completions: total_completions,
            milestone: milestone.threshold 
          });
        }
      }
    }
  }

  /**
   * Check and award quality badges based on performance metrics
   */
  private async checkAndAwardQualityBadges(userId: string, reputationScore: ReputationScore): Promise<void> {
    const { average_rating, total_completions } = reputationScore;

    // Client Favorite Badge (4.8+ rating with 10+ reviews)
    if (average_rating >= 4.8 && total_completions >= 10) {
      const { data: hasBadge } = await supabase
        .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'client_favorite' });

      if (!hasBadge) {
        await this.awardBadge(userId, 'client_favorite', undefined, { 
          rating: average_rating,
          completions: total_completions 
        });
      }
    }

    // Quick Responder Badge (mock - would need real response time data)
    if (total_completions >= 5) {
      const { data: hasBadge } = await supabase
        .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'quick_responder' });

      if (!hasBadge) {
        await this.awardBadge(userId, 'quick_responder', undefined, { 
          completions: total_completions 
        });
      }
    }

    // Perfectionist Badge (mock - would need consecutive 5-star tracking)
    if (average_rating >= 4.9 && total_completions >= 10) {
      const { data: hasBadge } = await supabase
        .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'perfectionist' });

      if (!hasBadge) {
        await this.awardBadge(userId, 'perfectionist', undefined, { 
          rating: average_rating,
          completions: total_completions 
        });
      }
    }

    // 5-Star Streak Badge (mock - would need streak tracking)
    if (average_rating >= 5.0 && total_completions >= 5) {
      const { data: hasBadge } = await supabase
        .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'five_star_streak' });

      if (!hasBadge) {
        await this.awardBadge(userId, 'five_star_streak', undefined, { 
          rating: average_rating,
          completions: total_completions 
        });
      }
    }
  }

  /**
   * Check and award verification badges based on user verification status
   */
  private async checkAndAwardVerificationBadges(userId: string): Promise<void> {
    try {
      // Get user profile data
      const { data: profile } = await supabase
        .from('Profiles')
        .select('verification_status')
        .eq('id', userId)
        .single();

      // Identity Verified Badge
      if (profile?.verification_status === 'verified') {
        const { data: hasBadge } = await supabase
          .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'identity_verified' });

        if (!hasBadge) {
          await this.awardBadge(userId, 'identity_verified', undefined, { 
            verification_status: profile.verification_status 
          });
        }
      }

      // Check for credentials
      const credentials = await this.getUserCredentials(userId);
      if (credentials.length > 0) {
        // Professional Credentials Badge
        const { data: hasCredBadge } = await supabase
          .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'professional_credentials' });

        if (!hasCredBadge) {
          await this.awardBadge(userId, 'professional_credentials', undefined, { 
            credentials_count: credentials.length 
          });
        }

        // Bar License Verified Badge
        const hasBarLicense = credentials.some(cred => 
          cred.credential_type === 'bar_license' && cred.verification_status === 'verified'
        );
        if (hasBarLicense) {
          const { data: hasBarBadge } = await supabase
            .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'bar_license_verified' });

          if (!hasBarBadge) {
            await this.awardBadge(userId, 'bar_license_verified', undefined, { 
              bar_license_verified: true 
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking verification badges:', error);
    }
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
        const uploadResults = await ipfsService.uploadFiles(evidenceFiles, `reputation-evidence-${Date.now()}`);
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
      
      // Trigger badge update after reputation event
      try {
        await this.updateUserBadges(userId);
      } catch (badgeError) {
        console.error('Error updating badges after reputation event:', badgeError);
        // Don't fail the reputation event if badge update fails
      }

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
        blockchainIntegrated: true
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
      
      // Trigger badge update after credential verification
      try {
        await this.updateUserBadges(userId);
      } catch (badgeError) {
        console.error('Error updating badges after credential verification:', badgeError);
      }

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
      const documentUploads = await ipfsService.uploadFiles(documents, `case-${gigId}-documents`);

      const deliverableUpload = await ipfsService.uploadFile(finalDeliverable, {
        legalDocumentType: 'case_completion',
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
      
      // Trigger badge update after case completion
      try {
        await this.updateUserBadges(lawyerId);
      } catch (badgeError) {
        console.error('Error updating badges after case completion:', badgeError);
      }

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

    const mockAccount = algosdk.generateAccount(); // Mock account for blockchain submission
    const documentHash = {
      hash: JSON.stringify(noteData),
      fileName: `reputation-event-${eventType}`,
      fileSize: 0,
      algorithm: 'SHA-256' as const,
      timestamp: new Date().toISOString()
    };
    const result = await this.algorandService.submitDocumentHash(documentHash, mockAccount);
    return result.transaction?.txId || '';
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

    const mockAccount = algosdk.generateAccount(); // Mock account for blockchain submission
    const documentHash = {
      hash: JSON.stringify(noteData),
      fileName: `credential-${credentialType}`,
      fileSize: 0,
      algorithm: 'SHA-256' as const,
      timestamp: new Date().toISOString()
    };
    const result = await this.algorandService.submitDocumentHash(documentHash, mockAccount);
    return result.transaction?.txId || '';
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

    const mockAccount = algosdk.generateAccount(); // Mock account for blockchain submission
    const documentHash = {
      hash: JSON.stringify(noteData),
      fileName: `case-${caseType}`,
      fileSize: 0,
      algorithm: 'SHA-256' as const,
      timestamp: new Date().toISOString()
    };
    const result = await this.algorandService.submitDocumentHash(documentHash, mockAccount);
    return result.transaction?.txId || '';
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

    const mockAccount = algosdk.generateAccount(); // Mock account for blockchain submission
    const documentHash = {
      hash: JSON.stringify(noteData),
      fileName: `attestation-${attestationType}`,
      fileSize: 0,
      algorithm: 'SHA-256' as const,
      timestamp: new Date().toISOString()
    };
    const result = await this.algorandService.submitDocumentHash(documentHash, mockAccount);
    return result.transaction?.txId || '';
  }
}

// Export singleton instance
export const reputationService = new ReputationService();