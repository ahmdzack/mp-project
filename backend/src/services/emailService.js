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
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.API_URL}/api/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verifikasi Email Anda - Kost Reservation',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Halo ${name}!</h2>
        <p>Terima kasih telah mendaftar di Kost Reservation.</p>
        <p>Silakan klik tombol di bawah untuk verifikasi email Anda:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verifikasi Email
        </a>
        <p>Atau copy link berikut ke browser Anda:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>Link ini akan expired dalam 1 jam.</p>
        <hr style="margin: 20px 0;">
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

module.exports = {
  sendVerificationEmail
};