const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../config/database');

const createOwner = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if owner already exists
    const existingOwner = await User.findOne({ 
      where: { email: 'owner@kostku.com' } 
    });

    if (existingOwner) {
      console.log('⚠️  Owner already exists with email: owner@kostku.com');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('owner123', 10);

    // Create owner user
    const owner = await User.create({
      name: 'Pemilik Kost',
      email: 'owner@kostku.com',
      password: hashedPassword,
      phone: '081234567891',
      role: 'pemilik',
      email_verified: true,
      phone_verified: true
    });

    console.log('✅ Owner user created successfully!');
    console.log('📧 Email: owner@kostku.com');
    console.log('🔑 Password: owner123');
    console.log('👤 Role: pemilik');
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating owner:', error);
    process.exit(1);
  }
};

createOwner();
