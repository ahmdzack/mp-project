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

module.exports = {
  generateRandomToken,
  generateRandomCode,
  getExpirationTime
};