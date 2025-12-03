const { User, Kost, Booking, KostImage } = require('../models');
const { Op } = require('sequelize');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    
    let whereClause = {};
    
    // Filter by search (name or email)
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Filter by role
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'phone', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengguna',
      error: error.message
    });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Count users by role
    const totalUsers = await User.count();
    const pencariCount = await User.count({ where: { role: 'pencari' } });
    const pemilikCount = await User.count({ where: { role: 'pemilik' } });
    
    // Count kost
    const totalKost = await Kost.count();
    const approvedKost = await Kost.count({ where: { is_approved: true } });
    const pendingKost = await Kost.count({ where: { is_approved: false } });
    
    // Count bookings
    const totalBookings = await Booking.count();
    const confirmedBookings = await Booking.count({ 
      where: { status: 'confirmed' } 
    });
    
    // Calculate revenue from confirmed bookings
    const confirmedBookingsList = await Booking.findAll({
      where: { status: 'confirmed' },
      attributes: ['total_price']
    });
    
    const totalRevenue = confirmedBookingsList.reduce((sum, booking) => {
      return sum + parseFloat(booking.total_price || 0);
    }, 0);
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          pencari: pencariCount,
          pemilik: pemilikCount
        },
        kost: {
          total: totalKost,
          approved: approvedKost,
          pending: pendingKost
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings
        },
        revenue: totalRevenue
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik dashboard',
      error: error.message
    });
  }
};

// Get all kost with owner info (admin only)
exports.getAllKost = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    let whereClause = {};
    
    // Filter by search (name or city)
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Filter by approval status
    if (status === 'approved') {
      whereClause.is_approved = true;
    } else if (status === 'pending') {
      whereClause.is_approved = false;
    }
    
    const kostList = await Kost.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: KostImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_primary']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Add primary_image to each kost
    const kostsWithPrimaryImage = kostList.map(kost => {
      const kostJSON = kost.toJSON();
      if (kostJSON.images && kostJSON.images.length > 0) {
        const primaryImage = kostJSON.images.find(img => img.is_primary);
        kostJSON.primary_image = primaryImage ? primaryImage.image_url : kostJSON.images[0].image_url;
      } else {
        kostJSON.primary_image = null;
      }
      return kostJSON;
    });
    
    res.json({
      success: true,
      data: kostsWithPrimaryImage
    });
  } catch (error) {
    console.error('Get all kost error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kost',
      error: error.message
    });
  }
};

// Approve kost
exports.approveKost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kost = await Kost.findByPk(id);
    
    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost tidak ditemukan'
      });
    }
    
    kost.is_approved = true;
    await kost.save();
    
    res.json({
      success: true,
      message: 'Kost berhasil disetujui',
      data: kost
    });
  } catch (error) {
    console.error('Approve kost error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyetujui kost',
      error: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting admins
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tidak dapat menghapus admin'
      });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'Pengguna berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus pengguna',
      error: error.message
    });
  }
};

// Delete kost (admin only)
exports.deleteKost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kost = await Kost.findByPk(id);
    
    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost tidak ditemukan'
      });
    }
    
    // Delete associated images first
    await KostImage.destroy({ where: { kost_id: id } });
    
    await kost.destroy();
    
    res.json({
      success: true,
      message: 'Kost berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete kost error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus kost',
      error: error.message
    });
  }
};
