-- Add foreign key relationships for the messaging system

-- First, check if the conversations table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
    -- Add foreign key references to profiles table
    -- We need to use ALTER TABLE to add foreign key references that Supabase can recognize for joins
    
    -- Check if the foreign keys already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_buyer_id_fkey' 
      AND table_name = 'conversations'
    ) THEN
      -- Add the buyer_id foreign key
      ALTER TABLE conversations 
      DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey;
      
      ALTER TABLE conversations
      ADD CONSTRAINT conversations_buyer_id_fkey
      FOREIGN KEY (buyer_id)
      REFERENCES profiles(id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_seller_id_fkey' 
      AND table_name = 'conversations'
    ) THEN
      -- Add the seller_id foreign key
      ALTER TABLE conversations 
      DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey;
      
      ALTER TABLE conversations
      ADD CONSTRAINT conversations_seller_id_fkey
      FOREIGN KEY (seller_id)
      REFERENCES profiles(id);
    END IF;
    
    -- Add explicit foreign key reference to gigs table if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_gig_id_fkey' 
      AND table_name = 'conversations'
    ) THEN
      -- Add the gig_id foreign key
      ALTER TABLE conversations 
      DROP CONSTRAINT IF EXISTS conversations_gig_id_fkey;
      
      ALTER TABLE conversations
      ADD CONSTRAINT conversations_gig_id_fkey
      FOREIGN KEY (gig_id)
      REFERENCES gigs(id);
    END IF;
    
    -- Create a view that joins conversations with profiles for easier querying
    -- This is an alternative approach if the foreign keys don't work
    DROP VIEW IF EXISTS conversations_with_profiles;
    
    CREATE VIEW conversations_with_profiles AS
    SELECT 
      c.*,
      CONCAT(b.first_name, ' ', b.last_name) AS buyer_full_name,
      b.avatar_url AS buyer_avatar_url,
      CONCAT(s.first_name, ' ', s.last_name) AS seller_full_name,
      s.avatar_url AS seller_avatar_url,
      g.title AS gig_title,
      g.description AS gig_description
    FROM 
      conversations c
      LEFT JOIN profiles b ON c.buyer_id = b.id
      LEFT JOIN profiles s ON c.seller_id = s.id
      LEFT JOIN gigs g ON c.gig_id = g.id;
      
    -- Update RLS policies for the view
    ALTER VIEW conversations_with_profiles OWNER TO postgres;
    
    -- Grant access to authenticated users
    GRANT SELECT ON conversations_with_profiles TO authenticated;
    
    RAISE NOTICE 'Foreign key relationships added successfully';
  ELSE
    RAISE NOTICE 'Conversations table does not exist';
  END IF;
END $$;
