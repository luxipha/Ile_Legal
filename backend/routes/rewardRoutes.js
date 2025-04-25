const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @route   GET /rewards/referral
 * @desc    Get user's referral information
 * @access  Private
 */
router.get('/referral', async (req, res) => {
  try {
    const { telegramChatId } = req.query;
    
    if (!telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telegram ID is required' 
      });
    }
    
    const user = await User.findOne({ telegramChatId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Return referral information
    return res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        bricks: user.bricks.total,
        referrals: user.referrals || [],
        lastRedeemTime: user.bricks?.lastRedeemTime || null
      }
    });
  } catch (error) {
    console.error('Error getting referral info:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * @route   POST /rewards/apply-referral
 * @desc    Apply a referral code to a user
 * @access  Private
 */
router.post('/apply-referral', async (req, res) => {
  try {
    const { referralCode, telegramChatId } = req.body;
    
    if (!referralCode || !telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Referral code and Telegram ID are required' 
      });
    }
    
    // Find the user being referred
    const user = await User.findOne({ telegramChatId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if user already has a referrer
    if (user.referredBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already has a referrer' 
      });
    }
    
    // Find the referrer
    const referrer = await User.findOne({ referralCode });
    
    if (!referrer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid referral code' 
      });
    }
    
    // Check if user is trying to refer themselves
    if (referrer.telegramChatId === telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot refer yourself' 
      });
    }
    
    // Update user with referrer
    user.referredBy = referralCode;
    await user.save();
    
    // Add user to referrer's referrals list
    const existingReferral = referrer.referrals?.find(r => 
      r.userId?.toString() === user._id.toString() || r.email === user.email
    );
    
    if (!existingReferral) {
      // If referrals array doesn't exist, initialize it
      if (!referrer.referrals) {
        referrer.referrals = [];
      }
      
      // Add the referral
      referrer.referrals.push({
        userId: user._id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        status: 'joined',
        joinedAt: new Date(),
        bricksEarned: 50
      });
      
      // Award bricks to referrer
      if (!referrer.bricks) {
        referrer.bricks = { total: 0 };
      }
      referrer.bricks.total += 50;
      await referrer.save();
    }
    
    return res.json({
      success: true,
      message: 'Referral applied successfully'
    });
  } catch (error) {
    console.error('Error applying referral:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * @route   POST /rewards/redeem-bricks
 * @desc    Redeem daily bricks
 * @access  Private
 */
router.post('/redeem-bricks', async (req, res) => {
  try {
    const { telegramChatId } = req.body;
    
    if (!telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telegram ID is required' 
      });
    }
    
    const user = await User.findOne({ telegramChatId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Initialize bricks if not present
    if (!user.bricks) {
      user.bricks = { total: 0 };
    }
    
    // Check if user has accumulated enough points (0.1 per hour, needs 2.4 to redeem)
    const now = new Date();
    let bricksToAward = 20; // Base amount
    
    if (user.bricks.lastRedeemTime) {
      const lastRedeem = new Date(user.bricks.lastRedeemTime);
      const hoursSinceLastRedeem = (now.getTime() - lastRedeem.getTime()) / (1000 * 60 * 60);
      const pointsAccumulated = Math.min(2.4, Math.floor(hoursSinceLastRedeem * 10) / 10); // 0.1 per hour, max 2.4
      
      if (pointsAccumulated < 2.4) {
        const hoursRemaining = Math.ceil((2.4 - pointsAccumulated) * 10);
        return res.status(400).json({ 
          success: false, 
          message: `Need ${(2.4 - pointsAccumulated).toFixed(1)} more points (${hoursRemaining} hours)`,
          nextRedeemTime: new Date(lastRedeem.getTime() + 24 * 60 * 60 * 1000),
          pointsAccumulated: pointsAccumulated
        });
      }
    }
    
    // Update streak
    if (!user.loginStreak) {
      user.loginStreak = { current: 0, lastLoginDate: null };
    }
    
    const currentNow = new Date();
    
    // If this is their first login, set streak to 1
    if (!user.loginStreak.lastLoginDate) {
      user.loginStreak.current = 1;
    } else {
      const lastLogin = new Date(user.loginStreak.lastLoginDate);
      const hoursSinceLastLogin = (currentNow.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
      
      console.log(`Hours since last login for ${user.email}: ${hoursSinceLastLogin.toFixed(1)}`);
      
      if (hoursSinceLastLogin >= 48) {
        // Reset streak if 48 hours or more since last login
        console.log(`Resetting streak for ${user.email} (${hoursSinceLastLogin.toFixed(1)} hours since last login)`);
        user.loginStreak.current = 1; // Force reset to 1
      } else if (hoursSinceLastLogin > 20) {
        // Increment streak if between 20-48 hours (next day)
        user.loginStreak.current += 1;
        console.log(`Incrementing streak for ${user.email} to ${user.loginStreak.current}`);
      } else {
        // Within same day, don't change streak
        console.log(`Maintaining streak for ${user.email} at ${user.loginStreak.current}`);
      }
    }
    
    // Add streak bonus
    if (user.loginStreak.current >= 7) {
      // Bonus for 7+ day streak
      const streakBonus = 200;
      bricksToAward += streakBonus;
      console.log(`Adding streak bonus of ${streakBonus} bricks for ${user.loginStreak.current} day streak`);
    }
    
    // Update user
    user.bricks.total += bricksToAward;
    user.bricks.lastRedeemTime = now;
    user.loginStreak.lastLoginDate = currentNow;
    
    await user.save();
    
    return res.json({
      success: true,
      data: {
        bricksAwarded: bricksToAward,
        totalBricks: user.bricks.total,
        currentStreak: user.loginStreak.current,
        message: `You earned ${bricksToAward} bricks!`
      }
    });
  } catch (error) {
    console.error('Error redeeming bricks:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * @route   POST /rewards/remind-referral
 * @desc    Send a reminder to a pending referral
 * @access  Private
 */
router.post('/remind-referral', async (req, res) => {
  try {
    const { telegramChatId, referralEmail } = req.body;
    
    if (!telegramChatId || !referralEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telegram ID and referral email are required' 
      });
    }
    
    const user = await User.findOne({ telegramChatId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Find the referral
    const referralIndex = user.referrals?.findIndex(r => r.email === referralEmail);
    
    if (referralIndex === -1 || !user.referrals) {
      return res.status(404).json({ 
        success: false, 
        message: 'Referral not found' 
      });
    }
    
    const referral = user.referrals[referralIndex];
    
    if (referral.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only remind pending referrals' 
      });
    }
    
    // In a real implementation, this would send a notification to the referred user
    // For now, we'll just update the status to show the reminder was sent
    
    // TODO: Implement actual notification logic via Telegram bot
    
    return res.json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
