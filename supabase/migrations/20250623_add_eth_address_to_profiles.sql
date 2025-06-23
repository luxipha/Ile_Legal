-- Add ETH address field to Profiles table for MetaMask wallet integration
-- This allows users to have both Circle wallet and ETH wallet addresses

-- Add eth_address column to Profiles table
ALTER TABLE "Profiles" ADD COLUMN IF NOT EXISTS eth_address TEXT;

-- Create index for efficient ETH address lookups
CREATE INDEX IF NOT EXISTS idx_profiles_eth_address ON "Profiles"(eth_address);

-- Add unique constraint to prevent duplicate ETH addresses
ALTER TABLE "Profiles" ADD CONSTRAINT unique_eth_address UNIQUE (eth_address);

-- Add comment for documentation
COMMENT ON COLUMN "Profiles".eth_address IS 'Ethereum wallet address for MetaMask integration';