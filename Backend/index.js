const express = require('express');
const bodyParser = require('body-parser');
require('./config/dotenv');// Load environment variables
const connectDB = require('./config/database'); // MongoDB connection
const buyRoutes = require('./routes/buyRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json()); 

// Enhanced CORS configuration to allow both local development and production
const allowedOrigins = [
  'http://127.0.0.1:5500',      // VS Code Live Server
  'http://localhost:5500',      // Alternative local address
  process.env.FRONTEND_URL      // From environment variable
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature']
}));

// Connect to database before setting up routes
connectDB()
  .then(() => {
    console.log('Database connected successfully, setting up routes');
    
    // Routes
    app.use('/buy', buyRoutes);
    app.use('/', balanceRoutes);
    app.use('/webhook', webhookRoutes);
    
    // Global error handler
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ 
            error: 'Something went wrong!',
            message: err.message 
        });
    });
    
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });

module.exports = app;