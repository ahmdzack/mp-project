const { Facility } = require('../models');

// @desc    Get all facilities
// @route   GET /api/facilities
// @access  Public
const getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      attributes: ['id', 'name', 'icon']
    });

    res.status(200).json({
      success: true,
      count: facilities.length,
      data: facilities
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllFacilities
};