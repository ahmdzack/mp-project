const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KostImage = sequelize.define('KostImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  kost_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'kost',
      key: 'id'
    }
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'kost_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = KostImage;