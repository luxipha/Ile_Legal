-- Test loyalty data for Dele Muhammad (seller)
-- User ID: c2be92c0-3336-4fd6-824e-b6b6ab790ca1

-- Initialize his loyalty account with some activity
INSERT INTO user_loyalty (user_id, total_bricks, streak_days, last_login_date, last_activity_date)
VALUES ('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 150, 8, CURRENT_DATE, NOW())
ON CONFLICT (user_id) DO UPDATE SET
  total_bricks = EXCLUDED.total_bricks,
  streak_days = EXCLUDED.streak_days,
  last_login_date = EXCLUDED.last_login_date,
  last_activity_date = EXCLUDED.last_activity_date;

-- Add transaction history showing how he earned his Bricks
INSERT INTO bricks_transactions (user_id, bricks_amount, transaction_type, reason, metadata, created_at) VALUES
-- Welcome bonus (when he joined)
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 20, 'bonus', 'welcome bonus', '{"welcome": true}', NOW() - INTERVAL '10 days'),

-- Daily login points over the past week
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 1}', NOW() - INTERVAL '8 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 2}', NOW() - INTERVAL '7 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 3}', NOW() - INTERVAL '6 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 4}', NOW() - INTERVAL '5 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 5}', NOW() - INTERVAL '4 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 6}', NOW() - INTERVAL '3 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 7}', NOW() - INTERVAL '2 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'daily login', '{"streak_days": 8}', NOW() - INTERVAL '1 day'),

-- 7-day streak bonus
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 25, 'bonus', '7-day streak bonus', '{"milestone": "7_day_streak"}', NOW() - INTERVAL '2 days'),

-- Activity-based points
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 25, 'earned', 'completing profile', '{"activity_type": "profile_completed"}', NOW() - INTERVAL '9 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 10, 'earned', 'creating gig listing', '{"activity_type": "gig_created", "gig_id": "demo-gig-1"}', NOW() - INTERVAL '8 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 50, 'earned', 'completing gig', '{"activity_type": "gig_completed", "gig_id": "demo-gig-1"}', NOW() - INTERVAL '6 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'leaving review', '{"activity_type": "review_given", "review_id": "demo-review-1"}', NOW() - INTERVAL '5 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 5, 'earned', 'uploading document', '{"activity_type": "document_uploaded"}', NOW() - INTERVAL '4 days'),
('c2be92c0-3336-4fd6-824e-b6b6ab790ca1', 10, 'earned', 'receiving payment', '{"activity_type": "payment_received", "amount": 500}', NOW() - INTERVAL '3 days');

-- This should give him:
-- Total: 150 Bricks (enough for Bricks Collector badge - 100+ requirement)
-- Streak: 8 days (enough for Streak Master badge - 7+ requirement)
-- Activities: 7 earned transactions (working towards Platform Enthusiast - 20+ requirement)
-- Login: 8 consecutive days (enough for Active User badge - 7+ requirement)

-- Expected badges he should earn:
-- ✅ loyalty_active (Active User) - 7+ logins ✓
-- ✅ loyalty_milestone (Bricks Collector) - 100+ Bricks ✓  
-- ✅ loyalty_streak (Streak Master) - 7+ consecutive days ✓
-- ❌ loyalty_engagement (Platform Enthusiast) - needs 20+ activities (currently 7)