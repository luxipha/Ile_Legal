-- PHASE 2: Wildcard - Secure, Sovereign Track
-- Database migrations for ZK-checksums, sovereign identities, and double-anchor proofs

-- ZK Checksums table for zero-knowledge verification
CREATE TABLE zk_checksums (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_hash TEXT NOT NULL,
  commitment_data JSONB NOT NULL,
  proof_data JSONB NOT NULL,
  verification_result JSONB NOT NULL,
  config JSONB NOT NULL,
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  court_admissible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sovereign Identities table for DID management
CREATE TABLE sovereign_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  identifier TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key TEXT, -- Should be encrypted in production
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, did)
);

-- Sovereign Signatures table for document signing records
CREATE TABLE sovereign_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  did TEXT REFERENCES sovereign_identities(did),
  document_hash TEXT NOT NULL,
  signature_data JSONB NOT NULL,
  file_name TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Double Anchor Proofs table for dual blockchain verification
CREATE TABLE double_anchor_proofs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_hash TEXT NOT NULL,
  algorand_proof JSONB,
  filecoin_proof JSONB,
  zk_checksum_id TEXT REFERENCES zk_checksums(id),
  sovereign_identity_did TEXT REFERENCES sovereign_identities(did),
  cross_chain_verification JSONB NOT NULL,
  verification_level TEXT NOT NULL CHECK (verification_level IN ('single', 'double', 'sovereign')),
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  court_admissible BOOLEAN DEFAULT FALSE,
  offline_verification_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline Verification Records table for court-ready verification
CREATE TABLE offline_verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_data_hash TEXT UNIQUE NOT NULL,
  verification_data JSONB NOT NULL,
  document_hash TEXT NOT NULL,
  verification_methods JSONB NOT NULL,
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  court_admissible BOOLEAN DEFAULT FALSE,
  qr_signature TEXT NOT NULL,
  evidence_bundle BYTEA, -- Compressed evidence package
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  verification_count INTEGER DEFAULT 0
);

-- Verifiable Credentials table for attestations
CREATE TABLE verifiable_credentials (
  id TEXT PRIMARY KEY,
  issuer_did TEXT REFERENCES sovereign_identities(did),
  subject_did TEXT REFERENCES sovereign_identities(did),
  credential_type TEXT NOT NULL,
  credential_data JSONB NOT NULL,
  proof_data JSONB NOT NULL,
  issuance_date TIMESTAMPTZ NOT NULL,
  expiration_date TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT FALSE,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trust Chain table for identity attestations
CREATE TABLE trust_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_did TEXT REFERENCES sovereign_identities(did),
  attestor_did TEXT REFERENCES sovereign_identities(did),
  attestation_type TEXT NOT NULL,
  attestation_data JSONB NOT NULL,
  trust_weight INTEGER DEFAULT 1 CHECK (trust_weight >= 0 AND trust_weight <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(subject_did, attestor_did, attestation_type)
);

-- Create indexes for performance
CREATE INDEX idx_zk_checksums_user_id ON zk_checksums(user_id);
CREATE INDEX idx_zk_checksums_document_hash ON zk_checksums(document_hash);
CREATE INDEX idx_zk_checksums_trust_score ON zk_checksums(trust_score DESC);
CREATE INDEX idx_zk_checksums_court_admissible ON zk_checksums(court_admissible) WHERE court_admissible = TRUE;

CREATE INDEX idx_sovereign_identities_user_id ON sovereign_identities(user_id);
CREATE INDEX idx_sovereign_identities_did ON sovereign_identities(did);
CREATE INDEX idx_sovereign_identities_method ON sovereign_identities(method);
CREATE INDEX idx_sovereign_identities_active ON sovereign_identities(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_sovereign_signatures_user_id ON sovereign_signatures(user_id);
CREATE INDEX idx_sovereign_signatures_did ON sovereign_signatures(did);
CREATE INDEX idx_sovereign_signatures_document_hash ON sovereign_signatures(document_hash);
CREATE INDEX idx_sovereign_signatures_verification_status ON sovereign_signatures(verification_status);

CREATE INDEX idx_double_anchor_proofs_user_id ON double_anchor_proofs(user_id);
CREATE INDEX idx_double_anchor_proofs_document_hash ON double_anchor_proofs(document_hash);
CREATE INDEX idx_double_anchor_proofs_verification_level ON double_anchor_proofs(verification_level);
CREATE INDEX idx_double_anchor_proofs_trust_score ON double_anchor_proofs(trust_score DESC);
CREATE INDEX idx_double_anchor_proofs_court_admissible ON double_anchor_proofs(court_admissible) WHERE court_admissible = TRUE;

CREATE INDEX idx_offline_verification_qr_hash ON offline_verification_records(qr_data_hash);
CREATE INDEX idx_offline_verification_document_hash ON offline_verification_records(document_hash);
CREATE INDEX idx_offline_verification_court_admissible ON offline_verification_records(court_admissible) WHERE court_admissible = TRUE;
CREATE INDEX idx_offline_verification_last_verified ON offline_verification_records(last_verified_at DESC);

CREATE INDEX idx_verifiable_credentials_issuer ON verifiable_credentials(issuer_did);
CREATE INDEX idx_verifiable_credentials_subject ON verifiable_credentials(subject_did);
CREATE INDEX idx_verifiable_credentials_type ON verifiable_credentials(credential_type);
CREATE INDEX idx_verifiable_credentials_active ON verifiable_credentials(is_revoked) WHERE is_revoked = FALSE;

CREATE INDEX idx_trust_chain_subject ON trust_chain(subject_did);
CREATE INDEX idx_trust_chain_attestor ON trust_chain(attestor_did);
CREATE INDEX idx_trust_chain_type ON trust_chain(attestation_type);
CREATE INDEX idx_trust_chain_active ON trust_chain(is_active) WHERE is_active = TRUE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_zk_checksums_commitment_gin ON zk_checksums USING GIN (commitment_data);
CREATE INDEX idx_zk_checksums_proof_gin ON zk_checksums USING GIN (proof_data);
CREATE INDEX idx_sovereign_identities_metadata_gin ON sovereign_identities USING GIN (metadata);
CREATE INDEX idx_double_anchor_proofs_algorand_gin ON double_anchor_proofs USING GIN (algorand_proof);
CREATE INDEX idx_double_anchor_proofs_filecoin_gin ON double_anchor_proofs USING GIN (filecoin_proof);
CREATE INDEX idx_offline_verification_data_gin ON offline_verification_records USING GIN (verification_data);

-- Enable Row Level Security
ALTER TABLE zk_checksums ENABLE ROW LEVEL SECURITY;
ALTER TABLE sovereign_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sovereign_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE double_anchor_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_chain ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ZK Checksums
CREATE POLICY "Users can view their own ZK checksums" ON zk_checksums
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ZK checksums" ON zk_checksums
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ZK checksums" ON zk_checksums
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Sovereign Identities
CREATE POLICY "Users can view their own sovereign identities" ON sovereign_identities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sovereign identities" ON sovereign_identities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sovereign identities" ON sovereign_identities
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Sovereign Signatures
CREATE POLICY "Users can view their own sovereign signatures" ON sovereign_signatures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sovereign signatures" ON sovereign_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Double Anchor Proofs
CREATE POLICY "Users can view their own double anchor proofs" ON double_anchor_proofs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own double anchor proofs" ON double_anchor_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Offline Verification Records (more permissive for verification)
CREATE POLICY "Anyone can view offline verification records" ON offline_verification_records
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create offline verification records" ON offline_verification_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for Verifiable Credentials
CREATE POLICY "Users can view credentials they issued or received" ON verifiable_credentials
  FOR SELECT USING (
    issuer_did IN (SELECT did FROM sovereign_identities WHERE user_id = auth.uid()) OR
    subject_did IN (SELECT did FROM sovereign_identities WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can issue credentials with their DIDs" ON verifiable_credentials
  FOR INSERT WITH CHECK (
    issuer_did IN (SELECT did FROM sovereign_identities WHERE user_id = auth.uid())
  );

-- RLS Policies for Trust Chain
CREATE POLICY "Users can view trust chains for their identities" ON trust_chain
  FOR SELECT USING (
    subject_did IN (SELECT did FROM sovereign_identities WHERE user_id = auth.uid()) OR
    attestor_did IN (SELECT did FROM sovereign_identities WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create attestations with their DIDs" ON trust_chain
  FOR INSERT WITH CHECK (
    attestor_did IN (SELECT did FROM sovereign_identities WHERE user_id = auth.uid())
  );

-- Service role policies for system operations
CREATE POLICY "Service role can manage all ZK checksums" ON zk_checksums
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all sovereign identities" ON sovereign_identities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all double anchor proofs" ON double_anchor_proofs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage offline verification records" ON offline_verification_records
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for ZK checksum operations
CREATE OR REPLACE FUNCTION create_zk_checksum(
  p_id TEXT,
  p_user_id UUID,
  p_document_hash TEXT,
  p_commitment_data JSONB,
  p_proof_data JSONB,
  p_verification_result JSONB,
  p_config JSONB,
  p_trust_score INTEGER,
  p_court_admissible BOOLEAN
) RETURNS TEXT AS $$
BEGIN
  INSERT INTO zk_checksums (
    id, user_id, document_hash, commitment_data, proof_data,
    verification_result, config, trust_score, court_admissible
  ) VALUES (
    p_id, p_user_id, p_document_hash, p_commitment_data, p_proof_data,
    p_verification_result, p_config, p_trust_score, p_court_admissible
  );
  
  RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for sovereign identity creation
CREATE OR REPLACE FUNCTION create_sovereign_identity(
  p_did TEXT,
  p_user_id UUID,
  p_method TEXT,
  p_identifier TEXT,
  p_public_key TEXT,
  p_metadata JSONB
) RETURNS TEXT AS $$
BEGIN
  INSERT INTO sovereign_identities (
    did, user_id, method, identifier, public_key, metadata
  ) VALUES (
    p_did, p_user_id, p_method, p_identifier, p_public_key, p_metadata
  );
  
  RETURN p_did;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for double anchor proof creation
CREATE OR REPLACE FUNCTION create_double_anchor_proof(
  p_id TEXT,
  p_user_id UUID,
  p_document_hash TEXT,
  p_algorand_proof JSONB,
  p_filecoin_proof JSONB,
  p_zk_checksum_id TEXT,
  p_sovereign_identity_did TEXT,
  p_cross_chain_verification JSONB,
  p_verification_level TEXT,
  p_trust_score INTEGER,
  p_court_admissible BOOLEAN,
  p_offline_verification_data TEXT
) RETURNS TEXT AS $$
BEGIN
  INSERT INTO double_anchor_proofs (
    id, user_id, document_hash, algorand_proof, filecoin_proof,
    zk_checksum_id, sovereign_identity_did, cross_chain_verification,
    verification_level, trust_score, court_admissible, offline_verification_data
  ) VALUES (
    p_id, p_user_id, p_document_hash, p_algorand_proof, p_filecoin_proof,
    p_zk_checksum_id, p_sovereign_identity_did, p_cross_chain_verification,
    p_verification_level, p_trust_score, p_court_admissible, p_offline_verification_data
  );
  
  RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive verification status
CREATE OR REPLACE FUNCTION get_document_verification_status(p_document_hash TEXT)
RETURNS TABLE (
  document_hash TEXT,
  has_blockchain_verification BOOLEAN,
  has_zk_checksum BOOLEAN,
  has_sovereign_signature BOOLEAN,
  has_double_anchor_proof BOOLEAN,
  max_trust_score INTEGER,
  court_admissible BOOLEAN,
  verification_methods JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_document_hash as document_hash,
    EXISTS(SELECT 1 FROM "Work Submissions" WHERE blockchain_hashes->>'merged_hash' = p_document_hash) as has_blockchain_verification,
    EXISTS(SELECT 1 FROM zk_checksums WHERE document_hash = p_document_hash) as has_zk_checksum,
    EXISTS(SELECT 1 FROM sovereign_signatures WHERE document_hash = p_document_hash) as has_sovereign_signature,
    EXISTS(SELECT 1 FROM double_anchor_proofs WHERE document_hash = p_document_hash) as has_double_anchor_proof,
    GREATEST(
      COALESCE((SELECT MAX(trust_score) FROM zk_checksums WHERE document_hash = p_document_hash), 0),
      COALESCE((SELECT MAX(trust_score) FROM double_anchor_proofs WHERE document_hash = p_document_hash), 0)
    ) as max_trust_score,
    (
      EXISTS(SELECT 1 FROM zk_checksums WHERE document_hash = p_document_hash AND court_admissible = TRUE) OR
      EXISTS(SELECT 1 FROM double_anchor_proofs WHERE document_hash = p_document_hash AND court_admissible = TRUE)
    ) as court_admissible,
    jsonb_build_object(
      'blockchain', EXISTS(SELECT 1 FROM "Work Submissions" WHERE blockchain_hashes->>'merged_hash' = p_document_hash),
      'zk_checksum', EXISTS(SELECT 1 FROM zk_checksums WHERE document_hash = p_document_hash),
      'sovereign_signature', EXISTS(SELECT 1 FROM sovereign_signatures WHERE document_hash = p_document_hash),
      'double_anchor', EXISTS(SELECT 1 FROM double_anchor_proofs WHERE document_hash = p_document_hash)
    ) as verification_methods;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record offline verification
CREATE OR REPLACE FUNCTION record_offline_verification(
  p_qr_data_hash TEXT,
  p_verification_data JSONB,
  p_document_hash TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE offline_verification_records
  SET 
    last_verified_at = NOW(),
    verification_count = verification_count + 1
  WHERE qr_data_hash = p_qr_data_hash;
  
  IF NOT FOUND THEN
    -- This should not happen in normal flow, but handle gracefully
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at columns
CREATE TRIGGER update_zk_checksums_updated_at 
BEFORE UPDATE ON zk_checksums 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sovereign_identities_updated_at 
BEFORE UPDATE ON sovereign_identities 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sovereign_signatures_updated_at 
BEFORE UPDATE ON sovereign_signatures 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_double_anchor_proofs_updated_at 
BEFORE UPDATE ON double_anchor_proofs 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions to service role
GRANT EXECUTE ON FUNCTION create_zk_checksum(TEXT, UUID, TEXT, JSONB, JSONB, JSONB, JSONB, INTEGER, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION create_sovereign_identity(TEXT, UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION create_double_anchor_proof(TEXT, UUID, TEXT, JSONB, JSONB, TEXT, TEXT, JSONB, TEXT, INTEGER, BOOLEAN, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_document_verification_status(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION record_offline_verification(TEXT, JSONB, TEXT) TO service_role;

-- Comments explaining the Phase 2 architecture
COMMENT ON TABLE zk_checksums IS 'Zero-knowledge checksum verification for privacy-preserving document validation';
COMMENT ON TABLE sovereign_identities IS 'Decentralized identities (DIDs) for self-sovereign document signing';
COMMENT ON TABLE sovereign_signatures IS 'Document signatures using sovereign identities';
COMMENT ON TABLE double_anchor_proofs IS 'Dual blockchain verification proofs for maximum security';
COMMENT ON TABLE offline_verification_records IS 'Court-ready offline verification data';
COMMENT ON TABLE verifiable_credentials IS 'Attestations and credentials for identity verification';
COMMENT ON TABLE trust_chain IS 'Trust relationships between sovereign identities';

COMMENT ON COLUMN double_anchor_proofs.verification_level IS 'Verification strength: single (one blockchain), double (dual blockchain), sovereign (ZK + DID + dual blockchain)';
COMMENT ON COLUMN offline_verification_records.qr_signature IS 'Tamper-evident signature for QR code integrity verification';