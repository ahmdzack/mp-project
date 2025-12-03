const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  getOwnerBookings,
  confirmBooking,
  rejectBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');

// Public routes (none - all booking routes require authentication)

// Protected routes
router.use(protect); // Semua route dibawah ini memerlukan authentication

// Create booking - Pencari only
router.post('/', authorize('pencari'), createBooking);

// Get all bookings - All authenticated users (filtered by role in controller)
router.get('/', getAllBookings);

// Get owner bookings - Pemilik only
router.get('/owner/my-bookings', authorize('pemilik'), getOwnerBookings);

// Get single booking - All authenticated users (authorization in controller)
router.get('/:id', getBookingById);

// Confirm booking - Pemilik only
router.patch('/:id/confirm', authorize('pemilik'), confirmBooking);

// Reject booking - Pemilik only
router.patch('/:id/reject', authorize('pemilik'), rejectBooking);

// Update booking status - Pemilik & Admin only
router.patch('/:id/status', authorize('pemilik', 'admin'), updateBookingStatus);

// Cancel booking - All authenticated users (authorization in controller)
router.patch('/:id/cancel', cancelBooking);

// Delete booking - Admin only
router.delete('/:id', authorize('admin'), deleteBooking);

module.exports = router;
