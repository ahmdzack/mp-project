const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getAllUsers,
  getDashboardStats,
  getAllKost,
  approveKost,
  deleteUser,
  deleteKost
} = require('../controllers/adminController');

// Get all users
router.get('/users', protect, authorize('admin'), getAllUsers);

// Get dashboard stats
router.get('/stats', protect, authorize('admin'), getDashboardStats);

// Get all kost
router.get('/kost', protect, authorize('admin'), getAllKost);

// Approve kost
router.put('/kost/:id/approve', protect, authorize('admin'), approveKost);

// Delete user
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// Delete kost
router.delete('/kost/:id', protect, authorize('admin'), deleteKost);

module.exports = router;
