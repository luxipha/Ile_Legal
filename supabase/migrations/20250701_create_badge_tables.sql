-- Badge persistence tables for Phase 1 MVP
-- Ensures users don't lose their badges when calculation logic changes

-- Badge definitions (master data for all available badges)
CREATE TABLE badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reputation', 'achievement', 'quality', 'verification')),
  category TEXT,
  requirements JSONB DEFAULT '{}',
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User earned badges (persistent storage)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_date TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  blockchain_tx_id TEXT,
  tier TEXT, -- For reputation badges: novice, competent, proficient, expert, master
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Badge progress tracking (for badges with progress requirements)
CREATE TABLE badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  required_progress INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes for performance
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_date ON user_badges(earned_date);
CREATE INDEX idx_badge_progress_user_id ON badge_progress(user_id);
CREATE INDEX idx_badge_definitions_type ON badge_definitions(type);
CREATE INDEX idx_badge_definitions_rarity ON badge_definitions(rarity);

-- Enable Row Level Security
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Badge definitions: readable by all authenticated users
CREATE POLICY "Badge definitions are viewable by authenticated users" ON badge_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

-- User badges: users can view their own badges, others can view public badges
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' badges for public profiles" ON user_badges
  FOR SELECT USING (true); -- For MVP, all badges are public

-- Badge progress: users can only view their own progress
CREATE POLICY "Users can view their own badge progress" ON badge_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all badge data
CREATE POLICY "Service role can manage badge definitions" ON badge_definitions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage user badges" ON user_badges
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage badge progress" ON badge_progress
  FOR ALL USING (auth.role() = 'service_role');

-- Insert Phase 1 badge definitions
INSERT INTO badge_definitions (id, name, description, type, category, requirements, rarity) VALUES
-- Reputation Tier Badges
('tier_novice', 'Novice Professional', 'New to the platform, building reputation', 'reputation', 'tier', '{"min_score": 0, "max_score": 24}', 'common'),
('tier_competent', 'Competent Professional', 'Developing professional with 25+ reputation score', 'reputation', 'tier', '{"min_score": 25, "max_score": 49}', 'common'),
('tier_proficient', 'Proficient Professional', 'Competent and reliable with 50+ reputation score', 'reputation', 'tier', '{"min_score": 50, "max_score": 74}', 'rare'),
('tier_expert', 'Expert Professional', 'Highly experienced and trusted with 75+ reputation score', 'reputation', 'tier', '{"min_score": 75, "max_score": 89}', 'epic'),
('tier_master', 'Master Professional', 'Exceptional legal professional with 90+ reputation score', 'reputation', 'tier', '{"min_score": 90, "max_score": 100}', 'legendary'),

-- Achievement Badges
('first_gig', 'First Gig Complete', 'Completed your first gig on the platform', 'achievement', 'milestone', '{"required_completions": 1}', 'common'),
('five_gigs', '5 Gigs Complete', 'Completed 5 gigs successfully', 'achievement', 'milestone', '{"required_completions": 5}', 'common'),
('ten_gigs', '10 Gigs Complete', 'Completed 10 gigs successfully', 'achievement', 'milestone', '{"required_completions": 10}', 'rare'),
('twenty_five_gigs', '25 Gigs Complete', 'Completed 25 gigs successfully', 'achievement', 'milestone', '{"required_completions": 25}', 'rare'),
('fifty_gigs', '50 Gigs Complete', 'Completed 50 gigs successfully', 'achievement', 'milestone', '{"required_completions": 50}', 'epic'),
('hundred_gigs', '100 Gigs Complete', 'Completed 100 gigs successfully', 'achievement', 'milestone', '{"required_completions": 100}', 'legendary'),

-- Quality Badges
('five_star_streak', '5-Star Streak', '5 consecutive 5-star reviews', 'quality', 'performance', '{"required_rating": 5.0, "required_count": 5}', 'rare'),
('client_favorite', 'Client Favorite', '4.8+ average rating with 10+ completed gigs', 'quality', 'performance', '{"min_rating": 4.8, "min_completions": 10}', 'rare'),
('quick_responder', 'Quick Responder', 'Responds to clients within 2 hours consistently', 'quality', 'performance', '{"max_response_time": 2}', 'common'),
('perfectionist', 'Perfectionist', '10 consecutive 5-star reviews', 'quality', 'performance', '{"required_rating": 4.9, "required_count": 10}', 'epic'),

-- Verification Badges
('identity_verified', 'Identity Verified', 'Government-issued ID confirmed and verified', 'verification', 'identity', '{"verification_type": "identity"}', 'common'),
('professional_credentials', 'Professional Credentials', 'Educational degrees and certifications verified', 'verification', 'credentials', '{"verification_type": "credentials"}', 'rare'),
('bar_license_verified', 'Bar License Verified', 'Active bar admission status confirmed', 'verification', 'credentials', '{"verification_type": "bar_license"}', 'epic');

-- Functions for badge management
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_id TEXT,
  p_tier TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_blockchain_tx_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  badge_uuid UUID;
BEGIN
  -- Insert the badge if it doesn't exist, update if it does
  INSERT INTO user_badges (user_id, badge_id, tier, metadata, blockchain_tx_id)
  VALUES (p_user_id, p_badge_id, p_tier, p_metadata, p_blockchain_tx_id)
  ON CONFLICT (user_id, badge_id) 
  DO UPDATE SET 
    tier = EXCLUDED.tier,
    metadata = EXCLUDED.metadata,
    blockchain_tx_id = COALESCE(EXCLUDED.blockchain_tx_id, user_badges.blockchain_tx_id),
    updated_at = NOW()
  RETURNING id INTO badge_uuid;
  
  RETURN badge_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user badges with definitions
CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_id TEXT,
  name TEXT,
  description TEXT,
  type TEXT,
  category TEXT,
  rarity TEXT,
  tier TEXT,
  earned_date TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bd.id as badge_id,
    bd.name,
    bd.description,
    bd.type,
    bd.category,
    bd.rarity,
    ub.tier,
    ub.earned_date,
    ub.metadata
  FROM user_badges ub
  JOIN badge_definitions bd ON ub.badge_id = bd.id
  WHERE ub.user_id = p_user_id
  ORDER BY ub.earned_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update badge progress
CREATE OR REPLACE FUNCTION update_badge_progress(
  p_user_id UUID,
  p_badge_id TEXT,
  p_current_progress INTEGER,
  p_required_progress INTEGER,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO badge_progress (user_id, badge_id, current_progress, required_progress, metadata)
  VALUES (p_user_id, p_badge_id, p_current_progress, p_required_progress, p_metadata)
  ON CONFLICT (user_id, badge_id)
  DO UPDATE SET 
    current_progress = EXCLUDED.current_progress,
    required_progress = EXCLUDED.required_progress,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has badge
CREATE OR REPLACE FUNCTION user_has_badge(p_user_id UUID, p_badge_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_badges 
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_badge_definitions_updated_at BEFORE UPDATE ON badge_definitions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_badges_updated_at BEFORE UPDATE ON user_badges FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_badge_progress_updated_at BEFORE UPDATE ON badge_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();