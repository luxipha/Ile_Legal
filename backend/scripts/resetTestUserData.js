/**
 * Script to reset test user data and set up the new point accumulation system
 */
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Ile-admin:EQ3fMy8uu@clusterile.aqtxsry.mongodb.net/ileDB?retryWrites=true&w=majority';
const TEST_EMAIL = 'test@example.com';

async function resetTestUserData() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected...');

    // Find the test user
    const testUser = await User.findOne({ email: TEST_EMAIL });
    
    if (!testUser) {
      console.error('❌ Test user not found');
      return;
    }

    console.log('✅ Found test user:', testUser.email);
    console.log('Current data:', {
      bricks: testUser.bricks,
      referrals: testUser.referrals?.length || 0,
      streak: testUser.loginStreak
    });
    
    // Reset bricks and set lastRedeemTime to simulate point accumulation
    // Setting lastRedeemTime to 6 hours ago to show 0.6 accumulated points
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    testUser.bricks = {
      total: 100, // Total bricks in the menu bar
      lastRedeemTime: sixHoursAgo // This will show 0.6 accumulated points
    };
    
    // Reset login streak
    testUser.loginStreak = {
      current: 3,
      lastLoginDate: new Date()
    };
    
    // Keep referral code but reset referrals
    if (!testUser.referralCode) {
      testUser.referralCode = 'TESTCODE123';
    }
    
    // Create test referrals
    testUser.referrals = [
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        status: 'joined',
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        bricksEarned: 5
      },
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        status: 'pending',
        joinedAt: null,
        bricksEarned: 0
      }
    ];
    
    // Save the updated user
    await testUser.save();
    
    console.log('✅ Successfully reset test user data');
    console.log('📊 New data:', {
      bricks: testUser.bricks,
      lastRedeemTime: testUser.bricks.lastRedeemTime,
      accumulatedPoints: '0.6 (6 hours since last redeem)',
      referrals: testUser.referrals.length,
      streak: testUser.loginStreak.current
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('📝 MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the function
resetTestUserData();
