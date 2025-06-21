-- Reputation System Database Schema for Ile Legal Platform
-- Implements on-chain reputation tracking for legal professionals and property developers

-- Legal credentials and certifications
CREATE TABLE IF NOT EXISTS legal_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_type TEXT NOT NULL, -- 'bar_license', 'certification', 'education', 'specialization'
    issuing_authority TEXT NOT NULL,
    credential_number TEXT,
    credential_name TEXT NOT NULL,
    jurisdiction TEXT, -- Legal jurisdiction (state, country)
    issued_date DATE,
    expiry_date DATE,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'revoked'
    blockchain_tx_id TEXT, -- Algorand transaction ID for credential verification
    ipfs_cid TEXT, -- IPFS hash of credential document
    verifier_id UUID REFERENCES auth.users(id), -- Admin who verified
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- On-chain reputation scores
CREATE TABLE IF NOT EXISTS reputation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reputation_type TEXT NOT NULL, -- 'legal_review', 'property_approval', 'dispute_resolution', 'contract_drafting'
    score DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
    total_reviews INTEGER DEFAULT 0,
    successful_completions INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00, -- 1.00 to 5.00
    blockchain_tx_id TEXT, -- Latest Algorand transaction recording this score
    last_blockchain_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reputation_type)
);

-- Individual reputation events (on-chain recorded)
CREATE TABLE IF NOT EXISTS reputation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Legal professional
    event_type TEXT NOT NULL, -- 'gig_completed', 'property_approved', 'dispute_resolved', 'review_received'
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who provided the review/rating
    score_change DECIMAL(5,2), -- Change in reputation score (+/-)
    rating INTEGER CHECK (rating BETWEEN 1 AND 5), -- 1-5 star rating
    review_text TEXT,
    response_text TEXT, -- Professional's response to review
    evidence_ipfs_cid TEXT, -- IPFS hash of supporting documentation
    blockchain_tx_id TEXT NOT NULL, -- Algorand transaction ID
    block_height BIGINT, -- Algorand block height for verification
    verified_on_chain BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal case completions (court-admissible record)
CREATE TABLE IF NOT EXISTS legal_case_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Legal professional
    case_type TEXT NOT NULL, -- 'property_review', 'contract_draft', 'compliance_check', 'due_diligence'
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    case_title TEXT NOT NULL,
    case_description TEXT,
    completion_status TEXT NOT NULL, -- 'completed', 'approved', 'disputed', 'rejected'
    completion_date TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5,2), -- Billable hours
    documentation_ipfs_cid TEXT, -- All case documents
    final_deliverable_ipfs_cid TEXT, -- Final legal document
    blockchain_verification_tx TEXT, -- Algorand verification transaction
    court_admissible BOOLEAN DEFAULT true,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
    client_satisfaction INTEGER CHECK (client_satisfaction BETWEEN 1 AND 5),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property approval records
CREATE TABLE IF NOT EXISTS property_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL, -- External property identifier
    property_address TEXT NOT NULL,
    approver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Legal professional who approved
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Property developer/owner
    approval_type TEXT NOT NULL, -- 'zoning', 'environmental', 'title_review', 'permit_review'
    approval_status TEXT NOT NULL, -- 'approved', 'rejected', 'conditional', 'pending'
    approval_conditions TEXT[],
    legal_opinion TEXT,
    supporting_documents_ipfs TEXT[], -- Array of IPFS CIDs
    blockchain_record_tx TEXT, -- Algorand transaction for permanent record
    legal_opinion_ipfs_cid TEXT, -- Legal opinion document
    expiry_date DATE,
    jurisdiction TEXT NOT NULL,
    accuracy_verified BOOLEAN DEFAULT false, -- Later verification of approval accuracy
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reputation attestations (peer reviews)
CREATE TABLE IF NOT EXISTS reputation_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User being attested
    attester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User providing attestation
    attestation_type TEXT NOT NULL, -- 'peer_review', 'client_feedback', 'colleague_endorsement', 'bar_association'
    attestation_score INTEGER CHECK (attestation_score BETWEEN 1 AND 5),
    attestation_text TEXT NOT NULL,
    professional_relationship TEXT, -- 'colleague', 'client', 'opposing_counsel', 'supervisor'
    years_known INTEGER,
    evidence_ipfs_cid TEXT,
    blockchain_tx_id TEXT, -- Algorand transaction recording attestation
    weight DECIMAL(3,2) DEFAULT 1.00, -- Attestation weight based on attester's reputation
    verified BOOLEAN DEFAULT false,
    verification_method TEXT, -- 'blockchain', 'admin_verified', 'peer_confirmed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professional achievements and milestones
CREATE TABLE IF NOT EXISTS professional_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL, -- 'certification_earned', 'milestone_reached', 'award_received'
    achievement_title TEXT NOT NULL,
    achievement_description TEXT,
    issuing_organization TEXT,
    achievement_date DATE,
    verification_document_ipfs TEXT,
    blockchain_record_tx TEXT,
    reputation_impact DECIMAL(5,2), -- Impact on reputation score
    public_visible BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reputation system configuration and weights
CREATE TABLE IF NOT EXISTS reputation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type TEXT NOT NULL, -- 'scoring_weights', 'event_multipliers', 'decay_rates'
    config_data JSONB NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_credentials_user_id ON legal_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_credentials_status ON legal_credentials(verification_status);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_user_id ON reputation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_type ON reputation_scores(reputation_type);
CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id ON reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_gig_id ON reputation_events(gig_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_blockchain_tx ON reputation_events(blockchain_tx_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_completions_user_id ON legal_case_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_case_completions_client_id ON legal_case_completions(client_id);
CREATE INDEX IF NOT EXISTS idx_property_approvals_approver_id ON property_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_reputation_attestations_subject_user ON reputation_attestations(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_attestations_attester ON reputation_attestations(attester_id);

-- RLS (Row Level Security) Policies
ALTER TABLE legal_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_case_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_config ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view their own credentials" ON legal_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credentials" ON legal_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view public credentials" ON legal_credentials FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Users can view their own reputation scores" ON reputation_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view reputation scores" ON reputation_scores FOR SELECT USING (true);

CREATE POLICY "Users can view reputation events" ON reputation_events FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = reviewer_id OR 
    EXISTS (SELECT 1 FROM gigs WHERE gigs.id = reputation_events.gig_id AND (gigs.user_id = auth.uid() OR gigs.buyer_id = auth.uid()))
);

CREATE POLICY "Users can insert reputation events for their gigs" ON reputation_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM gigs WHERE gigs.id = reputation_events.gig_id AND gigs.buyer_id = auth.uid()) OR
    auth.uid() = user_id
);

CREATE POLICY "Users can view relevant case completions" ON legal_case_completions FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = client_id
);

CREATE POLICY "Legal professionals can insert case completions" ON legal_case_completions FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('seller', 'admin', 'super_admin')
    )
);

CREATE POLICY "Users can view property approvals" ON property_approvals FOR SELECT USING (
    auth.uid() = approver_id OR auth.uid() = client_id
);

CREATE POLICY "Users can view attestations about themselves" ON reputation_attestations FOR SELECT USING (
    auth.uid() = subject_user_id OR auth.uid() = attester_id
);

CREATE POLICY "Users can create attestations" ON reputation_attestations FOR INSERT WITH CHECK (
    auth.uid() = attester_id
);

-- Functions for calculating reputation scores
CREATE OR REPLACE FUNCTION calculate_overall_reputation(user_uuid UUID)
RETURNS TABLE(
    overall_score DECIMAL(5,2),
    legal_review_score DECIMAL(5,2),
    property_approval_score DECIMAL(5,2),
    dispute_resolution_score DECIMAL(5,2),
    total_completions INTEGER,
    average_rating DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH score_data AS (
        SELECT 
            COALESCE(AVG(CASE WHEN reputation_type = 'legal_review' THEN score END), 0) as legal_review,
            COALESCE(AVG(CASE WHEN reputation_type = 'property_approval' THEN score END), 0) as property_approval,
            COALESCE(AVG(CASE WHEN reputation_type = 'dispute_resolution' THEN score END), 0) as dispute_resolution,
            COALESCE(SUM(successful_completions), 0) as total_completions
        FROM reputation_scores 
        WHERE user_id = user_uuid
    ),
    rating_data AS (
        SELECT COALESCE(AVG(rating::decimal), 0) as avg_rating
        FROM reputation_events 
        WHERE user_id = user_uuid AND rating IS NOT NULL
    )
    SELECT 
        -- Weighted overall score
        ROUND((
            (sd.legal_review * 0.35) + 
            (sd.property_approval * 0.30) + 
            (sd.dispute_resolution * 0.25) +
            (LEAST(sd.total_completions * 2, 20) * 0.10) -- Completion bonus, capped at 20 points
        )::decimal, 2) as overall_score,
        ROUND(sd.legal_review::decimal, 2) as legal_review_score,
        ROUND(sd.property_approval::decimal, 2) as property_approval_score,
        ROUND(sd.dispute_resolution::decimal, 2) as dispute_resolution_score,
        sd.total_completions::integer,
        ROUND(rd.avg_rating::decimal, 2) as average_rating
    FROM score_data sd, rating_data rd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update reputation scores after events
CREATE OR REPLACE FUNCTION update_reputation_after_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert reputation score
    INSERT INTO reputation_scores (user_id, reputation_type, score, total_reviews, successful_completions, average_rating)
    VALUES (
        NEW.user_id,
        CASE 
            WHEN NEW.event_type LIKE '%legal%' OR NEW.event_type LIKE '%gig%' THEN 'legal_review'
            WHEN NEW.event_type LIKE '%property%' THEN 'property_approval'
            WHEN NEW.event_type LIKE '%dispute%' THEN 'dispute_resolution'
            ELSE 'legal_review'
        END,
        GREATEST(0, COALESCE(NEW.score_change, 0)),
        1,
        CASE WHEN COALESCE(NEW.score_change, 0) > 0 THEN 1 ELSE 0 END,
        COALESCE(NEW.rating, 0)
    )
    ON CONFLICT (user_id, reputation_type) 
    DO UPDATE SET
        score = LEAST(100, reputation_scores.score + GREATEST(-10, COALESCE(NEW.score_change, 0))),
        total_reviews = reputation_scores.total_reviews + 1,
        successful_completions = reputation_scores.successful_completions + 
            CASE WHEN COALESCE(NEW.score_change, 0) > 0 THEN 1 ELSE 0 END,
        average_rating = (
            (reputation_scores.average_rating * reputation_scores.total_reviews + COALESCE(NEW.rating, 0)) 
            / (reputation_scores.total_reviews + 1)
        ),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reputation scores
CREATE TRIGGER update_reputation_scores_trigger
    AFTER INSERT ON reputation_events
    FOR EACH ROW
    EXECUTE FUNCTION update_reputation_after_event();

-- Insert default reputation configuration
INSERT INTO reputation_config (config_type, config_data, description) VALUES 
('scoring_weights', '{
    "gig_completion": 5.0,
    "positive_review": 3.0,
    "property_approval_accuracy": 4.0,
    "dispute_resolution": 6.0,
    "peer_endorsement": 2.0,
    "credential_verification": 1.5
}', 'Default scoring weights for reputation events'),
('rating_multipliers', '{
    "1_star": 0.2,
    "2_star": 0.4,
    "3_star": 0.6,
    "4_star": 0.8,
    "5_star": 1.0
}', 'Rating multipliers for score calculation'),
('reputation_thresholds', '{
    "novice": 0,
    "competent": 25,
    "proficient": 50,
    "expert": 75,
    "master": 90
}', 'Reputation level thresholds')
ON CONFLICT DO NOTHING;