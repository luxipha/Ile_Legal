const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const UserProperty = require('../models/UserProperty');
const User = require('../models/User');

/**
 * @route GET /dashboard
 * @desc Get dashboard summary data for a user
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { telegramChatId } = req.query;
    
    if (!telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telegram Chat ID is required' 
      });
    }

    // Find the user
    const user = await User.findOne({ telegramChatId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find all user property relationships
    const userProperties = await UserProperty.find({ user_id: telegramChatId })
      .populate('property_id');
    
    // Calculate summary data
    let totalInvested = 0;
    let currentValue = 0;
    let totalTokensOwned = 0;
    
    userProperties.forEach(up => {
      const property = up.property_id;
      totalInvested += up.total_purchase_price;
      
      // Calculate current value based on current property price
      const currentValuePerToken = property.price / property.tokens;
      const propertyCurrentValue = currentValuePerToken * up.tokens_owned;
      currentValue += propertyCurrentValue;
      
      totalTokensOwned += up.tokens_owned;
    });
    
    // Calculate overall growth percentage
    const overallGrowth = totalInvested > 0 ? 
      ((currentValue - totalInvested) / totalInvested * 100).toFixed(2) : 0;
    
    // Get recent transactions (placeholder for now)
    const recentTransactions = [];
    
    res.json({
      success: true,
      dashboard: {
        totalInvested,
        currentValue,
        overallGrowth: parseFloat(overallGrowth),
        propertiesCount: userProperties.length,
        totalTokensOwned,
        balance: user.balance || 0,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

module.exports = router;
