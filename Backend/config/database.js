const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is loaded

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB:', process.env.MONGODB_URI); // Debugging output
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Call the function
connectDB();

module.exports = mongoose;
