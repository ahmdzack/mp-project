const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  getMe,
  sendPhoneVerification,
  verifyPhone
} = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', registerValidator, handleValidationErrors, register);
router.post('/login', loginValidator, handleValidationErrors, login);
router.get('/verify-email', verifyEmail);

// Protected routes
router.post('/resend-verification', protect, resendVerification);
router.get('/me', protect, getMe);

// Phone verification routes
router.post('/send-phone-verification', protect, sendPhoneVerification);
router.post('/verify-phone', protect, verifyPhone);

module.exports = router;