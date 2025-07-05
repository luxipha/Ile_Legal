-- Add FVM (Filecoin Virtual Machine) contract tables for Phase 4.2
-- Supports escrow and storage contracts on Filecoin network

-- FVM Escrow Contracts table
CREATE TABLE IF NOT EXISTS fvm_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT UNIQUE NOT NULL,
  task_id INTEGER NOT NULL REFERENCES "Gigs"(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(15, 6) NOT NULL,
  token_address TEXT NOT NULL,
  storage_deals TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'escrowed', 'completed', 'disputed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- FVM Storage Contracts table
CREATE TABLE IF NOT EXISTS fvm_storage_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT UNIQUE NOT NULL,
  task_id INTEGER NOT NULL REFERENCES "Gigs"(id),
  provider_id TEXT NOT NULL,
  data_cid TEXT NOT NULL,
  deal_id TEXT NOT NULL,
  storage_duration INTEGER NOT NULL,
  storage_price DECIMAL(15, 6) NOT NULL,
  replication_factor INTEGER DEFAULT 3,
  verification_proof TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for FVM contract queries
CREATE INDEX IF NOT EXISTS idx_fvm_contracts_task_id ON fvm_contracts(task_id);
CREATE INDEX IF NOT EXISTS idx_fvm_contracts_buyer_id ON fvm_contracts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_fvm_contracts_seller_id ON fvm_contracts(seller_id);
CREATE INDEX IF NOT EXISTS idx_fvm_contracts_status ON fvm_contracts(status);
CREATE INDEX IF NOT EXISTS idx_fvm_contracts_expires_at ON fvm_contracts(expires_at);

CREATE INDEX IF NOT EXISTS idx_fvm_storage_contracts_task_id ON fvm_storage_contracts(task_id);
CREATE INDEX IF NOT EXISTS idx_fvm_storage_contracts_data_cid ON fvm_storage_contracts(data_cid);
CREATE INDEX IF NOT EXISTS idx_fvm_storage_contracts_status ON fvm_storage_contracts(status);

-- RLS policies for FVM contracts
ALTER TABLE fvm_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fvm_storage_contracts ENABLE ROW LEVEL SECURITY;

-- Users can view contracts they are part of
CREATE POLICY "Users can view their FVM contracts" ON fvm_contracts
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can view storage contracts for their tasks" ON fvm_storage_contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Gigs" g 
      WHERE g.id = task_id 
      AND (g.client_id = auth.uid() OR g.lawyer_id = auth.uid())
    )
  );

-- Service role can manage all contracts
CREATE POLICY "Service role can manage FVM contracts" ON fvm_contracts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage storage contracts" ON fvm_storage_contracts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fvm_contracts_updated_at 
  BEFORE UPDATE ON fvm_contracts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fvm_storage_contracts_updated_at 
  BEFORE UPDATE ON fvm_storage_contracts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON fvm_contracts TO service_role;
GRANT ALL ON fvm_storage_contracts TO service_role;
GRANT SELECT ON fvm_contracts TO authenticated;
GRANT SELECT ON fvm_storage_contracts TO authenticated;