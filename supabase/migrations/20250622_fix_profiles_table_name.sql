-- Fix Profiles table name to match application code expectations
-- The application code queries 'profiles' (lowercase) but the database has "Profiles" (capitalized)
-- This migration renames the table to maintain consistency with existing code

-- Drop the capitalized Profiles table and recreate as lowercase profiles
DROP TABLE IF EXISTS public."Profiles" CASCADE;

-- Rename or ensure the profiles table exists with correct structure
-- If profiles table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  name TEXT, -- For backward compatibility
  avatar_url TEXT,
  email TEXT,
  user_type TEXT DEFAULT 'buyer',
  bio TEXT,
  location TEXT,
  website TEXT,
  phone TEXT,
  title TEXT DEFAULT 'Legal Professional', -- For seller titles
  rating NUMERIC(3,2) DEFAULT 0, -- For seller ratings
  completed_jobs INTEGER DEFAULT 0, -- For seller job count
  
  -- Circle wallet fields
  circle_wallet_id UUID,
  circle_wallet_address TEXT,
  circle_wallet_created_at TIMESTAMPTZ,
  circle_wallet_status TEXT DEFAULT 'pending',
  
  -- Verification status
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_data JSONB,
  
  -- Reputation fields
  reputation_score INTEGER DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating);

-- Add RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles (for seller information display)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);