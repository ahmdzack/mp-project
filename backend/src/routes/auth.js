const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  checkVerificationStatus,
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
router.post('/verify-email', verifyEmail); // Changed from GET to POST
router.post('/resend-verification', resendVerification); // Now public, accepts email in body
router.post('/check-verification', checkVerificationStatus); // New endpoint

// Protected routes
router.get('/me', protect, getMe);

// Phone verification routes
router.post('/send-phone-verification', protect, sendPhoneVerification);
router.post('/verify-phone', protect, verifyPhone);

module.exports = router;