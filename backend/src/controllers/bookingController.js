const { Booking, Kost, User, KostImage, Category, KostType, Payment } = require('../models');
const { generateBookingCode } = require('../utils/helpers');
const moment = require('moment');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (pencari)
exports.createBooking = async (req, res, next) => {
  try {
    const {
      kost_id,
      check_in_date,
      duration_type = 'monthly',
      duration,
      guest_name,
      guest_phone,
      guest_email,
      guest_id_card,
      notes
    } = req.body;

    // Validasi input required
    if (!kost_id || !check_in_date || !duration || !guest_name || !guest_phone || !guest_email) {
      return res.status(400).json({
        success: false,
        message: 'Field yang wajib diisi: kost_id, check_in_date, duration, guest_name, guest_phone, guest_email'
      });
    }

    // Validasi duration_type
    const validDurationTypes = ['weekly', 'monthly', 'yearly'];
    if (!validDurationTypes.includes(duration_type)) {
      return res.status(400).json({
        success: false,
        message: 'duration_type harus salah satu dari: weekly, monthly, yearly'
      });
    }

    // Validasi duration harus integer positif
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'duration harus berupa angka positif minimal 1'
      });
    }

    // Validasi max duration berdasarkan tipe
    const maxDurations = {
      weekly: 52,  // Max 1 tahun (52 minggu)
      monthly: 24, // Max 2 tahun (24 bulan)
      yearly: 5    // Max 5 tahun
    };

    if (durationNum > maxDurations[duration_type]) {
      return res.status(400).json({
        success: false,
        message: `Durasi maksimal untuk ${duration_type} adalah ${maxDurations[duration_type]}`
      });
    }

    // Validasi kost exists
    const kost = await Kost.findByPk(kost_id);
    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost tidak ditemukan'
      });
    }

    // Validasi harga sesuai duration_type tersedia
    if (duration_type === 'weekly' && !kost.price_weekly) {
      return res.status(400).json({
        success: false,
        message: 'Harga mingguan tidak tersedia untuk kost ini'
      });
    }

    if (duration_type === 'yearly' && !kost.price_yearly) {
      return res.status(400).json({
        success: false,
        message: 'Harga tahunan tidak tersedia untuk kost ini'
      });
    }

    // Cek ketersediaan kamar
    if (kost.available_rooms <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kamar tidak tersedia'
      });
    }

    // Calculate checkout date and duration in months based on duration_type
    const checkIn = moment(check_in_date);
    let checkOut;
    let durationInMonths;
    let pricePerPeriod;

    switch (duration_type) {
      case 'weekly':
        checkOut = checkIn.clone().add(duration, 'weeks');
        durationInMonths = Math.ceil(duration / 4); // Approximate months
        pricePerPeriod = kost.price_weekly || kost.price_monthly / 4;
        break;
      case 'yearly':
        checkOut = checkIn.clone().add(duration, 'years');
        durationInMonths = duration * 12;
        pricePerPeriod = kost.price_yearly || kost.price_monthly * 12;
        break;
      case 'monthly':
      default:
        checkOut = checkIn.clone().add(duration, 'months');
        durationInMonths = duration;
        pricePerPeriod = kost.price_monthly;
        break;
    }
    
    // Calculate total price
    const totalPrice = pricePerPeriod * duration;

    // Generate booking code
    let bookingCode;
    let isUnique = false;
    while (!isUnique) {
      bookingCode = generateBookingCode();
      const existing = await Booking.findOne({ where: { booking_code: bookingCode } });
      if (!existing) isUnique = true;
    }

    // Create booking
    const booking = await Booking.create({
      booking_code: bookingCode,
      user_id: req.user.id,
      kost_id,
      check_in_date: checkIn.format('YYYY-MM-DD'),
      check_out_date: checkOut.format('YYYY-MM-DD'),
      duration_type,
      duration,
      duration_months: durationInMonths,
      total_price: totalPrice,
      guest_name,
      guest_phone,
      guest_email,
      guest_id_card,
      notes,
      status: 'pending'
    });

    // Kurangi available rooms
    await kost.decrement('available_rooms', { by: 1 });

    // Get booking with relations
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Kost,
          as: 'kost',
          attributes: ['id', 'name', 'address', 'city', 'price_weekly', 'price_monthly', 'price_yearly'],
          include: [
            {
              model: KostImage,
              as: 'images',
              where: { is_primary: true },
              required: false,
              attributes: ['id', 'image_url']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: bookingWithDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin/pemilik: all, pencari: own)
// @route   GET /api/bookings
// @access  Private
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, kost_id } = req.query;
    const where = {};

    // Role-based filtering
    if (req.user.role === 'pencari') {
      where.user_id = req.user.id;
    } else if (req.user.role === 'pemilik') {
      // Pemilik hanya bisa lihat booking untuk kost mereka
      const myKosts = await Kost.findAll({
        where: { owner_id: req.user.id },
        attributes: ['id']
      });
      const myKostIds = myKosts.map(k => k.id);
      where.kost_id = myKostIds;
    }
    // Admin bisa lihat semua bookings (tidak ada filter)

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by kost_id
    if (kost_id) {
      where.kost_id = kost_id;
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Kost,
          as: 'kost',
          attributes: ['id', 'name', 'address', 'city', 'price_weekly', 'price_monthly', 'price_yearly'],
          include: [
            {
              model: KostImage,
              as: 'images',
              where: { is_primary: true },
              required: false,
              attributes: ['id', 'image_url']
            },
            {
              model: Category,
              as: 'Category',
              attributes: ['id', 'name']
            },
            {
              model: KostType,
              as: 'KostType',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Normalize response - add user_name, user_email, kost_name untuk frontend
    const bookingsData = bookings.map(booking => {
      const bookingJson = booking.toJSON();
      
      // Add flattened user data
      if (bookingJson.user) {
        bookingJson.user_name = bookingJson.user.name;
        bookingJson.user_email = bookingJson.user.email;
        bookingJson.user_phone = bookingJson.user.phone;
      }
      
      // Add flattened kost data
      if (bookingJson.kost) {
        bookingJson.kost_name = bookingJson.kost.name;
        bookingJson.kost_city = bookingJson.kost.city;
        
        // Add primary_image to kost if it has images
        if (bookingJson.kost.images && bookingJson.kost.images.length > 0) {
          bookingJson.kost.primary_image = bookingJson.kost.images[0].image_url;
        }
      }
      
      return bookingJson;
    });

    res.json({
      success: true,
      count: bookingsData.length,
      data: bookingsData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Kost,
          as: 'kost',
          include: [
            {
              model: KostImage,
              as: 'images',
              attributes: ['id', 'image_url', 'is_primary']
            },
            {
              model: Category,
              as: 'Category',
              attributes: ['id', 'name']
            },
            {
              model: KostType,
              as: 'KostType',
              attributes: ['id', 'name']
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        },
        {
          model: Payment,
          as: 'payment',
          required: false,
          attributes: ['id', 'status', 'payment_method', 'payment_type', 'transaction_time', 'settlement_time', 'order_id']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Authorization check
    if (req.user.role === 'pencari' && booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Tidak memiliki akses untuk membatalkan booking ini'
      });
    }

    if (req.user.role === 'pemilik' && booking.kost.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke booking ini'
      });
    }

    // Format booking with kost primary_image
    const bookingData = booking.toJSON();
    
    // Normalize Kost to kost (lowercase)
    if (bookingData.Kost) {
      bookingData.kost = bookingData.Kost;
      delete bookingData.Kost;
    }
    
    // Add primary image URL to kost if it has images
    if (bookingData.kost && bookingData.kost.images && bookingData.kost.images.length > 0) {
      const primaryImage = bookingData.kost.images.find(img => img.is_primary);
      bookingData.kost.primary_image = primaryImage ? primaryImage.image_url : bookingData.kost.images[0].image_url;
    }

    res.json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private (pemilik/admin)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Kost, as: 'kost' }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Authorization: Pemilik hanya bisa update booking untuk kost mereka
    if (req.user.role === 'pemilik' && booking.kost.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk update booking ini'
      });
    }

    // Update status
    booking.status = status;
    await booking.save();

    // Jika cancelled, kembalikan available_rooms
    if (status === 'cancelled') {
      await booking.kost.increment('available_rooms', { by: 1 });
    }

    res.json({
      success: true,
      message: 'Status booking berhasil diupdate',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (pencari: own, pemilik/admin: all)
exports.cancelBooking = async (req, res, next) => {
  try {
    const { cancellation_reason } = req.body;

    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Kost, as: 'kost' }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Authorization
    if (req.user.role === 'pencari' && booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak bisa membatalkan booking orang lain'
      });
    }

    if (req.user.role === 'pemilik' && booking.kost.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak bisa membatalkan booking untuk kost ini'
      });
    }

    // Tidak bisa cancel jika sudah checked_in atau checked_out
    if (['checked_in', 'checked_out'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking dengan status ${booking.status} tidak bisa dibatalkan`
      });
    }

    // Simpan status sebelumnya untuk menentukan apakah perlu kembalikan kamar
    const wasConfirmed = booking.status === 'confirmed';

    // Update booking
    booking.status = 'cancelled';
    booking.cancellation_reason = cancellation_reason || 'Dibatalkan oleh user';
    booking.cancelled_at = new Date();
    await booking.save();

    // Kembalikan available_rooms hanya jika booking sebelumnya sudah confirmed
    if (wasConfirmed) {
      await booking.kost.increment('available_rooms', { by: 1 });
    }

    res.json({
      success: true,
      message: wasConfirmed 
        ? 'Booking berhasil dibatalkan dan kamar tersedia telah dikembalikan'
        : 'Booking berhasil dibatalkan',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (admin only)
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Kost, as: 'kost' }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Kembalikan available_rooms jika booking belum cancelled
    if (booking.status !== 'cancelled') {
      await booking.kost.increment('available_rooms', { by: 1 });
    }

    await booking.destroy();

    res.json({
      success: true,
      message: 'Booking berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for owner's kosts
// @route   GET /api/bookings/owner/my-bookings
// @access  Private (pemilik)
exports.getOwnerBookings = async (req, res, next) => {
  try {
    const { status, kost_id } = req.query;

    // Build query
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (kost_id) {
      whereClause.kost_id = kost_id;
    }

    // Get bookings for owner's kosts
    console.log('🔍 Fetching bookings for owner:', req.user.id);
    
    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Kost,
          as: 'kost',
          where: { owner_id: req.user.id },
          attributes: ['id', 'name', 'address', 'city'],
          include: [
            {
              model: KostImage,
              as: 'images',
              attributes: ['id', 'image_url'],
              where: { is_primary: true },
              required: false,
              limit: 1
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'status', 'payment_method', 'payment_type', 'transaction_time', 'settlement_time', 'order_id'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log('📦 Raw bookings count:', bookings.length);

    // Log untuk debug
    console.log('📦 Total bookings found:', bookings.length);
    if (bookings.length > 0) {
      const firstBookingJSON = bookings[0].toJSON();
      console.log('💳 First booking payment:', firstBookingJSON.payment);
      console.log('📊 Has payment?', !!firstBookingJSON.payment);
      console.log('🔍 First booking ID:', firstBookingJSON.id);
      
      // Check if payment exists in database
      const paymentCheck = await Payment.findOne({ 
        where: { booking_id: firstBookingJSON.id },
        raw: true 
      });
      console.log('💰 Payment check from DB:', paymentCheck);
    }

    // Convert to plain objects to ensure payment is included
    const bookingsData = bookings.map(b => b.toJSON());

    // Group by status for summary
    const summary = {
      pending: bookingsData.filter(b => b.status === 'pending').length,
      confirmed: bookingsData.filter(b => b.status === 'confirmed').length,
      checked_in: bookingsData.filter(b => b.status === 'checked_in').length,
      checked_out: bookingsData.filter(b => b.status === 'checked_out').length,
      cancelled: bookingsData.filter(b => b.status === 'cancelled').length,
      total: bookingsData.length
    };

    res.json({
      success: true,
      count: bookingsData.length,
      summary,
      data: bookingsData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm booking (owner)
// @route   PATCH /api/bookings/:id/confirm
// @access  Private (pemilik)
exports.confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { 
          model: Kost, 
          as: 'kost',
          attributes: ['id', 'name', 'owner_id', 'available_rooms']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Check ownership
    if (booking.kost.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk konfirmasi booking ini'
      });
    }

    // Check if already confirmed
    if (booking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Booking sudah dikonfirmasi sebelumnya'
      });
    }

    // Check if rooms are available
    if (booking.kost.available_rooms <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada kamar tersedia untuk dikonfirmasi'
      });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.confirmed_at = new Date();
    await booking.save();

    // Decrease available rooms
    booking.kost.available_rooms -= 1;
    await booking.kost.save();

    res.json({
      success: true,
      message: 'Booking berhasil dikonfirmasi dan kamar tersedia telah dikurangi',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject booking (owner)
// @route   PATCH /api/bookings/:id/reject
// @access  Private (pemilik)
exports.rejectBooking = async (req, res, next) => {
  try {
    const { rejection_reason } = req.body;

    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { 
          model: Kost, 
          as: 'kost',
          attributes: ['id', 'name', 'owner_id', 'available_rooms']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Check ownership
    if (booking.kost.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menolak booking ini'
      });
    }

    // Check if already processed
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Hanya booking dengan status pending yang bisa ditolak'
      });
    }

    // Update status
    booking.status = 'cancelled';
    booking.cancellation_reason = rejection_reason || 'Ditolak oleh pemilik';
    booking.cancelled_at = new Date();
    await booking.save();

    // Tidak perlu kembalikan available_rooms karena booking pending belum mengurangi kamar

    res.json({
      success: true,
      message: 'Booking berhasil ditolak',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
