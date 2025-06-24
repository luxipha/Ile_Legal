-- Add missing core tables for Ile Legal platform
-- Created: 2025-06-21
-- Purpose: Add bids, disputes, feedback, work_submissions, and admin tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Bids table (API expects capitalized name)
CREATE TABLE IF NOT EXISTS public."Bids" (
  id integer PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  gig_id uuid REFERENCES public.gigs(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Create Disputes table (API expects capitalized name)
CREATE TABLE IF NOT EXISTS public."Disputes" (
  id serial PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  gig_id uuid REFERENCES public.gigs(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  details text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'resolved')),
  comments text,
  resolution_decision text,
  outcome text,
  refund_amount text,
  resolution_comment text
);

-- Create Feedback table (API expects capitalized name)
CREATE TABLE IF NOT EXISTS public."Feedback" (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  free_response text NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  gig_id integer NOT NULL,
  creator uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create Work Submissions table (API expects capitalized name with space)
CREATE TABLE IF NOT EXISTS public."Work Submissions" (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  gig_id uuid NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  deliverables text[] DEFAULT '{}',
  notes text DEFAULT '',
  blockchain_hashes jsonb DEFAULT '[]',
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'revision requested')),
  storage_type text DEFAULT 'supabase' CHECK (storage_type IN ('supabase', 'ipfs')),
  ipfs_data jsonb
);

-- Create user_documents table
CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_at timestamp with time zone,
  verified_by uuid REFERENCES auth.users(id),
  rejection_reason text
);

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb DEFAULT '{}'
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  requested_info text,
  created_by uuid REFERENCES auth.users(id),
  read_at timestamp with time zone
);

-- Create Gigs table (API expects capitalized name) - rename existing table
DROP TABLE IF EXISTS public."Gigs" CASCADE;
CREATE TABLE public."Gigs" AS SELECT * FROM public.gigs;
ALTER TABLE public."Gigs" ADD PRIMARY KEY (id);

-- Add missing columns to Gigs table  
ALTER TABLE public."Gigs" 
  ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget numeric(10, 2),
  ADD COLUMN IF NOT EXISTS deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bids integer[] DEFAULT '{}';

-- Create Profiles table (API expects capitalized name)
DROP TABLE IF EXISTS public."Profiles" CASCADE;
CREATE TABLE public."Profiles" AS SELECT * FROM public.profiles;
ALTER TABLE public."Profiles" ADD PRIMARY KEY (id);

-- Create indexes for performance (using exact table names API expects)
CREATE INDEX IF NOT EXISTS idx_bids_gig_id ON public."Bids"(gig_id);
CREATE INDEX IF NOT EXISTS idx_bids_seller_id ON public."Bids"(seller_id);
CREATE INDEX IF NOT EXISTS idx_bids_buyer_id ON public."Bids"(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public."Bids"(status);

CREATE INDEX IF NOT EXISTS idx_disputes_gig_id ON public."Disputes"(gig_id);
CREATE INDEX IF NOT EXISTS idx_disputes_buyer_id ON public."Disputes"(buyer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_seller_id ON public."Disputes"(seller_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public."Disputes"(status);

CREATE INDEX IF NOT EXISTS idx_feedback_gig_id ON public."Feedback"(gig_id);
CREATE INDEX IF NOT EXISTS idx_feedback_creator ON public."Feedback"(creator);
CREATE INDEX IF NOT EXISTS idx_feedback_recipient ON public."Feedback"(recipient);

CREATE INDEX IF NOT EXISTS idx_work_submissions_gig_id ON public."Work Submissions"(gig_id);
CREATE INDEX IF NOT EXISTS idx_work_submissions_seller_id ON public."Work Submissions"(seller_id);
CREATE INDEX IF NOT EXISTS idx_work_submissions_status ON public."Work Submissions"(status);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON public.user_documents(verification_status);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON public.admin_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(read_at);

CREATE INDEX IF NOT EXISTS idx_gigs_buyer_id ON public."Gigs"(buyer_id);
CREATE INDEX IF NOT EXISTS idx_gigs_is_flagged ON public."Gigs"(is_flagged);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public."Profiles"(id);

-- Enable RLS on new tables
ALTER TABLE public."Bids" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Disputes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Work Submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Gigs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Bids
CREATE POLICY "Bids are viewable by gig owner and bidder" ON public."Bids"
  FOR SELECT USING (
    auth.uid() = seller_id OR 
    auth.uid() = buyer_id OR
    auth.uid() IN (SELECT buyer_id FROM public."Gigs" WHERE "Gigs".id = "Bids".gig_id)
  );

CREATE POLICY "Sellers can insert bids" ON public."Bids"
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers and buyers can update bids" ON public."Bids"
  FOR UPDATE USING (
    auth.uid() = seller_id OR 
    auth.uid() = buyer_id OR
    auth.uid() IN (SELECT buyer_id FROM public."Gigs" WHERE "Gigs".id = "Bids".gig_id)
  );

CREATE POLICY "Sellers can delete their own pending bids" ON public."Bids"
  FOR DELETE USING (auth.uid() = seller_id AND status = 'pending');

-- RLS Policies for Disputes
CREATE POLICY "Users can view disputes they're involved in" ON public."Disputes"
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create disputes for their gigs" ON public."Disputes"
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for Feedback
CREATE POLICY "Users can view feedback they created or received" ON public."Feedback"
  FOR SELECT USING (auth.uid() = creator OR auth.uid() = recipient);

CREATE POLICY "Users can create feedback" ON public."Feedback"
  FOR INSERT WITH CHECK (auth.uid() = creator);

-- RLS Policies for Work Submissions
CREATE POLICY "Users can view submissions for their gigs" ON public."Work Submissions"
  FOR SELECT USING (
    auth.uid() = seller_id OR 
    auth.uid() IN (SELECT buyer_id FROM public."Gigs" WHERE "Gigs".id = "Work Submissions".gig_id)
  );

CREATE POLICY "Sellers can create submissions" ON public."Work Submissions"
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- RLS Policies for Gigs
CREATE POLICY "Gigs are viewable by everyone" ON public."Gigs"
  FOR SELECT USING (true);

CREATE POLICY "Buyers can insert their own gigs" ON public."Gigs"
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own gigs" ON public."Gigs"
  FOR UPDATE USING (auth.uid() = buyer_id);

-- RLS Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public."Profiles"
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public."Profiles"
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_documents
CREATE POLICY "Users can view their own documents" ON public.user_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents" ON public.user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Add sample data for testing (optional)
INSERT INTO public."Bids" (id, gig_id, seller_id, buyer_id, amount, description, status)
SELECT 
  1,
  g.id,
  (SELECT id FROM auth.users WHERE email LIKE '%seller%' LIMIT 1),
  g.buyer_id,
  50000,
  'Sample bid for testing',
  'pending'
FROM public."Gigs" g
WHERE g.buyer_id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public."Feedback" (free_response, rating, gig_id, creator, recipient)
SELECT 
  'Excellent work, very professional and thorough.',
  5,
  1,
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users OFFSET 1 LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users)
ON CONFLICT DO NOTHING;

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 52428800, '{"application/pdf","image/jpeg","image/png","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}'),
  ('deliverables', 'deliverables', false, 104857600, '{"application/pdf","image/jpeg","image/png","application/zip","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public."Bids" IS 'Bids placed by sellers on gigs posted by buyers';
COMMENT ON TABLE public."Disputes" IS 'Dispute resolution system for gig conflicts';
COMMENT ON TABLE public."Feedback" IS 'Rating and review system for completed gigs';
COMMENT ON TABLE public."Work Submissions" IS 'Work deliverable submissions from sellers to buyers';
COMMENT ON TABLE public."Gigs" IS 'Gigs posted by buyers for legal services';
COMMENT ON TABLE public."Profiles" IS 'User profiles with extended information';
COMMENT ON TABLE public.user_documents IS 'User verification documents for admin review';
COMMENT ON TABLE public.admin_actions IS 'Log of all admin actions for audit trail';
COMMENT ON TABLE public.user_notifications IS 'User notification system for platform communications';