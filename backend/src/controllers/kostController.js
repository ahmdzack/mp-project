const { Kost, Category, KostType, Facility, KostImage, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Create new kost
// @route   POST /api/kost
// @access  Private (Pemilik only)
const createKost = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      district,
      latitude,
      longitude,
      category_id,
      type_id,
      price_weekly,
      price_monthly,
      price_yearly,
      available_rooms,
      total_rooms,
      facilities
    } = req.body;

    // Create kost
    const kost = await Kost.create({
      owner_id: req.user.id,
      name,
      description,
      address,
      city: city || 'Makassar',
      district,
      latitude,
      longitude,
      category_id,
      type_id,
      price_weekly,
      price_monthly,
      price_yearly,
      available_rooms: available_rooms || total_rooms,
      total_rooms,
      is_approved: false
    });

    // Add facilities if provided
    if (facilities && Array.isArray(facilities) && facilities.length > 0) {
      await kost.setFacilities(facilities);
    }

    // Get complete kost data
    const kostWithRelations = await Kost.findByPk(kost.id, {
      include: [
        { model: Category, as: 'Category', attributes: ['id', 'name'] },
        { model: KostType, as: 'KostType', attributes: ['id', 'name'] },
        { model: Facility, as: 'facilities', attributes: ['id', 'name', 'icon'] },
        { 
          model: KostImage, 
          as: 'images', 
          attributes: ['id', 'image_url', 'is_primary'],
          separate: true,
          order: [['is_primary', 'DESC']]
        }
      ]
    });

    const kostJSON = kostWithRelations.toJSON();
    kostJSON.primary_image = kostJSON.images?.find(img => img.is_primary)?.image_url || null;

    res.status(201).json({
      success: true,
      message: 'Kost created successfully. Waiting for admin approval.',
      data: kostJSON
    });

  } catch (error) {
    console.error('Create kost error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all kost (with filters)
// @route   GET /api/kost
// @access  Public
const getAllKost = async (req, res) => {
  try {
    const {
      category,
      type,
      city,
      district,
      min_price,
      max_price,
      approved,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build where clause
    const where = {};

    // Filter by approval (default: only approved for public)
    if (req.user && req.user.role === 'admin') {
      // Admin can see all
      if (approved !== undefined) {
        where.is_approved = approved === 'true';
      }
    } else if (req.user && req.user.role === 'pemilik') {
      // Pemilik can see their own kost
      where.owner_id = req.user.id;
    } else {
      // Public can only see approved
      where.is_approved = true;
    }

    // Category filter
    if (category) {
      const categoryData = await Category.findOne({ where: { name: category } });
      if (categoryData) where.category_id = categoryData.id;
    }

    // Type filter
    if (type) {
      const typeData = await KostType.findOne({ where: { name: type } });
      if (typeData) where.type_id = typeData.id;
    }

    // Location filters
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (district) where.district = { [Op.like]: `%${district}%` };

    // Price filter
    if (min_price || max_price) {
      where.price_monthly = {};
      if (min_price) where.price_monthly[Op.gte] = parseInt(min_price);
      if (max_price) where.price_monthly[Op.lte] = parseInt(max_price);
    }

    // Search by name
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    // Pagination
    const offset = (page - 1) * limit;

    const { count, rows } = await Kost.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'Category', attributes: ['id', 'name'] },
        { model: KostType, as: 'KostType', attributes: ['id', 'name'] },
        { model: Facility, as: 'facilities', attributes: ['id', 'name', 'icon'] },
        { 
          model: KostImage, 
          as: 'images', 
          attributes: ['id', 'image_url', 'is_primary'],
          separate: true,
          order: [['is_primary', 'DESC'], ['created_at', 'ASC']]
        },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Add primary_image field to each kost
    const kostsWithPrimaryImage = rows.map(kost => {
      const kostJSON = kost.toJSON();
      kostJSON.primary_image = kostJSON.images?.find(img => img.is_primary)?.image_url || null;
      return kostJSON;
    });

    res.status(200).json({
      success: true,
      count: rows.length,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: kostsWithPrimaryImage
    });

  } catch (error) {
    console.error('Get all kost error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get kost by ID
// @route   GET /api/kost/:id
// @access  Public
const getKostById = async (req, res) => {
  try {
    const { id } = req.params;

    const kost = await Kost.findByPk(id, {
      include: [
        { model: Category, as: 'Category', attributes: ['id', 'name'] },
        { model: KostType, as: 'KostType', attributes: ['id', 'name'] },
        { model: Facility, as: 'facilities', attributes: ['id', 'name', 'icon'] },
        { 
          model: KostImage, 
          as: 'images', 
          attributes: ['id', 'image_url', 'is_primary', 'created_at'],
          separate: true,
          order: [['is_primary', 'DESC'], ['created_at', 'ASC']]
        },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] }
      ]
    });

    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    // Check access
    if (!kost.is_approved) {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'This kost is not approved yet'
        });
      }
      if (req.user.role !== 'admin' && req.user.id !== kost.owner_id) {
        return res.status(403).json({
          success: false,
          message: 'This kost is not approved yet'
        });
      }
    }

    // Add primary_image field
    const kostJSON = kost.toJSON();
    kostJSON.primary_image = kostJSON.images?.find(img => img.is_primary)?.image_url || null;

    res.status(200).json({
      success: true,
      data: kostJSON
    });

  } catch (error) {
    console.error('Get kost error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update kost
// @route   PUT /api/kost/:id
// @access  Private (Owner only)
const updateKost = async (req, res) => {
  try {
    const { id } = req.params;
    const kost = await Kost.findByPk(id);

    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    // Check ownership
    if (kost.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this kost'
      });
    }

    const {
      name,
      description,
      address,
      city,
      district,
      latitude,
      longitude,
      category_id,
      type_id,
      price_weekly,
      price_monthly,
      price_yearly,
      available_rooms,
      total_rooms,
      facilities
    } = req.body;

    // Update kost
    await kost.update({
      name: name || kost.name,
      description: description !== undefined ? description : kost.description,
      address: address || kost.address,
      city: city || kost.city,
      district: district !== undefined ? district : kost.district,
      latitude: latitude !== undefined ? latitude : kost.latitude,
      longitude: longitude !== undefined ? longitude : kost.longitude,
      category_id: category_id || kost.category_id,
      type_id: type_id || kost.type_id,
      price_weekly: price_weekly !== undefined ? price_weekly : kost.price_weekly,
      price_monthly: price_monthly !== undefined ? price_monthly : kost.price_monthly,
      price_yearly: price_yearly !== undefined ? price_yearly : kost.price_yearly,
      available_rooms: available_rooms !== undefined ? available_rooms : kost.available_rooms,
      total_rooms: total_rooms !== undefined ? total_rooms : kost.total_rooms
    });

    // Update facilities if provided
    if (facilities && Array.isArray(facilities)) {
      await kost.setFacilities(facilities);
    }

    // Get updated kost
    const updatedKost = await Kost.findByPk(id, {
      include: [
        { model: Category, as: 'Category', attributes: ['id', 'name'] },
        { model: KostType, as: 'KostType', attributes: ['id', 'name'] },
        { model: Facility, as: 'facilities', attributes: ['id', 'name', 'icon'] },
        { 
          model: KostImage, 
          as: 'images', 
          attributes: ['id', 'image_url', 'is_primary'],
          separate: true,
          order: [['is_primary', 'DESC']]
        }
      ]
    });

    const kostJSON = updatedKost.toJSON();
    kostJSON.primary_image = kostJSON.images?.find(img => img.is_primary)?.image_url || null;

    res.status(200).json({
      success: true,
      message: 'Kost updated successfully',
      data: kostJSON
    });

  } catch (error) {
    console.error('Update kost error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete kost
// @route   DELETE /api/kost/:id
// @access  Private (Owner or Admin)
const deleteKost = async (req, res) => {
  try {
    const { id } = req.params;
    const kost = await Kost.findByPk(id);

    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    // Check ownership
    if (kost.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this kost'
      });
    }

    await kost.destroy();

    res.status(200).json({
      success: true,
      message: 'Kost deleted successfully'
    });

  } catch (error) {
    console.error('Delete kost error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve kost
// @route   PUT /api/kost/:id/approve
// @access  Private (Admin only)
const approveKost = async (req, res) => {
  try {
    const { id } = req.params;
    const kost = await Kost.findByPk(id);

    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    if (kost.is_approved) {
      return res.status(400).json({
        success: false,
        message: 'Kost already approved'
      });
    }

    await kost.update({
      is_approved: true,
      approved_by: req.user.id,
      approved_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Kost approved successfully',
      data: kost
    });

  } catch (error) {
    console.error('Approve kost error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createKost,
  getAllKost,
  getKostById,
  updateKost,
  deleteKost,
  approveKost
};