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

// Sync database (create tables if not exists)
sequelize.sync({ alter: false }) // set to true untuk auto-update schema
  .then(() => console.log('✅ Database synced'))
  .catch(err => console.error('❌ Database sync error:', err));

// Routes
app.use('/api/auth', require('./src/routes/auth'));

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});