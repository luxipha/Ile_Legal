-- Create app_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Enable RLS (Row Level Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read/write settings
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.user_metadata->>'role_title' = 'admin'
                OR auth.users.user_metadata->>'role' = 'admin'
            )
        )
    );

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
                "name": "Flutterwave",
                "enabled": false,
                "testMode": true
            },
            {
                "name": "Paystack",
                "enabled": true,
                "testMode": true
            }
        ],
        "lastUpdated": "' || NOW()::text || '"
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE app_settings IS 'Application configuration settings including payment providers';
COMMENT ON COLUMN app_settings.key IS 'Unique identifier for the setting group';
COMMENT ON COLUMN app_settings.settings IS 'JSON configuration data for the setting';