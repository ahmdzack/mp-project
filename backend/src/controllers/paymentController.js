const { Payment, Booking, Kost, User } = require('../models');
const { snap, coreApi } = require('../config/midtrans');
const { generateOrderId } = require('../utils/helpers');
const { sendPaymentSuccess } = require('../services/bookingEmailService');

// @desc    Create payment & get Snap token
// @route   POST /api/payments
// @access  Private (pencari)
exports.createPayment = async (req, res, next) => {
  try {
    const { booking_id } = req.body;

    // Validasi booking exists
    const booking = await Booking.findByPk(booking_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Kost,
          as: 'kost',
          attributes: ['id', 'name', 'address', 'city']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Authorization: hanya user yang membuat booking
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk membuat payment ini'
      });
    }

    // Cek apakah sudah ada payment
    const existingPayment = await Payment.findOne({ where: { booking_id } });
    if (existingPayment) {
      // Jika payment masih pending, return snap token yang ada
      if (existingPayment.status === 'pending') {
        return res.json({
          success: true,
          message: 'Payment sudah ada, gunakan snap token yang tersedia',
          data: {
            payment_id: existingPayment.id,
            order_id: existingPayment.order_id,
            snap_token: existingPayment.snap_token,
            snap_redirect_url: existingPayment.snap_redirect_url,
            booking: {
              id: booking.id,
              kost_name: booking.kost.name,
              total_price: booking.total_price,
              status: booking.status
            }
          }
        });
      }
      
      // Jika payment sudah berhasil atau expired, buat payment baru
      if (existingPayment.status === 'success') {
        return res.status(400).json({
          success: false,
          message: 'Booking ini sudah dibayar'
        });
      }
      
      // Jika payment expired atau failed, hapus yang lama dan buat baru
      if (['expired', 'failed', 'cancel'].includes(existingPayment.status)) {
        await existingPayment.destroy();
        // Lanjutkan ke pembuatan payment baru
      }
    }

    // Generate order_id
    let orderId;
    let isUnique = false;
    while (!isUnique) {
      orderId = generateOrderId();
      const existing = await Payment.findOne({ where: { order_id: orderId } });
      if (!existing) isUnique = true;
    }

    // Prepare Midtrans transaction details
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.floor(booking.total_price) // Midtrans hanya terima integer
      },
      customer_details: {
        first_name: booking.guest_name,
        email: booking.guest_email,
        phone: booking.guest_phone
      },
      item_details: [
        {
          id: booking.kost_id,
          price: Math.floor(booking.total_price),
          quantity: 1,
          name: `Booking ${booking.kost.name} - ${booking.duration_months} bulan`
        }
      ],
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/bookings/${booking_id}/payment/success`,
        error: `${process.env.FRONTEND_URL}/bookings/${booking_id}/payment/error`,
        pending: `${process.env.FRONTEND_URL}/bookings/${booking_id}/payment/pending`
      }
    };

    // Create Snap transaction
    console.log('📤 Creating Midtrans transaction...');
    const transaction = await snap.createTransaction(parameter);
    console.log('✅ Midtrans transaction created:', {
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });

    // Save payment to database
    console.log('💾 Saving payment to database...');
    const payment = await Payment.create({
      booking_id,
      order_id: orderId,
      amount: booking.total_price,
      status: 'pending',
      snap_token: transaction.token,
      snap_redirect_url: transaction.redirect_url,
      midtrans_response: transaction
    });
    console.log('✅ Payment saved to database:', {
      id: payment.id,
      order_id: payment.order_id,
      booking_id: payment.booking_id,
      status: payment.status
    });

    res.status(201).json({
      success: true,
      message: 'Payment berhasil dibuat',
      data: {
        payment_id: payment.id,
        order_id: orderId,
        snap_token: transaction.token,
        snap_redirect_url: transaction.redirect_url,
        booking: {
          id: booking.id,
          booking_code: booking.booking_code,
          kost_name: booking.kost.name,
          total_price: booking.total_price,
          duration_months: booking.duration_months
        }
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    next(error);
  }
};

// @desc    Handle Midtrans notification (webhook)
// @route   POST /api/payments/notification
// @access  Public (dari Midtrans)
exports.handleNotification = async (req, res, next) => {
  try {
    const notification = req.body;
    console.log('📨 Midtrans Notification:', notification);

    const {
      order_id,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      gross_amount,
      transaction_time,
      settlement_time
    } = notification;

    // Get payment from database
    const payment = await Payment.findOne({
      where: { order_id },
      include: [
        {
          model: Booking,
          as: 'booking'
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment tidak ditemukan'
      });
    }

    // Update payment details
    payment.transaction_id = transaction_id;
    payment.payment_type = payment_type;
    payment.transaction_status = transaction_status;
    payment.transaction_time = transaction_time;
    payment.settlement_time = settlement_time;
    payment.midtrans_response = notification;

    // Determine payment status based on transaction_status
    let paymentStatus = 'pending';
    let bookingStatus = payment.booking.status;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'success';
        bookingStatus = 'confirmed';
      } else if (fraud_status === 'challenge') {
        paymentStatus = 'pending';
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'success';
      bookingStatus = 'confirmed';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      paymentStatus = 'failed';
      bookingStatus = 'cancelled';
      
      // Kembalikan available_rooms
      const kost = await Kost.findByPk(payment.booking.kost_id);
      if (kost) {
        await kost.increment('available_rooms', { by: 1 });
      }
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
    }

    // Update payment
    payment.status = paymentStatus;
    await payment.save();

    // Update booking status
    if (bookingStatus !== payment.booking.status) {
      payment.booking.status = bookingStatus;
      await payment.booking.save();
    }

    console.log(`✅ Payment ${order_id} updated: ${paymentStatus}`);
    console.log(`✅ Booking ${payment.booking.booking_code} updated: ${bookingStatus}`);

    // Send email notification jika payment success
    if (paymentStatus === 'success') {
      // Reload booking with full details untuk email
      const fullBooking = await Booking.findByPk(payment.booking.id, {
        include: [
          {
            model: Kost,
            as: 'kost',
            attributes: ['id', 'name', 'address', 'city', 'district', 'owner_id'],
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'email', 'phone']
              }
            ]
          }
        ]
      });
      
      await sendPaymentSuccess(payment, fullBooking);
    }

    res.json({
      success: true,
      message: 'Notification berhasil diproses'
    });
  } catch (error) {
    console.error('Handle notification error:', error);
    next(error);
  }
};

// @desc    Get payment by booking_id
// @route   GET /api/payments/booking/:booking_id
// @access  Private
exports.getPaymentByBookingId = async (req, res, next) => {
  try {
    const { booking_id } = req.params;
    
    console.log(`🔍 GET Payment by booking_id: ${booking_id}`);

    const payment = await Payment.findOne({
      where: { booking_id },
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            },
            {
              model: Kost,
              as: 'kost',
              attributes: ['id', 'name', 'city', 'price_monthly', 'price_weekly', 'price_yearly']
            }
          ]
        }
      ]
    });

    if (!payment) {
      console.log(`❌ Payment not found for booking_id: ${booking_id}`);
      return res.status(404).json({
        success: false,
        message: 'Payment tidak ditemukan'
      });
    }
    
    console.log(`✅ Payment found:`, {
      id: payment.id,
      order_id: payment.order_id,
      status: payment.status,
      booking_id: payment.booking_id
    });

    // Authorization
    if (req.user.role === 'pencari' && payment.booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke payment ini'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check payment status from Midtrans
// @route   GET /api/payments/:order_id/status
// @access  Private
exports.checkPaymentStatus = async (req, res, next) => {
  try {
    const { order_id } = req.params;

    // Get from database
    const payment = await Payment.findOne({
      where: { order_id },
      include: [
        {
          model: Booking,
          as: 'booking'
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment tidak ditemukan'
      });
    }

    // Authorization
    if (req.user.role === 'pencari' && payment.booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke payment ini'
      });
    }

    // Check status from Midtrans
    try {
      const statusResponse = await coreApi.transaction.status(order_id);
      
      // Update local database jika ada perubahan
      if (statusResponse.transaction_status !== payment.transaction_status) {
        payment.transaction_status = statusResponse.transaction_status;
        payment.midtrans_response = statusResponse;
        
        // Update payment status
        if (statusResponse.transaction_status === 'settlement') {
          payment.status = 'success';
          payment.booking.status = 'confirmed';
          await payment.booking.save();
        }
        
        await payment.save();
      }

      res.json({
        success: true,
        data: {
          order_id,
          transaction_status: statusResponse.transaction_status,
          payment_status: payment.status,
          booking_status: payment.booking.status,
          midtrans_data: statusResponse
        }
      });
    } catch (midtransError) {
      // Jika error dari Midtrans, return data dari database
      res.json({
        success: true,
        data: {
          order_id,
          payment_status: payment.status,
          booking_status: payment.booking.status,
          message: 'Status dari database (Midtrans unreachable)'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private (admin/pemilik)
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'phone']
            },
            {
              model: Kost,
              as: 'kost',
              attributes: ['id', 'name', 'city', 'price']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};
