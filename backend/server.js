const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./src/config/database');
const { errorHandler } = require('./src/middlewares/errorHandler');

// Load env vars
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
testConnection();

// Sync database - IMPORTANT: set to false in production!
sequelize.sync({ alter: false, force: false })  // ← Changed from alter: false
  .then(() => {
    console.log('✅ Database synced');
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

// Test Cloudinary connection
const { testCloudinaryConnection } = require('./src/config/cloudinary');
testCloudinaryConnection();

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Kost Reservation API is running',
    version: '1.0.0',
    week: '2'
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📚 Week 2: Kost Management Active`);
});