-- Add USDFC (USD Coin on Filecoin) support to payment system
-- This migration enhances existing tables for Filecoin blockchain payments

-- Add blockchain and token support to Payments table
ALTER TABLE "Payments" 
ADD COLUMN IF NOT EXISTS blockchain_network TEXT,
ADD COLUMN IF NOT EXISTS payment_token TEXT,
ADD COLUMN IF NOT EXISTS is_usdfc_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contract_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS fvm_contract_address TEXT;

-- Add indexes for blockchain payment queries
CREATE INDEX IF NOT EXISTS idx_payments_blockchain_network 
ON "Payments"(blockchain_network);

CREATE INDEX IF NOT EXISTS idx_payments_payment_token 
ON "Payments"(payment_token);

CREATE INDEX IF NOT EXISTS idx_payments_usdfc 
ON "Payments"(is_usdfc_payment) WHERE is_usdfc_payment = TRUE;

CREATE INDEX IF NOT EXISTS idx_payments_contract_tx 
ON "Payments"(contract_transaction_id);

-- Add blockchain support to user_wallets table
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS supported_networks JSONB DEFAULT '["ETHEREUM", "POLYGON"]',
ADD COLUMN IF NOT EXISTS filecoin_address TEXT,
ADD COLUMN IF NOT EXISTS usdfc_balance DECIMAL(15, 6) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS network_balances JSONB DEFAULT '{}';

-- Add indexes for multichain wallet queries
CREATE INDEX IF NOT EXISTS idx_user_wallets_filecoin_address 
ON user_wallets(filecoin_address);

CREATE INDEX IF NOT EXISTS idx_user_wallets_supported_networks_gin 
ON user_wallets USING GIN (supported_networks);

-- Function to process USDFC payment with FVM integration
CREATE OR REPLACE FUNCTION process_usdfc_payment(
  p_payment_id TEXT,
  p_buyer_id UUID,
  p_seller_id UUID,
  p_amount DECIMAL,
  p_task_id INTEGER,
  p_contract_tx_id TEXT,
  p_fvm_contract_address TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  payment_exists BOOLEAN;
BEGIN
  -- Check if payment already exists
  SELECT EXISTS(SELECT 1 FROM "Payments" WHERE id = p_payment_id) INTO payment_exists;
  
  IF payment_exists THEN
    -- Update existing payment with blockchain details
    UPDATE "Payments" 
    SET 
      blockchain_network = 'FILECOIN',
      payment_token = 'USDFC',
      is_usdfc_payment = TRUE,
      contract_transaction_id = p_contract_tx_id,
      fvm_contract_address = p_fvm_contract_address,
      status = 'escrowed',
      updated_at = NOW()
    WHERE id = p_payment_id;
  ELSE
    -- Create new USDFC payment record
    INSERT INTO "Payments" (
      id,
      task_id,
      buyer_id,
      seller_id,
      amount,
      currency,
      blockchain_network,
      payment_token,
      is_usdfc_payment,
      contract_transaction_id,
      fvm_contract_address,
      payment_method,
      status,
      created_at
    ) VALUES (
      p_payment_id,
      p_task_id,
      p_buyer_id,
      p_seller_id,
      p_amount,
      'USDFC',
      'FILECOIN',
      'USDFC',
      TRUE,
      p_contract_tx_id,
      p_fvm_contract_address,
      'wallet',
      'escrowed',
      NOW()
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release USDFC escrow funds to seller
CREATE OR REPLACE FUNCTION release_usdfc_escrow(
  p_payment_id TEXT,
  p_release_tx_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "Payments"
  SET 
    status = 'completed',
    escrow_released_at = NOW(),
    release_transaction_id = p_release_tx_id,
    updated_at = NOW()
  WHERE 
    id = p_payment_id 
    AND is_usdfc_payment = TRUE 
    AND status = 'escrowed';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get USDFC payment details
CREATE OR REPLACE FUNCTION get_usdfc_payment_details(p_payment_id TEXT)
RETURNS TABLE (
  payment_id TEXT,
  task_id INTEGER,
  buyer_id UUID,
  seller_id UUID,
  amount DECIMAL,
  currency TEXT,
  blockchain_network TEXT,
  payment_token TEXT,
  contract_transaction_id TEXT,
  fvm_contract_address TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  escrow_released_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.task_id,
    p.buyer_id,
    p.seller_id,
    p.amount,
    p.currency,
    p.blockchain_network,
    p.payment_token,
    p.contract_transaction_id,
    p.fvm_contract_address,
    p.status,
    p.created_at,
    p.escrow_released_at
  FROM "Payments" p
  WHERE p.id = p_payment_id AND p.is_usdfc_payment = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user wallet with Filecoin support
CREATE OR REPLACE FUNCTION add_filecoin_wallet_support(
  p_user_id UUID,
  p_filecoin_address TEXT,
  p_usdfc_balance DECIMAL DEFAULT 0.00
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_wallets (
    user_id,
    filecoin_address,
    usdfc_balance,
    supported_networks,
    network_balances,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_filecoin_address,
    p_usdfc_balance,
    '["ETHEREUM", "POLYGON", "FILECOIN"]'::jsonb,
    jsonb_build_object('FILECOIN', p_usdfc_balance),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    filecoin_address = p_filecoin_address,
    usdfc_balance = p_usdfc_balance,
    supported_networks = jsonb_set(
      COALESCE(user_wallets.supported_networks, '[]'::jsonb),
      '{0}',
      '"FILECOIN"'::jsonb,
      TRUE
    ),
    network_balances = jsonb_set(
      COALESCE(user_wallets.network_balances, '{}'::jsonb),
      '{FILECOIN}',
      to_jsonb(p_usdfc_balance)
    ),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get multichain wallet balances
CREATE OR REPLACE FUNCTION get_multichain_wallet_balances(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  ethereum_balance DECIMAL,
  polygon_balance DECIMAL,
  filecoin_balance DECIMAL,
  total_usd_value DECIMAL,
  supported_networks JSONB,
  wallet_addresses JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.user_id,
    COALESCE(uw.balance, 0) as ethereum_balance,
    COALESCE((uw.network_balances->>'POLYGON')::decimal, 0) as polygon_balance,
    COALESCE(uw.usdfc_balance, 0) as filecoin_balance,
    COALESCE(uw.balance, 0) + 
    COALESCE((uw.network_balances->>'POLYGON')::decimal, 0) + 
    COALESCE(uw.usdfc_balance, 0) as total_usd_value,
    COALESCE(uw.supported_networks, '["ETHEREUM"]'::jsonb) as supported_networks,
    jsonb_build_object(
      'ETHEREUM', uw.wallet_address,
      'FILECOIN', uw.filecoin_address
    ) as wallet_addresses
  FROM user_wallets uw
  WHERE uw.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing column for escrow release tracking
ALTER TABLE "Payments" 
ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS release_transaction_id TEXT;

-- Create index for escrow release tracking
CREATE INDEX IF NOT EXISTS idx_payments_escrow_released 
ON "Payments"(escrow_released_at) WHERE escrow_released_at IS NOT NULL;

-- Grant necessary permissions to service role
GRANT EXECUTE ON FUNCTION process_usdfc_payment(TEXT, UUID, UUID, DECIMAL, INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION release_usdfc_escrow(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_usdfc_payment_details(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_filecoin_wallet_support(UUID, TEXT, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION get_multichain_wallet_balances(UUID) TO service_role;

-- Add comments explaining the USDFC integration
COMMENT ON COLUMN "Payments".is_usdfc_payment IS 'Flag indicating payment made with USD Coin on Filecoin (USDFC)';
COMMENT ON COLUMN "Payments".fvm_contract_address IS 'Filecoin Virtual Machine contract address for escrow functionality';
COMMENT ON COLUMN user_wallets.filecoin_address IS 'User Filecoin wallet address for USDFC payments';
COMMENT ON COLUMN user_wallets.supported_networks IS 'Array of blockchain networks supported by this wallet';

-- Update trigger for Payments table updated_at
CREATE TRIGGER update_payments_updated_at 
BEFORE UPDATE ON "Payments" 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();