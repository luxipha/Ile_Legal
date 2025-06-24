-- Fix Bids table foreign key constraint
-- The Bids table was referencing lowercase 'gigs' table but the app uses capitalized "Gigs" table

-- Drop the incorrect foreign key constraint
ALTER TABLE "Bids" DROP CONSTRAINT IF EXISTS "Bids_gig_id_fkey";

-- Add the correct foreign key constraint pointing to capitalized Gigs table
ALTER TABLE "Bids" ADD CONSTRAINT "Bids_gig_id_fkey" 
  FOREIGN KEY (gig_id) REFERENCES "Gigs"(id) ON DELETE CASCADE;

-- Update RLS policies to also reference the correct table (they should already be correct)
-- The policies already reference "Gigs" table correctly, so no changes needed