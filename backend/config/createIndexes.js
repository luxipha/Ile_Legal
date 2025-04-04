const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('./database');

const createIndexes = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB for creating indexes');

    // Create indexes for User model
    console.log('Creating indexes for User collection...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ 'purchaseHistory.paymentReference': 1 });

    console.log('Indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create indexes:', error);
    process.exit(1);
  }
};

createIndexes();