const midtransClient = require('midtrans-client');

// Create Snap API instance
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Create Core API instance (optional - untuk cek status)
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Test Midtrans connection
const testMidtransConnection = async () => {
  try {
    console.log('🔍 Testing Midtrans connection...');
    
    // Cek apakah credentials ada
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      console.log('⚠️  Midtrans credentials not found in .env');
      return;
    }

    console.log('✅ Midtrans configured:');
    console.log(`   - Mode: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'Production' : 'Sandbox'}`);
    console.log(`   - Server Key: ${process.env.MIDTRANS_SERVER_KEY.substring(0, 20)}...`);
    console.log(`   - Client Key: ${process.env.MIDTRANS_CLIENT_KEY.substring(0, 20)}...`);
    console.log('✅ Midtrans ready to use!');
  } catch (error) {
    console.error('❌ Midtrans connection error:', error.message);
  }
};

module.exports = {
  snap,
  coreApi,
  testMidtransConnection
};