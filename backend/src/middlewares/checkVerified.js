// Middleware to check if user's email is verified
const checkEmailVerified = (req, res, next) => {
  const user = req.user;

  if (!user.email_verified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before accessing this resource',
      needsVerification: true
    });
  }

  next();
};

// Middleware to check if user's phone is verified
const checkPhoneVerified = (req, res, next) => {
  const user = req.user;

  if (!user.phone_verified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your phone number before accessing this resource',
      needsVerification: true
    });
  }

  next();
};

module.exports = {
  checkEmailVerified,
  checkPhoneVerified
};
