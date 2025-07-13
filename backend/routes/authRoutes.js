const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
    const Property = require('../models/property');
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

/**
 * @route POST /auth/register
 * @desc Register a new user with email and password
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate request body
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      balance: 0,
      isAdmin: false,
      isBanned: false
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

/**
 * @route POST /auth/login
 * @desc Login user with email and password
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if user has a password (might be Telegram-only user)
    if (!user.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please use Telegram login for this account' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account has been suspended' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        balance: user.balance,
        telegramChatId: user.telegramChatId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

module.exports = router;