-- Messaging tables migration script
-- Created on 2025-06-15

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create trigger to update conversation after message insert
DROP TRIGGER IF EXISTS update_conversation_after_message_insert ON messages;
CREATE OR REPLACE FUNCTION update_conversation_after_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_id UUID;
  v_seller_id UUID;
BEGIN
  -- Get buyer and seller IDs from the conversation
  SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Update the conversation with the new message
  UPDATE conversations
  SET 
    last_message_id = NEW.id,
    updated_at = NOW(),
    -- Increment unread count for the recipient
    buyer_unread_count = CASE 
      WHEN NEW.sender_id = v_buyer_id THEN buyer_unread_count
      ELSE buyer_unread_count + 1
    END,
    seller_unread_count = CASE 
      WHEN NEW.sender_id = v_seller_id THEN seller_unread_count
      ELSE seller_unread_count + 1
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_after_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_after_message_insert();

-- Create function to send a message
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

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_type TEXT;
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
  
  -- Mark messages as read
  UPDATE messages
  SET read_at = NOW()
  WHERE 
    conversation_id = p_conversation_id AND 
    sender_id != p_user_id AND
    read_at IS NULL;
  
  -- Reset unread counter for the user
  IF v_user_type = 'buyer' THEN
    UPDATE conversations
    SET buyer_unread_count = 0
    WHERE id = p_conversation_id;
  ELSIF v_user_type = 'seller' THEN
    UPDATE conversations
    SET seller_unread_count = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable row level security for messaging tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'conversations' AND policyname = 'Users can view their own conversations'
  ) THEN
    CREATE POLICY "Users can view their own conversations" 
      ON conversations 
      FOR SELECT 
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'conversations' AND policyname = 'Users can insert conversations they are part of'
  ) THEN
    CREATE POLICY "Users can insert conversations they are part of" 
      ON conversations 
      FOR INSERT 
      WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'conversations' AND policyname = 'Users can update conversations they are part of'
  ) THEN
    CREATE POLICY "Users can update conversations they are part of" 
      ON conversations 
      FOR UPDATE 
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
END $$;

-- Create policies for messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Users can view messages in their conversations'
  ) THEN
    CREATE POLICY "Users can view messages in their conversations" 
      ON messages 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM conversations c 
          WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Users can insert messages in their conversations'
  ) THEN
    CREATE POLICY "Users can insert messages in their conversations" 
      ON messages 
      FOR INSERT 
      WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM conversations c 
          WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
      );
  END IF;
END $$;
