const User = require('./User');
const EmailVerification = require('./EmailVerification');
const PhoneVerification = require('./PhoneVerification');
const Category = require('./Category');
const KostType = require('./KostType');
const Facility = require('./Facility');
const Kost = require('./Kost');
const KostImage = require('./KostImage');

// ============================================
// User Associations (Week 1)
// ============================================
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

// ============================================
// Kost Associations (Week 2)
// ============================================

// User - Kost (Owner)
User.hasMany(Kost, { 
  foreignKey: 'owner_id',
  as: 'ownedKost',
  onDelete: 'CASCADE'
});
Kost.belongsTo(User, { 
  foreignKey: 'owner_id',
  as: 'owner'
});

// User - Kost (Approver)
User.hasMany(Kost, {
  foreignKey: 'approved_by',
  as: 'approvedKost'
});
Kost.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver'
});

// Category - Kost
Category.hasMany(Kost, {
  foreignKey: 'category_id'
});
Kost.belongsTo(Category, {
  foreignKey: 'category_id'
});

// KostType - Kost
KostType.hasMany(Kost, {
  foreignKey: 'type_id'
});
Kost.belongsTo(KostType, {
  foreignKey: 'type_id'
});

// Kost - KostImage
Kost.hasMany(KostImage, {
  foreignKey: 'kost_id',
  as: 'images',
  onDelete: 'CASCADE'
});
KostImage.belongsTo(Kost, {
  foreignKey: 'kost_id'
});

// Kost - Facility (Many-to-Many) - FIXED!
Kost.belongsToMany(Facility, {
  through: 'kost_facilities',
  foreignKey: 'kost_id',
  otherKey: 'facility_id',
  as: 'facilities',
  timestamps: false  // ✅ No timestamps in junction table
});
Facility.belongsToMany(Kost, {
  through: 'kost_facilities',
  foreignKey: 'facility_id',
  otherKey: 'kost_id',
  as: 'kosts',
  timestamps: false  // ✅ No timestamps in junction table
});

// ============================================
// Exports
// ============================================
module.exports = {
  User,
  EmailVerification,
  PhoneVerification,
  Category,
  KostType,
  Facility,
  Kost,
  KostImage
};