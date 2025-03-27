const mongoose = require('mongoose');
const TokenSupply = require('../models/TokenSupply');
const connectDB = require('./database');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB for initialization');

    // Check if TokenSupply collection exists and has data
    const tokenSupplyCount = await TokenSupply.countDocuments();
    
    if (tokenSupplyCount === 0) {
      console.log('Initializing TokenSupply collection...');
      
      // Create initial token supply
      const initialSupply = new TokenSupply({
        totalSupply: 1000000, // Set your desired total supply
        remainingSupply: 1000000, // Initially equal to total supply
        tokenPrice: 1500 // Set your token price
      });
      
      await initialSupply.save();
      console.log('TokenSupply initialized successfully');
    } else {
      console.log('TokenSupply collection already exists with data');
    }

    console.log('Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeDatabase();