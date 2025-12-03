const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  kost_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'kost',
      key: 'id'
    }
  },
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  duration_type: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  duration_months: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Calculated equivalent in months for compatibility'
  },
  total_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  guest_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  guest_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  guest_email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  guest_id_card: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Booking;
