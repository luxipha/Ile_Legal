-- Enable RLS on app_settings table
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- In production, you might want to restrict this to admin users only
CREATE POLICY "Allow all operations for authenticated users" ON app_settings
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Create policy to allow read access for anon users (if needed)
CREATE POLICY "Allow read access for anon users" ON app_settings
    FOR SELECT 
    TO anon 
    USING (true);

-- Grant necessary permissions
GRANT ALL ON app_settings TO authenticated;
GRANT SELECT ON app_settings TO anon;