-- Enhance Work Submissions table for blockchain verification
-- This migration adds blockchain verification fields to existing Work Submissions table

-- Add blockchain verification columns to Work Submissions table
ALTER TABLE "Work Submissions" 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
ADD COLUMN IF NOT EXISTS blockchain_network TEXT CHECK (blockchain_network IN ('algorand', 'filecoin')),
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS offline_verification_hash TEXT,
ADD COLUMN IF NOT EXISTS qr_verification_data JSONB;

-- Update blockchain_hashes column structure (enhance existing JSONB)
COMMENT ON COLUMN "Work Submissions".blockchain_hashes IS 'Enhanced structure: {
  "individual_hashes": ["hash1", "hash2"],
  "merged_hash": "combined_hash",
  "algorithm": "SHA-256",
  "timestamp": "ISO_date",
  "verification_method": "algorand|filecoin"
}';

-- Update ipfs_data column structure (enhance existing JSONB)
COMMENT ON COLUMN "Work Submissions".ipfs_data IS 'Enhanced structure: {
  "filecoin_cids": ["cid1", "cid2"],
  "primary_storage": "algorand|filecoin",
  "redundant_storage": "filecoin",
  "piece_cid": "filecoin_piece_id",
  "contract_tx_id": "fvm_transaction_id"
}';

-- Add indexes for blockchain verification queries
CREATE INDEX IF NOT EXISTS idx_work_submissions_verification_status 
ON "Work Submissions"(verification_status);

CREATE INDEX IF NOT EXISTS idx_work_submissions_blockchain_network 
ON "Work Submissions"(blockchain_network);

CREATE INDEX IF NOT EXISTS idx_work_submissions_verification_timestamp 
ON "Work Submissions"(verification_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_work_submissions_offline_hash 
ON "Work Submissions"(offline_verification_hash);

-- Add GIN index for JSONB blockchain_hashes queries
CREATE INDEX IF NOT EXISTS idx_work_submissions_blockchain_hashes_gin 
ON "Work Submissions" USING GIN (blockchain_hashes);

-- Add GIN index for JSONB ipfs_data queries  
CREATE INDEX IF NOT EXISTS idx_work_submissions_ipfs_data_gin 
ON "Work Submissions" USING GIN (ipfs_data);

-- Add GIN index for QR verification data
CREATE INDEX IF NOT EXISTS idx_work_submissions_qr_data_gin 
ON "Work Submissions" USING GIN (qr_verification_data);

-- Function to update verification status
CREATE OR REPLACE FUNCTION update_submission_verification(
  p_submission_id UUID,
  p_verification_status TEXT,
  p_blockchain_network TEXT,
  p_blockchain_hashes JSONB,
  p_ipfs_data JSONB,
  p_offline_hash TEXT,
  p_qr_data JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "Work Submissions"
  SET 
    verification_status = p_verification_status,
    blockchain_network = p_blockchain_network,
    blockchain_hashes = p_blockchain_hashes,
    ipfs_data = p_ipfs_data,
    offline_verification_hash = p_offline_hash,
    qr_verification_data = p_qr_data,
    verification_timestamp = CASE 
      WHEN p_verification_status = 'verified' THEN NOW()
      ELSE verification_timestamp
    END,
    updated_at = NOW()
  WHERE id = p_submission_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get verification details
CREATE OR REPLACE FUNCTION get_submission_verification_details(p_submission_id UUID)
RETURNS TABLE (
  submission_id UUID,
  verification_status TEXT,
  blockchain_network TEXT,
  verification_timestamp TIMESTAMPTZ,
  blockchain_hashes JSONB,
  ipfs_data JSONB,
  offline_verification_hash TEXT,
  qr_verification_data JSONB,
  lawyer_id UUID,
  buyer_id UUID,
  title TEXT,
  description TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    ws.verification_status,
    ws.blockchain_network,
    ws.verification_timestamp,
    ws.blockchain_hashes,
    ws.ipfs_data,
    ws.offline_verification_hash,
    ws.qr_verification_data,
    ws.lawyer_id,
    ws.buyer_id,
    ws.title,
    ws.description,
    ws.status
  FROM "Work Submissions" ws
  WHERE ws.id = p_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify blockchain submission
CREATE OR REPLACE FUNCTION verify_blockchain_submission(
  p_submission_id UUID,
  p_verification_hash TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  offline_hash TEXT;
BEGIN
  -- Get stored hashes
  SELECT 
    blockchain_hashes->>'merged_hash',
    offline_verification_hash
  INTO stored_hash, offline_hash
  FROM "Work Submissions"
  WHERE id = p_submission_id;
  
  -- Check if verification hash matches either stored hash
  IF stored_hash = p_verification_hash OR offline_hash = p_verification_hash THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get submissions by verification status
CREATE OR REPLACE FUNCTION get_submissions_by_verification_status(
  p_user_id UUID,
  p_user_role TEXT,
  p_status TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  title TEXT,
  verification_status TEXT,
  blockchain_network TEXT,
  verification_timestamp TIMESTAMPTZ,
  has_blockchain_data BOOLEAN,
  has_offline_verification BOOLEAN,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    ws.title,
    ws.verification_status,
    ws.blockchain_network,
    ws.verification_timestamp,
    (ws.blockchain_hashes IS NOT NULL) as has_blockchain_data,
    (ws.offline_verification_hash IS NOT NULL) as has_offline_verification,
    ws.status,
    ws.created_at
  FROM "Work Submissions" ws
  WHERE 
    (
      (p_user_role = 'lawyer' AND ws.lawyer_id = p_user_id) OR
      (p_user_role = 'buyer' AND ws.buyer_id = p_user_id)
    )
    AND (p_status IS NULL OR ws.verification_status = p_status)
  ORDER BY ws.verification_timestamp DESC NULLS LAST, ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing RLS policies to include new columns
-- Note: Existing RLS policies should already cover these columns since they use SELECT/UPDATE on the table

-- Grant necessary permissions to service role for blockchain operations
GRANT EXECUTE ON FUNCTION update_submission_verification(UUID, TEXT, TEXT, JSONB, JSONB, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_submission_verification_details(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION verify_blockchain_submission(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_submissions_by_verification_status(UUID, TEXT, TEXT) TO service_role;

-- Add comment explaining the verification workflow
COMMENT ON TABLE "Work Submissions" IS 'Enhanced with blockchain verification:
1. lawyer submits work with files
2. system generates hashes and submits to blockchain
3. verification_status tracks blockchain confirmation
4. qr_verification_data enables offline verification
5. redundant storage in both blockchain and Filecoin';