const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ============================================
// IMPORT MODEL DEFINITIONS (Functions)
// ============================================
const UserModel = require('./User');
const EmailVerificationModel = require('./EmailVerification');
const PhoneVerificationModel = require('./PhoneVerification');
const CategoryModel = require('./Category');
const KostTypeModel = require('./KostType');
const FacilityModel = require('./Facility');
const KostModel = require('./Kost');
const KostImageModel = require('./KostImage');
// Week 4: Booking & Payment
const Booking = require('./Booking');
const Payment = require('./Payment');

// ============================================
// INITIALIZE MODELS (Create instances)
// ============================================
const User = UserModel(sequelize, DataTypes);
const EmailVerification = EmailVerificationModel(sequelize, DataTypes);
const PhoneVerification = PhoneVerificationModel(sequelize, DataTypes);
const Category = CategoryModel(sequelize, DataTypes);
const KostType = KostTypeModel(sequelize, DataTypes);
const Facility = FacilityModel(sequelize, DataTypes);
const Kost = KostModel(sequelize, DataTypes);
const KostImage = KostImageModel(sequelize, DataTypes);

// ============================================
// ASSOCIATIONS
// ============================================

// Week 1: User Associations
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

// Week 2: Kost Associations

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
  foreignKey: 'category_id',
  as: 'kosts'
});
Kost.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'Category'
});

// KostType - Kost
KostType.hasMany(Kost, {
  foreignKey: 'type_id',
  as: 'kosts'
});
Kost.belongsTo(KostType, {
  foreignKey: 'type_id',
  as: 'KostType'
});

// Week 3: Kost - KostImage
Kost.hasMany(KostImage, {
  foreignKey: 'kost_id',
  as: 'images',
  onDelete: 'CASCADE'
});
KostImage.belongsTo(Kost, {
  foreignKey: 'kost_id',
  as: 'kost'
});

// Kost - Facility (Many-to-Many)
Kost.belongsToMany(Facility, {
  through: 'kost_facilities',
  foreignKey: 'kost_id',
  otherKey: 'facility_id',
  as: 'facilities',
  timestamps: false
});
Facility.belongsToMany(Kost, {
  through: 'kost_facilities',
  foreignKey: 'facility_id',
  otherKey: 'kost_id',
  as: 'kosts',
  timestamps: false
});

// Week 4: Booking & Payment Associations

// User - Booking
User.hasMany(Booking, {
  foreignKey: 'user_id',
  as: 'bookings',
  onDelete: 'CASCADE'
});
Booking.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Kost - Booking
Kost.hasMany(Booking, {
  foreignKey: 'kost_id',
  as: 'bookings',
  onDelete: 'CASCADE'
});
Booking.belongsTo(Kost, {
  foreignKey: 'kost_id',
  as: 'kost'
});

// Booking - Payment
Booking.hasOne(Payment, {
  foreignKey: 'booking_id',
  as: 'payment',
  onDelete: 'CASCADE'
});
Payment.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

// ============================================
// EXPORT INITIALIZED MODELS
// ============================================
module.exports = {
  sequelize,
  Sequelize,
  User,
  EmailVerification,
  PhoneVerification,
  Category,
  KostType,
  Facility,
  Kost,
  KostImage,
  Booking,
  Payment
};