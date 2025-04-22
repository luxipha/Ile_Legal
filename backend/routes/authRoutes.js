const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @route POST /auth/telegram-auth
 * @desc Authenticate and link a Telegram ID with an existing user account
 * @access Public
 */
router.post('/telegram-auth', async (req, res) => {
  try {
    const { email, telegramChatId } = req.body;

    // Validate request body
    if (!email || !telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and telegramChatId are required' 
      });
    }

    // Check if user exists with the provided email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create a new user if one doesn't exist
      user = new User({
        email: email.toLowerCase(),
        name: email.split('@')[0], // Use part of email as name
        telegramChatId,
        balance: 0,
        isAdmin: false,
        isBanned: false
      });
      
      await user.save();
      console.log(`New user created and linked with Telegram ID: ${telegramChatId}`);
    } else {
      // Update existing user with Telegram ID
      user.telegramChatId = telegramChatId;
      await user.save();
      console.log(`Existing user linked with Telegram ID: ${telegramChatId}`);
    }

    // Get user's properties if they have any
    const Property = require('../models/Property');
    const properties = await Property.find({ developer_id: telegramChatId.toString() });

    // Return user data including token balance
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        isAdmin: user.isAdmin,
        telegramChatId: user.telegramChatId,
        propertiesCount: properties.length
      }
    });
  } catch (error) {
    console.error('Error in telegram authentication:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication',
      error: error.message 
    });
  }
});

module.exports = router;
