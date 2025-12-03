const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Facility = sequelize.define('Facility', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'facilities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Facility;
};