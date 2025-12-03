const { sendEmail } = require('../config/email');

// Email template untuk booking confirmation
const bookingConfirmationEmail = (booking) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; width: 150px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Booking Berhasil Dikonfirmasi!</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${booking.guest_name}</strong>,</p>
          <p>Terima kasih! Booking Anda telah berhasil dikonfirmasi.</p>
          
          <div class="booking-details">
            <h3>📋 Detail Booking</h3>
            <div class="detail-row">
              <span class="detail-label">Kode Booking:</span>
              <span>${booking.booking_code}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Nama Kost:</span>
              <span>${booking.kost.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lokasi:</span>
              <span>${booking.kost.city}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in:</span>
              <span>${booking.check_in_date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out:</span>
              <span>${booking.check_out_date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Durasi:</span>
              <span>${booking.duration_months} bulan</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Pembayaran:</span>
              <span><strong>Rp ${Number(booking.total_price).toLocaleString('id-ID')}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span><strong style="color: #4CAF50;">CONFIRMED</strong></span>
            </div>
          </div>

          <p>Silakan catat kode booking Anda untuk keperluan check-in.</p>
          
          <center>
            <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">Lihat Detail Booking</a>
          </center>

          <p style="margin-top: 20px;"><strong>Catatan Penting:</strong></p>
          <ul>
            <li>Harap tiba sesuai waktu check-in yang telah ditentukan</li>
            <li>Bawa identitas resmi (KTP/SIM) saat check-in</li>
            <li>Hubungi pemilik kost jika ada pertanyaan</li>
          </ul>
        </div>
        <div class="footer">
          <p>Email ini dikirim otomatis oleh sistem Kost Reservation</p>
          <p>© 2024 Kost Reservation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email template untuk payment success
const paymentSuccessEmail = (payment, booking) => {
  const ownerPhone = booking.kost?.owner?.phone || '-';
  const ownerName = booking.kost?.owner?.name || 'Pemilik Kost';
  const ownerEmail = booking.kost?.owner?.email || '';
  
  // Format nomor WhatsApp (hapus karakter non-digit)
  const whatsappNumber = ownerPhone.replace(/\D/g, '');
  // Tambahkan 62 jika nomor dimulai dengan 0
  const formattedWhatsapp = whatsappNumber.startsWith('0') 
    ? '62' + whatsappNumber.substring(1) 
    : whatsappNumber;
  
  const whatsappLink = `https://wa.me/${formattedWhatsapp}?text=Halo%20${encodeURIComponent(ownerName)}%2C%20saya%20${encodeURIComponent(booking.guest_name)}%20dengan%20kode%20booking%20${booking.booking_code}%20untuk%20kost%20${encodeURIComponent(booking.kost.name)}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 650px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .success-badge { background: #10b981; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; margin: 15px 0 0 0; font-size: 14px; font-weight: bold; }
        .content { padding: 30px 25px; background: white; }
        .invoice-box { border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; background: #f8f9ff; }
        .invoice-header { text-align: center; padding-bottom: 15px; border-bottom: 2px solid #667eea; margin-bottom: 15px; }
        .invoice-header h2 { margin: 0; color: #667eea; font-size: 24px; }
        .invoice-header p { margin: 5px 0; color: #666; font-size: 12px; }
        .detail-section { margin: 20px 0; }
        .detail-section h3 { color: #667eea; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #666; font-size: 14px; }
        .detail-value { font-weight: 600; color: #333; text-align: right; }
        .total-row { background: #667eea; color: white; padding: 15px; border-radius: 8px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; }
        .total-label { font-size: 16px; font-weight: bold; }
        .total-amount { font-size: 24px; font-weight: bold; }
        .contact-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px; }
        .contact-box h3 { margin-top: 0; color: #856404; display: flex; align-items: center; }
        .contact-info { margin: 15px 0; }
        .contact-row { display: flex; align-items: center; margin: 10px 0; font-size: 14px; }
        .contact-icon { width: 30px; font-size: 18px; }
        .button-group { text-align: center; margin: 25px 0; }
        .button { display: inline-block; padding: 14px 30px; margin: 5px; background: #667eea; color: white !important; text-decoration: none; border-radius: 25px; font-weight: bold; transition: background 0.3s; }
        .button:hover { background: #5568d3; }
        .button-whatsapp { background: #25D366; }
        .button-whatsapp:hover { background: #20bc59; }
        .button-secondary { background: #6c757d; }
        .button-secondary:hover { background: #5a6268; }
        .important-notes { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .important-notes h4 { margin-top: 0; color: #1976D2; }
        .important-notes ul { margin: 10px 0; padding-left: 20px; }
        .important-notes li { margin: 5px 0; color: #555; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f9f9f9; border-radius: 0 0 10px 10px; margin-top: 20px; }
        .divider { height: 1px; background: #ddd; margin: 25px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Pembayaran Berhasil!</h1>
          <div class="success-badge">✅ PAYMENT CONFIRMED</div>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 10px;">Halo <strong>${booking.guest_name}</strong>,</p>
          <p style="color: #666;">Pembayaran Anda telah berhasil diproses! Berikut adalah invoice dan detail booking Anda.</p>
          
          <!-- INVOICE BOX -->
          <div class="invoice-box">
            <div class="invoice-header">
              <h2>📄 INVOICE</h2>
              <p>Order ID: <strong>${payment.order_id}</strong></p>
              <p>Tanggal: ${new Date(payment.transaction_time || payment.created_at).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <!-- Payment Details -->
            <div class="detail-section">
              <h3>💳 Informasi Pembayaran</h3>
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${payment.transaction_id || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Metode Pembayaran</span>
                <span class="detail-value">${payment.payment_type || 'Midtrans'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status Pembayaran</span>
                <span class="detail-value" style="color: #10b981;">✅ SUCCESS</span>
              </div>
            </div>

            <!-- Booking Details -->
            <div class="detail-section">
              <h3>📋 Detail Booking</h3>
              <div class="detail-row">
                <span class="detail-label">Kode Booking</span>
                <span class="detail-value">${booking.booking_code}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Nama Kost</span>
                <span class="detail-value">${booking.kost.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Alamat</span>
                <span class="detail-value">${booking.kost.address || ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Kota</span>
                <span class="detail-value">${booking.kost.city || ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Check-in</span>
                <span class="detail-value">${new Date(booking.check_in_date).toLocaleDateString('id-ID')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Check-out</span>
                <span class="detail-value">${new Date(booking.check_out_date).toLocaleDateString('id-ID')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Durasi Sewa</span>
                <span class="detail-value">${booking.duration_months} Bulan</span>
              </div>
            </div>

            <!-- Total Payment -->
            <div class="total-row">
              <span class="total-label">TOTAL PEMBAYARAN</span>
              <span class="total-amount">Rp ${Number(payment.amount).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <!-- Contact Owner Box -->
          <div class="contact-box">
            <h3>📞 Hubungi Pemilik Kost</h3>
            <p style="margin: 10px 0; color: #856404;">Silakan hubungi pemilik kost untuk koordinasi check-in dan informasi lebih lanjut:</p>
            
            <div class="contact-info">
              <div class="contact-row">
                <span class="contact-icon">👤</span>
                <strong>${ownerName}</strong>
              </div>
              <div class="contact-row">
                <span class="contact-icon">📱</span>
                <a href="tel:${ownerPhone}" style="color: #856404; text-decoration: none;">${ownerPhone}</a>
              </div>
              ${ownerEmail ? `
              <div class="contact-row">
                <span class="contact-icon">📧</span>
                <a href="mailto:${ownerEmail}" style="color: #856404; text-decoration: none;">${ownerEmail}</a>
              </div>
              ` : ''}
            </div>

            <div class="button-group">
              <a href="${whatsappLink}" class="button button-whatsapp" target="_blank">
                💬 Chat via WhatsApp
              </a>
              <a href="tel:${ownerPhone}" class="button button-secondary">
                📞 Telepon Langsung
              </a>
            </div>
          </div>

          <!-- Important Notes -->
          <div class="important-notes">
            <h4>⚠️ Catatan Penting</h4>
            <ul>
              <li>Simpan invoice ini sebagai bukti pembayaran Anda</li>
              <li>Harap tiba sesuai waktu check-in yang telah ditentukan</li>
              <li>Bawa identitas resmi (KTP/SIM/Kartu Pelajar) saat check-in</li>
              <li>Hubungi pemilik kost <strong>minimal 1 hari sebelum check-in</strong> untuk konfirmasi</li>
              <li>Tunjukkan email ini atau kode booking saat check-in</li>
              <li>Pastikan melakukan pembayaran deposit (jika ada) sesuai ketentuan pemilik</li>
            </ul>
          </div>

          <div class="divider"></div>

          <!-- Action Buttons -->
          <div class="button-group">
            <a href="${process.env.FRONTEND_URL}/my-reservations" class="button">
              📋 Lihat Semua Booking
            </a>
          </div>

          <p style="text-align: center; color: #666; margin-top: 20px;">
            Terima kasih telah menggunakan layanan kami! 🎉
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Kost Reservation</strong></p>
          <p>Email ini dikirim otomatis oleh sistem.</p>
          <p>Jika ada pertanyaan, silakan hubungi customer service kami.</p>
          <p style="margin-top: 15px;">© 2024 Kost Reservation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email template untuk booking cancellation
const bookingCancellationEmail = (booking) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
        .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; width: 150px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Booking Dibatalkan</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${booking.guest_name}</strong>,</p>
          <p>Booking Anda telah dibatalkan.</p>
          
          <div class="booking-details">
            <h3>📋 Detail Booking</h3>
            <div class="detail-row">
              <span class="detail-label">Kode Booking:</span>
              <span>${booking.booking_code}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Nama Kost:</span>
              <span>${booking.kost.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span><strong style="color: #f44336;">CANCELLED</strong></span>
            </div>
            ${booking.cancellation_reason ? `
            <div class="detail-row">
              <span class="detail-label">Alasan:</span>
              <span>${booking.cancellation_reason}</span>
            </div>
            ` : ''}
          </div>

          <p>Jika Anda sudah melakukan pembayaran, dana akan dikembalikan dalam 3-7 hari kerja.</p>
          <p>Silakan hubungi customer service jika ada pertanyaan.</p>
        </div>
        <div class="footer">
          <p>Email ini dikirim otomatis oleh sistem Kost Reservation</p>
          <p>© 2024 Kost Reservation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking) => {
  try {
    const subject = `Booking Confirmed - ${booking.booking_code}`;
    const html = bookingConfirmationEmail(booking);
    
    await sendEmail(booking.guest_email, subject, html);
    console.log(`✅ Booking confirmation email sent to ${booking.guest_email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    return { success: false, error };
  }
};

// Send payment success email
const sendPaymentSuccess = async (payment, booking) => {
  try {
    const subject = `Payment Success - ${payment.order_id}`;
    const html = paymentSuccessEmail(payment, booking);
    
    await sendEmail(booking.guest_email, subject, html);
    console.log(`✅ Payment success email sent to ${booking.guest_email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending payment success email:', error);
    return { success: false, error };
  }
};

// Send booking cancellation email
const sendBookingCancellation = async (booking) => {
  try {
    const subject = `Booking Cancelled - ${booking.booking_code}`;
    const html = bookingCancellationEmail(booking);
    
    await sendEmail(booking.guest_email, subject, html);
    console.log(`✅ Booking cancellation email sent to ${booking.guest_email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending booking cancellation email:', error);
    return { success: false, error };
  }
};

module.exports = {
  sendBookingConfirmation,
  sendPaymentSuccess,
  sendBookingCancellation
};
