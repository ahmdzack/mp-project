const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
require('dotenv').config();

// Initialize MailerSend with API token
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_TOKEN || ''
});

// Send email verification using MailerSend
const sendVerificationEmail = async (email, name, code) => {
  const verificationPageUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email`;
  
  // Fallback: Log to console if MailerSend not configured
  if (!process.env.MAILERSEND_API_TOKEN) {
    console.log('⚠️  MAILERSEND_API_TOKEN not set - logging verification code instead:');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔢 Verification Code:', code);
    console.log('💡 Set MAILERSEND_API_TOKEN environment variable to send real emails');
    return { messageId: 'console-log', code }; // Return code for development
  }
  
  try {
    const sentFrom = new Sender(
      process.env.MAILERSEND_FROM_EMAIL || 'ahmadzacky723@gmail.com',
      'KostKu'
    );
    
    const recipients = [new Recipient(email, name)];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Kode Verifikasi Email - KostKu')
      .setHtml(`
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
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log('✅ Verification email sent via MailerSend:', response.statusCode);
    return { messageId: response.headers?.['x-message-id'] || 'sent' };
  } catch (error) {
    console.error('❌ Error sending verification email:', error.body || error.message || error);
    throw new Error('Gagal mengirim email verifikasi');
  }
};

// Send kost approval email
const sendKostApprovalEmail = async (ownerEmail, ownerName, kostName) => {
  // Fallback: Log to console if MailerSend not configured
  if (!process.env.MAILERSEND_API_TOKEN) {
    console.log('⚠️  MAILERSEND_API_TOKEN not set - logging approval email instead:');
    console.log('📧 Email:', ownerEmail);
    console.log('👤 Owner:', ownerName);
    console.log('🏠 Kost:', kostName);
    console.log('💡 Set MAILERSEND_API_TOKEN environment variable to send real emails');
    return { messageId: 'console-log' };
  }
  
  try {
    const sentFrom = new Sender(
      process.env.MAILERSEND_FROM_EMAIL || 'ahmadzacky723@gmail.com',
      'KostKu'
    );
    
    const recipients = [new Recipient(ownerEmail, ownerName)];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Kost Anda Telah Disetujui - KostKu')
      .setHtml(`
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
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log('✅ Approval email sent via MailerSend:', response.statusCode);
    return { messageId: response.headers?.['x-message-id'] || 'sent' };
  } catch (error) {
    console.error('❌ Error sending approval email:', error.body || error.message || error);
    throw new Error('Gagal mengirim email persetujuan');
  }
};

module.exports = {
  sendVerificationEmail,
  sendKostApprovalEmail
};
