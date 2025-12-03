const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support both DATABASE_URL (Railway) and individual env vars (local)
let sequelize;

if (process.env.DATABASE_URL) {
  // Railway production - uses DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Local development - uses individual env vars
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      timezone: '+08:00'
    }
  );
}

// Test connection
const testConnection = async () => {
  try {
    // Check if DATABASE_URL is set in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Please add MySQL service and set DATABASE_URL variable in Railway.');
    }
    
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    console.log(`📊 Connection: ${process.env.DATABASE_URL ? 'Railway MySQL' : 'Local MySQL'}`);
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    console.error('💡 Hint: Make sure DATABASE_URL is set to ${{MySQL.DATABASE_URL}} in Railway variables');
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };