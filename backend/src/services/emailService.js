const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email verification
const sendVerificationEmail = async (email, name, code) => {
  const verificationPageUrl = `${process.env.FRONTEND_URL}/verify-email`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Kode Verifikasi Email - Kost Reservation',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Halo ${name}!</h2>
        <p style="font-size: 16px; color: #666;">Terima kasih telah mendaftar di Kost Reservation.</p>
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email verification sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

// Send kost approval email
const sendKostApprovalEmail = async (email, ownerName, kostName, kostId) => {
  const kostDetailUrl = `${process.env.FRONTEND_URL}/kost/${kostId}`;
  const dashboardUrl = `${process.env.FRONTEND_URL}/owner/dashboard`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✅ Kost Anda Telah Disetujui - Kost Reservation',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Kost Disetujui!</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Halo ${ownerName}!</h2>
          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            Kabar baik! Kost Anda telah disetujui oleh admin dan sekarang sudah <strong>live</strong> di platform kami.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #4CAF50; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">📍 ${kostName}</h3>
            <p style="color: #666; margin: 0; font-size: 14px;">ID Kost: #${kostId}</p>
          </div>
          
          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            Kost Anda kini dapat dilihat dan dipesan oleh calon penyewa. Pastikan informasi kost selalu up-to-date untuk mendapatkan lebih banyak booking.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${kostDetailUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
              Lihat Detail Kost
            </a>
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
              Buka Dashboard
            </a>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 25px;">
            <p style="color: #2e7d32; margin: 0; font-size: 14px; font-weight: 500;">
              💡 <strong>Tips:</strong> Lengkapi foto-foto berkualitas dan deskripsi detail untuk menarik lebih banyak penyewa!
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Jika Anda memiliki pertanyaan, hubungi kami melalui email atau dashboard Anda.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Kost approval email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending kost approval email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendKostApprovalEmail
};