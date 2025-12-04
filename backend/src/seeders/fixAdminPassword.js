require('dotenv').config();
const mysql = require('mysql2/promise');

const fixAdminPassword = async () => {
  let connection;
  
  try {
    // Gunakan DATABASE_URL dari Railway
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not found!');
      console.log('💡 Set DATABASE_URL in Railway environment variables');
      process.exit(1);
    }

    console.log('🔗 Connecting to database...');
    
    // Parse DATABASE_URL (format: mysql://user:password@host:port/database)
    const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!urlMatch) {
      console.error('❌ Invalid DATABASE_URL format');
      process.exit(1);
    }

    const [, user, password, host, port, database] = urlMatch;

    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database
    });

    console.log('✅ Connected to database');

    // Hash password yang benar untuk admin123
    const correctHash = '$2b$10$L3onVmd9qDVRe3vQMYzZIe82aKxER8Prhbd9ASU9cKI14XQQO5Si.';

    // Check if admin exists
    const [rows] = await connection.execute(
      'SELECT id, email, role, email_verified FROM users WHERE email = ?',
      ['admin@kostku.com']
    );

    if (rows.length === 0) {
      console.log('⚠️  Admin not found, creating new admin...');
      
      // Create admin
      await connection.execute(
        `INSERT INTO users 
        (name, email, password, phone, role, email_verified, phone_verified, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        ['Super Admin', 'admin@kostku.com', correctHash, '081242834913', 'admin', 1, 1]
      );
      
      console.log('✅ Admin created successfully!');
    } else {
      console.log('📝 Admin found, updating password...');
      
      // Update password and verification status
      await connection.execute(
        'UPDATE users SET password = ?, email_verified = 1, phone_verified = 1 WHERE email = ?',
        [correctHash, 'admin@kostku.com']
      );
      
      console.log('✅ Password updated successfully!');
    }

    // Verify
    const [verifyRows] = await connection.execute(
      'SELECT id, name, email, role, email_verified, phone_verified, LEFT(password, 20) as password_preview FROM users WHERE email = ?',
      ['admin@kostku.com']
    );

    console.log('\n✅ Admin Account Details:');
    console.log(verifyRows[0]);
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@kostku.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    
    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

fixAdminPassword();
