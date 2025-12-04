const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./src/config/database');
const { errorHandler } = require('./src/middlewares/errorHandler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://mp-project-production-7956d-losiju-vercel.app',
      /\.vercel\.app$/, // Allow all Vercel preview deployments
    ];
    
    // Check if origin is in allowed list or matches regex
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
testConnection();

// Sync database - auto-create tables in production with alter
const syncOptions = {
  alter: process.env.NODE_ENV === 'production' ? true : false,
  force: false
};

sequelize.sync(syncOptions)
  .then(() => {
    console.log('✅ Database synced successfully');
    console.log(`📊 Sync mode: ${process.env.NODE_ENV === 'production' ? 'ALTER (production)' : 'NORMAL (development)'}`);
  })
  .catch(err => {
    console.error('❌ Database sync error:', err);
  });

// Routes - Week 1
app.use('/api/auth', require('./src/routes/auth'));

// Routes - Week 2
app.use('/api/categories', require('./src/routes/category'));
app.use('/api/kost-types', require('./src/routes/kostType'));
app.use('/api/facilities', require('./src/routes/facility'));
app.use('/api/kost', require('./src/routes/kost'));

// Routes - Week 3 (NEW)
app.use('/api/kost', require('./src/routes/kostImage'));

// TEMPORARY: Seeder endpoint - REMOVE AFTER SEEDING
if (process.env.NODE_ENV === 'production') {
  app.use('/api/admin', require('./src/routes/seed'));
}

// Test Cloudinary connection
const { testCloudinaryConnection } = require('./src/config/cloudinary');
testCloudinaryConnection();

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Kost Reservation API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Validate PORT
if (isNaN(PORT) || PORT < 0 || PORT > 65535) {
  console.error('❌ Invalid PORT value:', process.env.PORT);
  console.error('💡 PORT must be a number between 0 and 65535');
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});