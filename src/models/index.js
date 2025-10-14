const User = require('./User');
const EmailVerification = require('./EmailVerification');
const PhoneVerification = require('./PhoneVerification');

// Associations
User.hasMany(EmailVerification, { 
  foreignKey: 'user_id', 
  onDelete: 'CASCADE' 
});
EmailVerification.belongsTo(User, { 
  foreignKey: 'user_id' 
});

User.hasMany(PhoneVerification, { 
  foreignKey: 'user_id', 
  onDelete: 'CASCADE' 
});
PhoneVerification.belongsTo(User, { 
  foreignKey: 'user_id' 
});

module.exports = {
  User,
  EmailVerification,
  PhoneVerification
};