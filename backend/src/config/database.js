const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support multiple connection methods
let sequelize;

// Priority 1: DATABASE_URL (full connection string)
// Priority 2: MYSQL_URL (Railway MySQL service URL)
// Priority 3: Individual environment variables (local dev)
const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionUrl) {
  console.log('🔗 Using connection string for database');
  sequelize = new Sequelize(connectionUrl, {
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    } : {}
  });
} else if (process.env.DATABASE_HOST || process.env.MYSQLHOST) {
  // Railway individual variables or local development
  console.log('🔗 Using individual env vars for database');
  sequelize = new Sequelize(
    process.env.DATABASE_NAME || process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
    process.env.DATABASE_USER || process.env.MYSQLUSER || process.env.DB_USER || 'root',
    process.env.DATABASE_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    {
      host: process.env.DATABASE_HOST || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
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
} else {
  console.error('❌ No database configuration found!');
  console.error('💡 Set either DATABASE_URL or individual env vars (DATABASE_HOST, DATABASE_USER, etc.)');
  process.exit(1);
}

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    console.log(`📊 Connection: ${connectionUrl ? 'Using connection string' : 'Using individual vars'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    console.error('💡 Connection details:');
    console.error(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
    console.error(`   - MYSQL_URL: ${process.env.MYSQL_URL ? 'SET' : 'NOT SET'}`);
    console.error(`   - DATABASE_HOST: ${process.env.DATABASE_HOST || process.env.MYSQLHOST || 'NOT SET'}`);
    console.error(`   - DATABASE_USER: ${process.env.DATABASE_USER || process.env.MYSQLUSER || 'NOT SET'}`);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };