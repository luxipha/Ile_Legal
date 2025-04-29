const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Secure API key for bot integration
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secure-api-key-here';

// Middleware to validate bot requests
const validateBotRequest = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== BOT_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

/**
 * Test endpoint for bot authentication
 * This endpoint allows the bot to test if its API key is valid
 */
router.get('/test-auth', validateBotRequest, (req, res) => {
  // Log the received API key (masked for security)
  const receivedKey = req.headers['x-api-key'];
  const maskedKey = receivedKey ? 
    `${receivedKey.substring(0, 4)}...${receivedKey.substring(receivedKey.length - 4)}` : 
    'none';
  
  console.log(`Bot auth test received. API key: ${maskedKey}`);
  console.log(`Expected API key: ${BOT_API_KEY.substring(0, 4)}...${BOT_API_KEY.substring(BOT_API_KEY.length - 4)}`);
  
  // Return success if we got here (middleware would have blocked unauthorized requests)
  return res.json({ 
    success: true, 
    message: 'Authentication successful',
    received: maskedKey,
    matches: receivedKey === BOT_API_KEY
  });
});

/**
 * Health check endpoint for bot integration
 * This endpoint doesn't require authentication
 */
router.get('/health', (req, res) => {
  return res.json({ 
    success: true, 
    message: 'Bot integration API is healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Sync referral data from the C# bot
 * This endpoint allows the C# bot to push referral data to our main system
 */
router.post('/sync-referrals', validateBotRequest, async (req, res) => {
  try {
    const { referrals } = req.body;
    
    if (!referrals || !Array.isArray(referrals)) {
      return res.status(400).json({ success: false, message: 'Invalid referral data' });
    }
    
    const results = [];
    
    for (const referral of referrals) {
      const { referrerId, referredId, points, timestamp, type } = referral;
      
      if (!referrerId || !referredId) {
        results.push({ success: false, referral, message: 'Missing required fields' });
        continue;
      }
      
      // Find users by Telegram IDs
      const referrer = await User.findOne({ telegramChatId: referrerId });
      const referred = await User.findOne({ telegramChatId: referredId });
      
      if (!referrer) {
        results.push({ success: false, referral, message: 'Referrer not found' });
        continue;
      }
      
      // Create referred user if they don't exist yet
      if (!referred) {
        const newUser = new User({
          telegramChatId: referredId,
          email: `telegram-${referredId}@placeholder.com`, // Placeholder until they register
          referredBy: referrer.referralCode,
          bricks: { total: 0 },
          isOnboarded: false
        });
        
        await newUser.save();
      }
      
      // Handle different types of brick awards based on the Journey Map
      let pointsToAward = points || 0;
      let awardReason = 'general';
      
      // Determine award type and amount based on the type field
      switch (type) {
        case 'join_group':
          pointsToAward = 30; // Stage 1: Join Telegram Group
          awardReason = 'join_group';
          break;
        case 'referral':
          pointsToAward = 150; // Stage 2: Referral reward
          awardReason = 'referral';
          break;
        case 'group_activity':
          pointsToAward = Math.min(points || 5, 20); // Stage 2: Daily Group Activity (cap: 20/day)
          awardReason = 'group_activity';
          break;
        case 'streak':
          pointsToAward = 300; // Stage 3: 7-Day Streak
          awardReason = 'streak';
          break;
        case 'leaderboard':
          pointsToAward = 200; // Stage 3: Win a Daily Leaderboard
          awardReason = 'leaderboard';
          break;
        default:
          pointsToAward = points || 0;
          awardReason = 'other';
      }
      
      // Add to referrer's referrals if not already there and it's a referral type
      if (type === 'referral') {
        const existingReferralIndex = referrer.referrals?.findIndex(
          r => r.telegramChatId === referredId
        );
        
        if (existingReferralIndex === -1 || existingReferralIndex === undefined) {
          // Initialize referrals array if it doesn't exist
          if (!referrer.referrals) {
            referrer.referrals = [];
          }
          
          // Add the new referral
          referrer.referrals.push({
            telegramChatId: referredId,
            name: referred?.name || `Telegram User ${referredId}`,
            status: 'joined',
            joinedAt: new Date(timestamp) || new Date(),
            bricksEarned: pointsToAward,
            source: 'telegram_group'
          });
          
          // Check for bonus if this is the 5th or more referral (Stage 3)
          if (referrer.referrals.length >= 5) {
            // Check if bonus was already awarded
            if (!referrer.bonuses || !referrer.bonuses.includes('five_referrals')) {
              // Add bonus
              if (!referrer.bonuses) referrer.bonuses = [];
              referrer.bonuses.push('five_referrals');
              
              // Award bonus bricks
              pointsToAward += 500; // Stage 3: 5+ Successful Referrals bonus
              
              // Log the bonus
              console.log(`Awarded 500 bonus bricks to ${referrer.telegramChatId} for 5+ referrals`);
            }
          }
        } else {
          // Update existing referral with additional points if needed
          const additionalPoints = pointsToAward;
          if (additionalPoints > 0) {
            referrer.referrals[existingReferralIndex].bricksEarned += additionalPoints;
          }
        }
      }
      
      // Award bricks to referrer
      if (!referrer.bricks) {
        referrer.bricks = { total: 0 };
      }
      
      if (pointsToAward > 0) {
        referrer.bricks.total += pointsToAward;
        
        // Track brick awards by type for analytics
        if (!referrer.brickAwards) {
          referrer.brickAwards = {};
        }
        
        if (!referrer.brickAwards[awardReason]) {
          referrer.brickAwards[awardReason] = 0;
        }
        
        referrer.brickAwards[awardReason] += pointsToAward;
        
        // Check for stage progression
        updateUserStage(referrer);
        
        await referrer.save();
        results.push({ 
          success: true, 
          referral, 
          pointsAwarded: pointsToAward,
          reason: awardReason,
          message: `Awarded ${pointsToAward} bricks for ${awardReason}` 
        });
      } else {
        results.push({ 
          success: true, 
          referral, 
          pointsAwarded: 0,
          message: 'No points awarded' 
        });
      }
    }
    
    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error syncing referrals:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * Helper function to update user stage based on brick count
 */
function updateUserStage(user) {
  if (!user.stage) {
    user.stage = 1; // Start at Stage 1
  }
  
  // Update stage based on brick count
  if (user.bricks.total >= 10000) {
    user.stage = 4; // Stage 4: Brick Millionaire
  } else if (user.bricks.total >= 5000) {
    user.stage = 3; // Stage 3: Community Builder
  } else if (user.bricks.total >= 500) {
    user.stage = 2; // Stage 2: Active Citizen
  }
  
  return user.stage;
}

/**
 * Get user data for the C# bot
 * This endpoint allows the C# bot to verify if users exist in our main system
 */
router.get('/users/:telegramId', validateBotRequest, async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Telegram ID is required' });
    }
    
    const user = await User.findOne({ telegramChatId: telegramId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return limited user data for privacy
    return res.status(200).json({
      success: true,
      user: {
        telegramId: user.telegramChatId,
        referralCode: user.referralCode,
        bricksTotal: user.bricks?.total || 0,
        isOnboarded: user.isOnboarded || false,
        referralsCount: user.referrals?.length || 0
      }
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * Get total points for a user (combining all sources)
 */
router.get('/points/:telegramId', validateBotRequest, async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Telegram ID is required' });
    }
    
    const user = await User.findOne({ telegramChatId: telegramId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      points: {
        total: user.bricks?.total || 0,
        referrals: user.referrals?.reduce((total, ref) => total + (ref.bricksEarned || 0), 0) || 0,
        accumulated: user.bricks?.accumulated || 0
      }
    });
  } catch (error) {
    console.error('Error getting points data:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
