-- Loyalty system for buyers and sellers
-- Adds Bricks points system and loyalty badges

-- User loyalty points tracking
CREATE TABLE user_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bricks INTEGER DEFAULT 0 NOT NULL,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  last_login_date DATE,
  last_activity_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Bricks transaction log
CREATE TABLE bricks_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bricks_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus')),
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_loyalty_user_id ON user_loyalty(user_id);
CREATE INDEX idx_user_loyalty_total_bricks ON user_loyalty(total_bricks);
CREATE INDEX idx_bricks_transactions_user_id ON bricks_transactions(user_id);
CREATE INDEX idx_bricks_transactions_created_at ON bricks_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE user_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE bricks_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- User loyalty: users can view their own data
CREATE POLICY "Users can view their own loyalty data" ON user_loyalty
  FOR SELECT USING (auth.uid() = user_id);

-- Bricks transactions: users can view their own transactions
CREATE POLICY "Users can view their own bricks transactions" ON bricks_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all loyalty data
CREATE POLICY "Service role can manage user loyalty" ON user_loyalty
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage bricks transactions" ON bricks_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Add loyalty badges to existing badge definitions
INSERT INTO badge_definitions (id, name, description, type, category, requirements, rarity) VALUES
-- Loyalty Badges
('loyalty_active', 'Active User', 'Regular platform engagement', 'loyalty', 'engagement', '{"min_logins": 7}', 'common'),
('loyalty_milestone', 'Bricks Collector', 'Earned 100+ Bricks points', 'loyalty', 'milestone', '{"min_bricks": 100}', 'rare'),
('loyalty_streak', 'Streak Master', '7+ consecutive days of login', 'loyalty', 'streak', '{"min_streak": 7}', 'rare'),
('loyalty_engagement', 'Platform Enthusiast', 'High engagement with platform features', 'loyalty', 'activity', '{"min_activities": 20}', 'common');

-- Function to award Bricks
CREATE OR REPLACE FUNCTION award_bricks(
  p_user_id UUID,
  p_bricks_amount INTEGER,
  p_reason TEXT,
  p_transaction_type TEXT DEFAULT 'earned',
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  transaction_uuid UUID;
BEGIN
  -- Insert transaction record
  INSERT INTO bricks_transactions (user_id, bricks_amount, transaction_type, reason, metadata)
  VALUES (p_user_id, p_bricks_amount, p_transaction_type, p_reason, p_metadata)
  RETURNING id INTO transaction_uuid;
  
  -- Update user's total bricks
  INSERT INTO user_loyalty (user_id, total_bricks, last_activity_date)
  VALUES (p_user_id, p_bricks_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_bricks = user_loyalty.total_bricks + p_bricks_amount,
    last_activity_date = NOW(),
    updated_at = NOW();
  
  RETURN transaction_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  last_login DATE;
BEGIN
  -- Get current streak and last login
  SELECT streak_days, last_login_date INTO current_streak, last_login
  FROM user_loyalty WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_loyalty (user_id, streak_days, last_login_date, last_activity_date)
    VALUES (p_user_id, 1, CURRENT_DATE, NOW());
    RETURN 1;
  END IF;
  
  -- If already logged in today, return current streak
  IF last_login = CURRENT_DATE THEN
    RETURN current_streak;
  END IF;
  
  -- If logged in yesterday, increment streak
  IF last_login = CURRENT_DATE - INTERVAL '1 day' THEN
    current_streak := current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    current_streak := 1;
  END IF;
  
  -- Update the record
  UPDATE user_loyalty 
  SET streak_days = current_streak,
      last_login_date = CURRENT_DATE,
      last_activity_date = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user loyalty stats
CREATE OR REPLACE FUNCTION get_user_loyalty_stats(p_user_id UUID)
RETURNS TABLE (
  total_bricks INTEGER,
  streak_days INTEGER,
  last_login_date DATE,
  loyalty_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.total_bricks,
    ul.streak_days,
    ul.last_login_date,
    CASE 
      WHEN ul.total_bricks >= 500 THEN 'Gold'
      WHEN ul.total_bricks >= 200 THEN 'Silver'
      WHEN ul.total_bricks >= 50 THEN 'Bronze'
      ELSE 'Starter'
    END as loyalty_level
  FROM user_loyalty ul
  WHERE ul.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamp
CREATE TRIGGER update_user_loyalty_updated_at BEFORE UPDATE ON user_loyalty FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();