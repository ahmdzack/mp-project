const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/validateRole');
const { uploadMultiple } = require('../middlewares/upload');
const {
  uploadKostImages,
  getKostImages,
  setPrimaryImage,
  deleteKostImage,
  deleteAllKostImages
} = require('../controllers/kostImageControllers');

// Semua route memerlukan authentication
router.use(protect);

// Upload images untuk kost tertentu (pemilik/admin)
router.post('/:id/images', 
  authorize('pemilik', 'admin'), 
  uploadMultiple, 
  uploadKostImages
);

// Get semua images dari kost tertentu (public after auth)
router.get('/:id/images', getKostImages);

// Set primary image (pemilik/admin)
router.patch('/:id/images/:imageId/primary', 
  authorize('pemilik', 'admin'), 
  setPrimaryImage
);

// Delete satu image (pemilik/admin)
router.delete('/:id/images/:imageId', 
  authorize('pemilik', 'admin'), 
  deleteKostImage
);

// Delete semua images dari kost tertentu (admin only)
router.delete('/:id/images', 
  authorize('admin'), 
  deleteAllKostImages
);

module.exports = router;