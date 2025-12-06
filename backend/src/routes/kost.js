const express = require('express');
const router = express.Router();
const {
  createKost,
  getAllKost,
  getKostById,
  updateKost,
  deleteKost,
  approveKost,
  updateAvailableRooms,
  getMyKosts
} = require('../controllers/kostController');
const { createKostValidator, updateKostValidator } = require('../validators/kostValidator');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const { protect, optionalAuth } = require('../middlewares/auth');
const { authorize } = require('../middlewares/validateRole');
const { checkEmailVerified } = require('../middlewares/checkVerified');

// Public routes
router.get('/', getAllKost);
router.get('/:id', optionalAuth, getKostById);

// Owner routes - Get my kosts
router.get('/owner/my-kosts', protect, authorize('pemilik'), getMyKosts);

// Protected routes (Pemilik)
router.post(
  '/',
  protect,
  checkEmailVerified,
  authorize('pemilik', 'admin'),
  createKostValidator,
  handleValidationErrors,
  createKost
);

router.put(
  '/:id',
  protect,
  authorize('pemilik', 'admin'),
  updateKostValidator,
  handleValidationErrors,
  updateKost
);

router.delete(
  '/:id',
  protect,
  authorize('pemilik', 'admin'),
  deleteKost
);

// Owner routes - Update available rooms
router.patch(
  '/:id/rooms',
  protect,
  authorize('pemilik'),
  updateAvailableRooms
);

// Admin routes
router.put(
  '/:id/approve',
  protect,
  authorize('admin'),
  approveKost
);

module.exports = router;