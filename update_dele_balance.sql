-- Update Dele's wallet balance to show the funded amount
-- Since Circle API is failing, we'll update the stored balance

UPDATE user_wallets 
SET balance_usdc = 10.00, -- Update this to actual funded amount
    updated_at = NOW()
WHERE user_id = 'c2be92c0-3336-4fd6-824e-b6b6ab790ca1'
  AND is_active = true;

-- Verify the update
SELECT user_id, circle_wallet_id, wallet_address, balance_usdc, balance_matic 
FROM user_wallets 
WHERE user_id = 'c2be92c0-3336-4fd6-824e-b6b6ab790ca1';