const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is loaded

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB:', process.env.MONGODB_URI); // Debugging output
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10 
        });
        console.log('MongoDB connected successfully');
        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error; // Propagate error to caller
    }
};

// Don't call the function here, let index.js handle it
// connectDB();

module.exports = connectDB;