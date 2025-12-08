const { User, EmailVerification, PhoneVerification } = require('../models');
const generateToken = require('../utils/generateToken');
const { generateRandomToken, generateRandomCode, getExpirationTime } = require('../utils/helpers');
const { sendVerificationEmail } = require('../services/emailService'); // Use Resend instead of SMTP
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

    // Check for admin/test emails that should auto-verify
    const autoVerifyEmails = ['admin@kostku.com', 'admin@test.com', 'owner@kostku.com'];
    const shouldAutoVerify = autoVerifyEmails.includes(email) || role === 'admin';

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'pencari',
      email_verified: shouldAutoVerify
    });

    // Auto-verify for admin accounts
    if (shouldAutoVerify) {
      console.log('✅ Admin/Test account registered and auto-verified:', email);
      
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
      return;
    }

    // For regular users: Create verification code and send email
    const verificationCode = generateRandomCode(6);
    
    await EmailVerification.create({
      user_id: user.id,
      code: verificationCode,
      expires_at: getExpirationTime(1) // 1 hour
    });

    console.log('📧 Sending verification email to:', email);
    console.log('🔢 Verification code:', verificationCode);

    // Try to send verification email
    let emailSent = false;
    try {
      await sendVerificationEmail(email, name, verificationCode);
      emailSent = true;
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError.message);
      // Continue registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Registration successful! Please check your email for verification code.'
        : 'Registration successful! Email service temporarily unavailable. Use code below.',
      data: {
        user: { ...user.toJSON(), password: undefined },
        email: email,
        needsVerification: true,
        emailSent: emailSent,
        // Show code only if email failed to send
        ...(!emailSent && { verificationCode: verificationCode })
      }
    });

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

    // Check if email is verified (skip for admin emails only)
    const autoVerifyEmails = ['admin@kostku.com', 'admin@test.com', 'owner@kostku.com'];
    const isAdminEmail = autoVerifyEmails.includes(user.email) || user.role === 'admin';
    
    if (!user.email_verified && !isAdminEmail) {
      console.log('⚠️ Login blocked - Email not verified');
      console.log('📧 Email:', user.email);
      
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email
      });
    }

    console.log('✅ Login successful for:', user.email, '(role:', user.role, ', verified:', user.email_verified, ')');

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

    console.log('📤 Attempting to resend verification email to:', email);
    console.log('🔢 New verification code:', verificationCode);

    // Try to send verification email
    let emailSent = false;
    try {
      await sendVerificationEmail(email, user.name, verificationCode);
      emailSent = true;
      console.log('✅ Verification email resent successfully');
    } catch (emailError) {
      console.error('❌ Failed to resend email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: emailSent
        ? 'Verification code resent! Please check your email.'
        : 'New verification code generated! Email service unavailable, use code below.',
      data: {
        email: email,
        emailSent: emailSent,
        expiresIn: '1 hour',
        // Show code only if email failed to send
        ...(!emailSent && { verificationCode: verificationCode })
      }
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

// @desc    Google OAuth Login
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify Google token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ 
      where: { 
        email 
      } 
    });

    if (user) {
      // Update existing user with Google info if not already set
      if (!user.google_id) {
        await user.update({
          google_id,
          provider: 'google',
          avatar: picture,
          email_verified: true // Google emails are pre-verified
        });
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        google_id,
        provider: 'google',
        avatar: picture,
        email_verified: true, // Google emails are pre-verified
        role: 'pencari'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
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
  verifyPhone,
  googleAuth
};