-- Consolidate all gig references to use the main "Gigs" table for consistency
-- This fixes foreign key constraint violations when submitting bids

-- Fix all foreign key constraints to point to the correct "Gigs" table

-- Bids table (already fixed but including for completeness)
ALTER TABLE "Bids" DROP CONSTRAINT IF EXISTS "Bids_gig_id_fkey";
ALTER TABLE "Bids" ADD CONSTRAINT "Bids_gig_id_fkey" 
  FOREIGN KEY (gig_id) REFERENCES "Gigs"(id) ON DELETE CASCADE;

-- Disputes table
ALTER TABLE "Disputes" DROP CONSTRAINT IF EXISTS "Disputes_gig_id_fkey";
ALTER TABLE "Disputes" ADD CONSTRAINT "Disputes_gig_id_fkey" 
  FOREIGN KEY (gig_id) REFERENCES "Gigs"(id) ON DELETE CASCADE;

-- Conversations table  
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_gig_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_gig_id_fkey 
  FOREIGN KEY (gig_id) REFERENCES "Gigs"(id);

-- Legal case completions table
ALTER TABLE legal_case_completions DROP CONSTRAINT IF EXISTS legal_case_completions_gig_id_fkey;
ALTER TABLE legal_case_completions ADD CONSTRAINT legal_case_completions_gig_id_fkey 
  FOREIGN KEY (gig_id) REFERENCES "Gigs"(id) ON DELETE SET NULL;

-- Reputation events table
ALTER TABLE reputation_events DROP CONSTRAINT IF EXISTS reputation_events_gig_id_fkey;
ALTER TABLE reputation_events ADD CONSTRAINT reputation_events_gig_id_fkey 
  FOREIGN KEY (gig_id) REFERENCES "Gigs"(id) ON DELETE SET NULL;

-- Note: Code has also been updated to use "Gigs" consistently:
-- - messagingService.ts: Updated to use "Gigs" table
-- - api.ts feedback function: Updated to use "Gigs" table