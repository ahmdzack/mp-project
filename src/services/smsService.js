/**
 * SMS Service - Development Mode (No Twilio Required)
 * SMS akan di-log ke console untuk testing
 */

/**
 * Send SMS verification code
 * @param {string} phoneNumber - Phone number
 * @param {string} code - 6-digit verification code
 */
const sendVerificationSMS = async (phoneNumber, code) => {
  try {
    // Format phone number untuk Indonesia
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+62${phoneNumber.replace(/^0/, '')}`;

    const message = `Kode verifikasi Kost Reservation Anda: ${code}. Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.`;

    // Log ke console (Development Mode)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 SMS VERIFICATION CODE (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📞 Phone:', formattedPhone);
    console.log('🔑 Code:', code);
    console.log('💬 Message:', message);
    console.log('⏰ Expires: 10 minutes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { 
      success: true, 
      provider: 'console', 
      code: code 
    };

  } catch (error) {
    console.error('❌ Error in SMS service:', error.message);
    // Tetap return success untuk development
    console.log('📱 Verification Code (fallback):', code);
    return { 
      success: true, 
      provider: 'console', 
      code: code 
    };
  }
};

/**
 * Send general SMS notification
 * @param {string} phoneNumber - Phone number
 * @param {string} message - Message content
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+62${phoneNumber.replace(/^0/, '')}`;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 SMS NOTIFICATION (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📞 To:', formattedPhone);
    console.log('💬 Message:', message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: true, provider: 'console' };

  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    return { success: true, provider: 'console' };
  }
};

module.exports = {
  sendVerificationSMS,
  sendSMS
};