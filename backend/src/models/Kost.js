const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Kost = sequelize.define('Kost', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Kost name is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Address is required' }
      }
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Makassar'
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Sulawesi Selatan'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    price_weekly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('price_weekly');
        return value ? parseFloat(value) : null;
      }
    },
    price_monthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('price_monthly');
        return value ? parseFloat(value) : 0;
      }
    },
    price_yearly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('price_yearly');
        return value ? parseFloat(value) : null;
      }
    },
    total_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Total rooms must be at least 1' }
      }
    },
    available_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Available rooms cannot be negative' }
      }
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kost_types',
        key: 'id'
      }
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'kost',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Kost;
};