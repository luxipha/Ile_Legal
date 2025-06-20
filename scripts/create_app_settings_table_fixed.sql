-- Create app_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings (key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO app_settings (key, settings) VALUES (
    'app_settings',
    '{
        "paymentProviders": [
            {
                "name": "Circle",
                "enabled": true,
                "testMode": true,
                "apiKey": "TEST_API_KEY:10a0b7b4cedfaa42d6ce306592fec59f:cfae665cde083f9236de7be92d08f54c",
                "escrowWalletId": "52a2c755-6045-5217-8d70-8ac28dc221ba"
            },
            {
                "name": "Stripe",
                "enabled": false,
                "testMode": true
            },
            {
                "name": "PayPal",
                "enabled": false,
                "testMode": true
            },
            {
                "name": "Flutterwave",
                "enabled": false,
                "testMode": true
            },
            {
                "name": "Paystack",
                "enabled": false,
                "testMode": true
            }
        ],
        "lastUpdated": "2025-06-19T17:45:00.000Z"
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;