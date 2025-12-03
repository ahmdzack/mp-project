const express = require('express');
const router = express.Router();
const {
  createPayment,
  handleNotification,
  getPaymentByBookingId,
  checkPaymentStatus,
  getAllPayments
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');

// Public routes
// Midtrans notification webhook (tidak perlu auth karena dari Midtrans server)
router.post('/notification', handleNotification);

// Protected routes
router.use(protect);

// Create payment - Pencari only
router.post('/', authorize('pencari'), createPayment);

// Get all payments - Admin & Pemilik only
router.get('/', authorize('admin', 'pemilik'), getAllPayments);

// Get payment by booking_id
router.get('/booking/:booking_id', getPaymentByBookingId);

// Check payment status from Midtrans
router.get('/:order_id/status', checkPaymentStatus);

module.exports = router;
