const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Send email verification using Resend
const sendVerificationEmail = async (email, name, code) => {
  const verificationPageUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email`;
  
  // Fallback: Log to console if Resend not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not set - logging verification code instead:');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔢 Verification Code:', code);
    console.log('💡 Set RESEND_API_KEY environment variable to send real emails');
    return { id: 'console-log', code }; // Return code for development
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'KostKu <onboarding@resend.dev>',
      to: email,
      subject: 'Kode Verifikasi Email - KostKu',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Halo ${name}!</h2>
          <p style="font-size: 16px; color: #666;">Terima kasih telah mendaftar di KostKu.</p>
          <p style="font-size: 16px; color: #666;">Gunakan kode verifikasi berikut untuk mengaktifkan akun Anda:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <div style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Buka halaman verifikasi di: 
            <a href="${verificationPageUrl}" style="color: #4CAF50;">${verificationPageUrl}</a>
          </p>
          <p style="font-size: 14px; color: #666;">Masukkan kode di atas untuk verifikasi email Anda.</p>
          <p style="font-size: 14px; color: #999;">Kode ini akan expired dalam 1 jam.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            Jika Anda tidak melakukan pendaftaran, abaikan email ini.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error sending verification email:', error);
      throw new Error('Gagal mengirim email verifikasi');
    }

    console.log('✅ Verification email sent via Resend:', data?.id);
    return { id: data?.id };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Gagal mengirim email verifikasi');
  }
};

// Send kost approval email
const sendKostApprovalEmail = async (ownerEmail, ownerName, kostName) => {
  // Fallback: Log to console if Resend not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not set - logging approval email instead:');
    console.log('📧 Email:', ownerEmail);
    console.log('👤 Owner:', ownerName);
    console.log('🏠 Kost:', kostName);
    console.log('💡 Set RESEND_API_KEY environment variable to send real emails');
    return { id: 'console-log' };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'KostKu <onboarding@resend.dev>',
      to: ownerEmail,
      subject: 'Kost Anda Telah Disetujui - KostKu',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Selamat, ${ownerName}!</h2>
          <p style="font-size: 16px; color: #666;">
            Kost "<strong>${kostName}</strong>" Anda telah disetujui oleh admin dan sekarang dapat dilihat oleh calon penyewa.
          </p>
          <p style="font-size: 14px; color: #666;">
            Kost Anda kini aktif dan dapat menerima reservasi dari pengguna.
          </p>
          <p style="font-size: 14px; color: #999;">
            Terima kasih telah bergabung dengan KostKu!
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error sending approval email:', error);
      throw new Error('Gagal mengirim email persetujuan');
    }

    console.log('✅ Approval email sent via Resend:', data?.id);
    return { id: data?.id };
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    throw new Error('Gagal mengirim email persetujuan');
  }
};

module.exports = {
  sendVerificationEmail,
  sendKostApprovalEmail
};
