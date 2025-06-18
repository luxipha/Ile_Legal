-- Consolidated migration script for all tables and functions
-- Created on 2025-06-15

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base tables first
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  email TEXT,
  user_type TEXT DEFAULT 'buyer',
  bio TEXT,
  location TEXT,
  website TEXT,
  phone TEXT,
  
  -- Circle wallet fields
  circle_wallet_id UUID,
  circle_wallet_address TEXT,
  circle_wallet_created_at TIMESTAMPTZ,
  circle_wallet_status TEXT DEFAULT 'pending',
  
  -- Verification status
  verification_status TEXT DEFAULT 'unverified'
);

-- Create gigs table (basic structure)
CREATE TABLE IF NOT EXISTS gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  seller_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  status TEXT DEFAULT 'draft'
);

-- Create messaging tables
-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Participants
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Metadata
  gig_id UUID REFERENCES gigs(id),
  last_message_id UUID,
  buyer_unread_count INT DEFAULT 0,
  seller_unread_count INT DEFAULT 0,
  
  -- Ensure unique conversation per buyer-seller pair per gig
  UNIQUE(buyer_id, seller_id, gig_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- For attachments
  has_attachment BOOLEAN DEFAULT false,
  attachment_type TEXT,
  attachment_url TEXT
);

-- Create user verification tables
CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verification_data JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_gigs_seller_id ON gigs(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);

-- Create function to update conversation's updated_at timestamp and unread counts
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_unread_field TEXT;
  v_update_query TEXT;
BEGIN
  -- Determine which unread counter to increment based on sender
  SELECT 
    CASE 
      WHEN NEW.sender_id = c.buyer_id THEN 'seller_unread_count'
      ELSE 'buyer_unread_count'
    END INTO v_unread_field
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Update conversation with dynamic field name
  v_update_query := format('
    UPDATE conversations 
    SET 
      updated_at = NOW(), 
      last_message_id = %L,
      %I = %I + 1
    WHERE id = %L
  ', NEW.id, v_unread_field, v_unread_field, NEW.conversation_id);
  
  EXECUTE v_update_query;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation when message is inserted
DROP TRIGGER IF EXISTS update_conversation_after_message_insert ON messages;
CREATE TRIGGER update_conversation_after_message_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_type TEXT;
  v_update_query TEXT;
BEGIN
  -- Determine if user is buyer or seller
  SELECT 
    CASE 
      WHEN c.buyer_id = p_user_id THEN 'buyer'
      WHEN c.seller_id = p_user_id THEN 'seller'
      ELSE NULL
    END INTO v_user_type
  FROM conversations c
  WHERE c.id = p_conversation_id;
  
  -- Mark messages as read where user is not the sender
  UPDATE messages
  SET read_at = NOW()
  WHERE 
    conversation_id = p_conversation_id AND
    sender_id != p_user_id AND
    read_at IS NULL;
    
  -- Reset unread counter for this user
  v_update_query := format('
    UPDATE conversations 
    SET %I = 0
    WHERE id = %L
  ', v_user_type || '_unread_count', p_conversation_id);
  
  EXECUTE v_update_query;
END;
$$ LANGUAGE plpgsql;

-- Create function to send a message and update conversation in one transaction
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_has_attachment BOOLEAN DEFAULT false,
  p_attachment_type TEXT DEFAULT NULL,
  p_attachment_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert the message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    has_attachment,
    attachment_type,
    attachment_url
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_has_attachment,
    p_attachment_type,
    p_attachment_url
  )
  RETURNING id INTO v_message_id;
  
  -- The trigger will handle updating the conversation
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Enable row level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for gigs
CREATE POLICY "Gigs are viewable by everyone"
  ON gigs FOR SELECT
  USING (true);

CREATE POLICY "Sellers can insert their own gigs"
  ON gigs FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own gigs"
  ON gigs FOR UPDATE
  USING (auth.uid() = seller_id);

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
  ON conversations 
  FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert conversations they're part of" 
  ON conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations" 
  ON messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations" 
  ON messages 
  FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Create policies for user_verifications
CREATE POLICY "Users can view their own verifications"
  ON user_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications"
  ON user_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications"
  ON user_verifications FOR UPDATE
  USING (auth.uid() = user_id);
