const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../config/database');

const createAdmin = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@kostku.com' } 
    });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email: admin@kostku.com');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@kostku.com',
      password: hashedPassword,
      phone: '081234567890',
      role: 'admin',
      email_verified: true,
      phone_verified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@kostku.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
