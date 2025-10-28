const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true
      }
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'kost_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return KostImage;
};