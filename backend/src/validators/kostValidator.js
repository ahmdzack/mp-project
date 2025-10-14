const { body } = require('express-validator');

const createKostValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nama kost is required')
    .isLength({ min: 3, max: 255 }).withMessage('Nama kost must be between 3-255 characters'),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required'),
  
  body('city')
    .optional()
    .trim(),
  
  body('district')
    .optional()
    .trim(),
  
  body('category_id')
    .notEmpty().withMessage('Category is required')
    .isInt().withMessage('Invalid category ID'),
  
  body('type_id')
    .notEmpty().withMessage('Type is required')
    .isInt().withMessage('Invalid type ID'),
  
  body('price_monthly')
    .notEmpty().withMessage('Monthly price is required')
    .isInt({ min: 1 }).withMessage('Price must be a positive number'),  // ← Check this line
  
  body('total_rooms')
    .notEmpty().withMessage('Total rooms is required')
    .isInt({ min: 1 }).withMessage('Total rooms must be at least 1'),
  
  body('facilities')
    .optional()
    .isArray().withMessage('Facilities must be an array')
];

module.exports = {
  createKostValidator,
  updateKostValidator: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 }).withMessage('Nama kost must be between 3-255 characters'),
    
    body('price_monthly')
      .optional()
      .isInt({ min: 1 }).withMessage('Price must be a positive number'),  // ← And this
    
    body('total_rooms')
      .optional()
      .isInt({ min: 1 }).withMessage('Total rooms must be at least 1')
  ]
};