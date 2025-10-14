const { KostType } = require('../models');

// @desc    Get all kost types
// @route   GET /api/kost-types
// @access  Public
const getAllKostTypes = async (req, res) => {
  try {
    const types = await KostType.findAll({
      attributes: ['id', 'name', 'description']
    });

    res.status(200).json({
      success: true,
      count: types.length,
      data: types
    });
  } catch (error) {
    console.error('Get kost types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get kost type by ID
// @route   GET /api/kost-types/:id
// @access  Public
const getKostTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const type = await KostType.findByPk(id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Kost type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: type
    });
  } catch (error) {
    console.error('Get kost type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllKostTypes,
  getKostTypeById
};