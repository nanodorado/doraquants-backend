const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const binanceRoutes = require('./routes/binance');
const apiKeyMiddleware = require('./middleware/apiKey');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Get port from environment or default to 4000
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// CORS configuration for production
const corsOptions = {
  origin: [
    'https://app.doraquants.com',
    'https://doraquants-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// API Key authentication middleware (applied to all routes except /health)
app.use((req, res, next) => {
  // Skip authentication for health check
  if (req.path === '/health') {
    return next();
  }
  
  // Apply API key middleware to all other routes
  apiKeyMiddleware(req, res, next);
});

// Basic API route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Doraquants Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Binance API routes
app.use('/api/binance', binanceRoutes);

// Direct routes for main functionality
app.use('/', binanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] ${new Date().toISOString()}: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Doraquants Backend running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🔒 API Key protection: ${process.env.API_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
