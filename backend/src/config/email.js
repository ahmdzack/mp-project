const nodemailer = require('nodemailer');

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

// Test email connection
const testEmailConnection = async () => {
  try {
    console.log('🔍 Testing email connection...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Email credentials not found in .env');
      return;
    }

    await transporter.verify();
    console.log('✅ Email service configured:');
    console.log(`   - Host: ${process.env.EMAIL_HOST}`);
    console.log(`   - User: ${process.env.EMAIL_USER}`);
    console.log('✅ Email ready to send!');
  } catch (error) {
    console.error('❌ Email connection error:', error.message);
  }
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: html
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Send email error:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendEmail,
  testEmailConnection
};