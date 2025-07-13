// Setup module aliases for path resolution
require('module-alias/register');
require('./config/aliases');

const express = require('express');
const bodyParser = require('body-parser');
require('./config/dotenv');// Load environment variables
const connectDB = require('./config/database'); // MongoDB connection
const buyRoutes = require('./routes/buyRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const botIntegrationRoutes = require('./routes/botIntegrationRoutes');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json()); 

// Enhanced CORS configuration to allow both local development and production
const allowedOrigins = [
  'http://127.0.0.1:5500',      // VS Code Live Server
  'http://localhost:5500',      // Alternative local address
  'http://localhost:5173',      // Vite dev server (HTTP)
  'https://localhost:5173',     // Vite dev server (HTTPS)
  'http://localhost:8081',      // IleVault Vite dev server
  'https://localhost:8081',     // IleVault Vite dev server (HTTPS)
  'https://miniapp-m3yxspnui-aisolaes-projects-2f81d181.vercel.app', // Previous Vercel deployment
  'https://miniapp-kappa-bay.vercel.app', // New Vercel deployment
  process.env.FRONTEND_URL      // From environment variable
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, be more permissive with localhost
    if (process.env.NODE_ENV === 'development' && origin && origin.includes('localhost')) {
      console.log('CORS allowing localhost origin:', origin);
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
  credentials: true
}));

// Connect to database before setting up routes
connectDB()
  .then(() => {
    console.log('Database connected successfully, setting up routes');
    
    // Health check endpoint for monitoring
    app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok',
        service: 'Ilé-MVP Backend',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Routes
    app.use('/buy', buyRoutes);
    app.use('/', balanceRoutes);
    app.use('/webhook', webhookRoutes);
    app.use('/auth', authRoutes);
    app.use('/properties', propertyRoutes);
    app.use('/dashboard', dashboardRoutes);
    app.use('/rewards', rewardRoutes);
    app.use('/bot-integration', botIntegrationRoutes);
    
    // Root route for testing
    app.get('/', (req, res) => {
        res.json({
            message: 'Ile API is running',
            env: process.env.NODE_ENV,
            frontendUrl: process.env.FRONTEND_URL
        });
    });
    
    // Global error handler
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ 
            error: 'Something went wrong!',
            message: err.message 
        });
    });
    
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