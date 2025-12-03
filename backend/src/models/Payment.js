const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  order_id: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  transaction_status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  transaction_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settlement_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'expired'),
    defaultValue: 'pending'
  },
  snap_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  snap_redirect_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  midtrans_response: {
    type: DataTypes.JSON,
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
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Payment;
