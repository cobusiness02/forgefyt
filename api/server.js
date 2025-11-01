const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { router: authRoutes } = require('./routes/auth');
const coachRoutes = require('./routes/coaches');
const clientRoutes = require('./routes/clients');
const workoutRoutes = require('./routes/workouts');
const iosRoutes = require('./routes/ios');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for iOS app
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'http://localhost:8100',
    'https://localhost:8100'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

app.use('/api/', limiter);

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/ios', iosRoutes);

// Welcome endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to FitCoach Pro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      coaches: '/api/coaches',
      clients: '/api/clients',
      workouts: '/api/workouts',
      ios: '/api/ios',
      health: '/health'
    },
    documentation: '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/api', '/api/auth', '/api/coaches', '/api/clients', '/api/workouts', '/health']
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 FitCoach Pro API server running on port ${PORT}`);
  console.log(`📱 iOS app can connect to: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API documentation: http://localhost:${PORT}/api`);
});

module.exports = app;