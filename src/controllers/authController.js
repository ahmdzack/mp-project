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
      role: role || 'pencari'
    });

    // Generate email verification token
    const verificationToken = generateRandomToken();
    await EmailVerification.create({
      user_id: user.id,
      token: verificationToken,
      expires_at: getExpirationTime(1) // 1 hour
    });

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      data: {
        user: user,
        token: token
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
        message: 'Invalid credentials'
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

// @desc    Verify email
// @route   GET /api/auth/verify-email?token=xxx
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find verification record
    const verification = await EmailVerification.findOne({
      where: { token },
      include: [{ model: User }]
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if token expired
    if (new Date() > verification.expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }

    // Update user email_verified status
    await User.update(
      { email_verified: true },
      { where: { id: verification.user_id } }
    );

    // Delete verification record
    await EmailVerification.destroy({ where: { token } });

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
// @access  Private
const resendVerification = async (req, res) => {
  try {
    const user = req.user;

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Delete old verification tokens
    await EmailVerification.destroy({ where: { user_id: user.id } });

    // Generate new token
    const verificationToken = generateRandomToken();
    await EmailVerification.create({
      user_id: user.id,
      token: verificationToken,
      expires_at: getExpirationTime(1)
    });

    // Send email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
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

// Export all functions
module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  getMe,
  sendPhoneVerification,
  verifyPhone
};