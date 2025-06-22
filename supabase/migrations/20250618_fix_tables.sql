-- Fix tables to match the API expectations
-- Add missing columns and create expected table structure

-- Drop existing gigs table and recreate with proper structure
DROP TABLE IF EXISTS gigs CASCADE;

-- Create Gigs table (note: Supabase is case-insensitive for table names, but let's be explicit)
CREATE TABLE gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  budget DECIMAL(10, 2),
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  buyer_id UUID REFERENCES auth.users(id),
  attachments TEXT[] DEFAULT '{}',
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create Bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gigs_buyer_id ON gigs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON gigs(created_at);
CREATE INDEX IF NOT EXISTS idx_bids_gig_id ON bids(gig_id);
CREATE INDEX IF NOT EXISTS idx_bids_seller_id ON bids(seller_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

-- Enable RLS
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Create policies for gigs
DROP POLICY IF EXISTS "Gigs are viewable by everyone" ON gigs;
DROP POLICY IF EXISTS "Buyers can insert their own gigs" ON gigs;
DROP POLICY IF EXISTS "Buyers can update their own gigs" ON gigs;

CREATE POLICY "Gigs are viewable by everyone"
  ON gigs FOR SELECT
  USING (true);

CREATE POLICY "Buyers can insert their own gigs"
  ON gigs FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own gigs"
  ON gigs FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Create policies for bids
CREATE POLICY "Bids are viewable by gig owner and bidder"
  ON bids FOR SELECT
  USING (
    auth.uid() = seller_id OR 
    auth.uid() IN (SELECT buyer_id FROM gigs WHERE gigs.id = bids.gig_id)
  );

CREATE POLICY "Sellers can insert bids"
  ON bids FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers and buyers can update bids"
  ON bids FOR UPDATE
  USING (
    auth.uid() = seller_id OR 
    auth.uid() IN (SELECT buyer_id FROM gigs WHERE gigs.id = bids.gig_id)
  );

CREATE POLICY "Sellers can delete their own pending bids"
  ON bids FOR DELETE
  USING (auth.uid() = seller_id AND status = 'pending');

-- Add some sample data for testing
INSERT INTO gigs (title, description, categories, budget, deadline, status, buyer_id) VALUES
  (
    'Land Title Verification for Property Purchase',
    'I need a qualified legal professional to verify the title documents for a property I am considering purchasing in Lekki, Lagos. The verification should include checking the Certificate of Occupancy, survey documents, and ensuring there are no encumbrances on the property.',
    ARRAY['land-title', 'due-diligence'],
    75000,
    NOW() + INTERVAL '14 days',
    'active',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    'Contract Review for Business Partnership',
    'Looking for an experienced lawyer to review a partnership agreement for a new business venture. The contract involves profit sharing, responsibilities, and exit clauses that need thorough legal review.',
    ARRAY['contract-review', 'business-law'],
    50000,
    NOW() + INTERVAL '7 days',
    'active',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    'Property Survey and Documentation',
    'Need comprehensive property survey and legal documentation for a commercial property in Victoria Island. This includes boundary verification and preparation of all necessary legal documents.',
    ARRAY['property-survey', 'legal-documentation'],
    120000,
    NOW() + INTERVAL '21 days',
    'active',
    (SELECT id FROM auth.users LIMIT 1)
  );