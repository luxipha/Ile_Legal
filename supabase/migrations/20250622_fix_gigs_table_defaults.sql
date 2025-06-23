-- Fix Gigs table missing default values
-- This resolves the "null value in column id violates not-null constraint" error

-- Add UUID default to id column
ALTER TABLE "Gigs" ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add timestamp defaults
ALTER TABLE "Gigs" ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE "Gigs" ALTER COLUMN updated_at SET DEFAULT now();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_gigs_updated_at ON "Gigs";
CREATE TRIGGER update_gigs_updated_at 
    BEFORE UPDATE ON "Gigs" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();