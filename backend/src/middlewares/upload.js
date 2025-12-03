const { upload } = require('../config/cloudinary');
const multer = require('multer');

// Single image upload
const uploadSingle = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
};

// Multiple images upload (max 5)
const uploadMultiple = (req, res, next) => {
  const maxFiles = parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5;
  upload.array('images', maxFiles)(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
};

// Handle upload errors
const handleUploadError = (err, req, res, next) => {
  console.error('Upload error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 5MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum ${process.env.MAX_FILES_PER_UPLOAD || 5} files per upload.`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "image" for single or "images" for multiple.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError
};