const express = require('express');
const router = express.Router();
const {
  createKost,
  getAllKost,
  getKostById,
  updateKost,
  deleteKost,
  approveKost
} = require('../controllers/kostController');
const { createKostValidator, updateKostValidator } = require('../validators/kostValidator');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/validateRole');

// Public routes
router.get('/', getAllKost);
router.get('/:id', getKostById);

// Protected routes (Pemilik)
router.post(
  '/',
  protect,
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

// Admin routes
router.put(
  '/:id/approve',
  protect,
  authorize('admin'),
  approveKost
);

module.exports = router;