const crypto = require('crypto');

// Generate random token untuk email verification
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate random 6-digit code untuk phone verification
const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Calculate expiration time (default 1 hour)
const getExpirationTime = (hours = 1) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

// Generate booking code (format: BOOK-YYYYMMDD-XXXXX)
const generateBookingCode = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000); // 5 digit random
  return `BOOK-${year}${month}${day}-${random}`;
};

// Generate order ID for Midtrans (format: ORDER-YYYYMMDD-XXXXX)
const generateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000); // 5 digit random
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `ORDER-${year}${month}${day}-${random}${timestamp}`;
};

module.exports = {
  generateRandomToken,
  generateRandomCode,
  getExpirationTime,
  generateBookingCode,
  generateOrderId
};