-- PHASE 1: Filecoin Foundation Integration
-- Add Filecoin storage table to track piece CIDs and FVM payments

-- Create Filecoin storage table
CREATE TABLE IF NOT EXISTS filecoin_storage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ipfs_cid TEXT NOT NULL,
  piece_id TEXT NOT NULL UNIQUE,
  storage_duration INTEGER DEFAULT 365, -- days
  retrieval_cost DECIMAL(10, 8), -- in FIL
  payment_amount DECIMAL(10, 8), -- in FIL
  payment_timestamp TIMESTAMPTZ,
  contract_tx_id TEXT, -- FVM transaction ID
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_filecoin_storage_user_id ON filecoin_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_filecoin_storage_piece_id ON filecoin_storage(piece_id);
CREATE INDEX IF NOT EXISTS idx_filecoin_storage_ipfs_cid ON filecoin_storage(ipfs_cid);
CREATE INDEX IF NOT EXISTS idx_filecoin_storage_upload_timestamp ON filecoin_storage(upload_timestamp DESC);

-- Add RLS policies
ALTER TABLE filecoin_storage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own storage records
CREATE POLICY "Users can view own storage records" ON filecoin_storage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own storage records
CREATE POLICY "Users can insert own storage records" ON filecoin_storage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own storage records
CREATE POLICY "Users can update own storage records" ON filecoin_storage
  FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_filecoin_storage_updated_at
  BEFORE UPDATE ON filecoin_storage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Extend existing documents table to include Filecoin piece CID
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS filecoin_piece_id TEXT,
ADD COLUMN IF NOT EXISTS filecoin_storage_cost DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS filecoin_contract_tx_id TEXT;

-- Add index for Filecoin piece ID lookup
CREATE INDEX IF NOT EXISTS idx_documents_filecoin_piece_id ON documents(filecoin_piece_id);