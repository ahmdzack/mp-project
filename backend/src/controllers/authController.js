const { User, EmailVerification, PhoneVerification } = require('../models');
const generateToken = require('../utils/generateToken');
const { generateRandomToken, generateRandomCode, getExpirationTime } = require('../utils/helpers');
const { sendVerificationEmail } = require('../services/emailService');
const { sendVerificationSMS } = require('../services/smsService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'pencari',
      email_verified: true // TEMPORARY: Auto-verify all users for testing
    });

    // TEMPORARY: Skip email verification for all users during development
    console.log('✅ User registered and auto-verified (DEV MODE):', email);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful! You can login now.',
      data: {
        user: user,
        email: email,
        needsVerification: false,
        autoVerified: true
      }
    });

    /* ORIGINAL CODE - Uncomment when email service is working
    const verificationCode = generateRandomCode(6);
    
    await EmailVerification.create({
      user_id: user.id,
      code: verificationCode,
      expires_at: getExpirationTime(1)
    });

    try {
      await sendVerificationEmail(email, name, verificationCode);
      console.log('✅ Verification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for verification code.',
      data: {
        user: user,
        email: email,
        needsVerification: true,
        ...(process.env.NODE_ENV === 'development' && { verificationCode })
      }
    });
    */

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email belum terdaftar. Silakan daftar terlebih dahulu.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified (skip for superadmin and specific admin emails)
    if (!user.email_verified && user.role !== 'superadmin' && user.email !== 'admin@kostku.com' && user.email !== 'admin@test.com') {
      console.log('⚠️ Login blocked - Email not verified');
      console.log('📧 Email:', user.email);
      console.log('💡 User needs to check email for verification code');
      
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification code.',
        needsVerification: true,
        email: user.email
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user,
        token: token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find verification record
    const verification = await EmailVerification.findOne({
      where: { 
        user_id: user.id,
        code: code
      }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if code expired
    if (new Date() > verification.expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Update user email_verified status
    await User.update(
      { email_verified: true },
      { where: { id: user.id } }
    );

    // Delete verification record
    await EmailVerification.destroy({ where: { id: verification.id } });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public (email in body)
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Delete old verification codes
    await EmailVerification.destroy({ where: { user_id: user.id } });

    // Generate new code
    const verificationCode = generateRandomCode(6);
    await EmailVerification.create({
      user_id: user.id,
      code: verificationCode,
      expires_at: getExpirationTime(1)
    });

    // Send email with detailed logging
    let emailSent = false;
    try {
      console.log('📤 RESENDING verification email to:', email);
      console.log('🔢 New verification code:', verificationCode);
      
      await sendVerificationEmail(email, user.name, verificationCode);
      
      emailSent = true;
      console.log('✅ ✅ ✅ VERIFICATION EMAIL RESENT SUCCESSFULLY! ✅ ✅ ✅');
      console.log('📧 To:', email);
      console.log('🔢 Code:', verificationCode);
      console.log('⏰ Expires in: 1 hour');
      console.log('='.repeat(60));
    } catch (emailError) {
      console.error('❌ Failed to resend email:', emailError.message);
      console.log('📧 Manual verification code:', verificationCode);
    }

    res.status(200).json({
      success: true,
      message: emailSent 
        ? 'Verification email resent successfully. Check your inbox!' 
        : 'Verification code generated, but email failed to send.',
      emailSent: emailSent,
      // Include code in development for debugging
      ...(process.env.NODE_ENV === 'development' && { verificationCode: verificationCode })
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send phone verification code
// @route   POST /api/auth/send-phone-verification
// @access  Private
const sendPhoneVerification = async (req, res) => {
  try {
    const user = req.user;

    // Check if phone exists
    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found. Please update your profile first.'
      });
    }

    // Check if already verified
    if (user.phone_verified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already verified'
      });
    }

    // Delete old verification codes
    await PhoneVerification.destroy({ where: { user_id: user.id } });

    // Generate 6-digit code
    const verificationCode = generateRandomCode();

    // Save to database
    await PhoneVerification.create({
      user_id: user.id,
      code: verificationCode,
      expires_at: getExpirationTime(0.167) // 10 minutes
    });

    // Send SMS (will log to console in development)
    const smsResult = await sendVerificationSMS(user.phone, verificationCode);

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        phone: user.phone,
        code: verificationCode,
        expires_in: '10 minutes',
        note: 'Check your server console/terminal for the verification code'
      }
    });

  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify phone number
// @route   POST /api/auth/verify-phone
// @access  Private
const verifyPhone = async (req, res) => {
  try {
    const user = req.user;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }

    // Find verification record
    const verification = await PhoneVerification.findOne({
      where: { 
        user_id: user.id,
        code: code
      }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if code expired
    if (new Date() > verification.expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Update user phone_verified status
    await User.update(
      { phone_verified: true },
      { where: { id: user.id } }
    );

    // Delete verification record
    await PhoneVerification.destroy({ where: { user_id: user.id } });

    // Get updated user
    const updatedUser = await User.findByPk(user.id);

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone verification'
    });
  }
};

// @desc    Check verification status for an email
// @route   POST /api/auth/check-verification
// @access  Public
const checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for pending verification
    const pendingVerification = await EmailVerification.findOne({
      where: { user_id: user.id }
    });

    const hasExpired = pendingVerification && new Date() > pendingVerification.expires_at;

    console.log('📊 Verification Status Check:');
    console.log('📧 Email:', email);
    console.log('✅ Verified:', user.email_verified);
    console.log('⏳ Pending verification:', !!pendingVerification);
    if (pendingVerification) {
      console.log('🔢 Code exists:', !!pendingVerification.code);
      console.log('⏰ Expired:', hasExpired);
      console.log('🔢 Code (dev only):', process.env.NODE_ENV === 'development' ? pendingVerification.code : '***');
    }

    res.status(200).json({
      success: true,
      data: {
        email: email,
        isVerified: user.email_verified,
        hasPendingVerification: !!pendingVerification,
        verificationExpired: hasExpired,
        // Include code in development for debugging
        ...(process.env.NODE_ENV === 'development' && pendingVerification && { 
          verificationCode: pendingVerification.code 
        })
      }
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export all functions
module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  checkVerificationStatus,
  getMe,
  sendPhoneVerification,
  verifyPhone
};