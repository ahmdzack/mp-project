import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button, Card, CardContent } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { CheckCircle, XCircle, Clock, Home, FileText, Loader2 } from 'lucide-react';

function PaymentCallback() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  // Get transaction details from URL params
  const orderId = searchParams.get('order_id');
  const statusCode = searchParams.get('status_code');
  const transactionStatus = searchParams.get('transaction_status');

  console.log('🔍 PaymentCallback Debug:', {
    bookingId,
    orderId,
    statusCode,
    transactionStatus,
    pathname: location.pathname,
    paymentData: payment
  });

  // Get status from URL path or transaction_status
  const pathname = location.pathname;
  
  // Determine payment status
  const getPaymentStatus = () => {
    // Priority: use payment data from backend if available
    if (payment && payment.status) {
      console.log('✅ Using status from backend payment:', payment.status);
      return payment.status === 'success' ? 'success' : 
             payment.status === 'pending' ? 'pending' : 'error';
    }
    
    // Otherwise use URL params
    if (transactionStatus) {
      // From Midtrans callback
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        console.log('✅ Using status from URL transaction_status:', transactionStatus, '→ success');
        return 'success';
      } else if (transactionStatus === 'pending') {
        console.log('✅ Using status from URL transaction_status:', transactionStatus, '→ pending');
        return 'pending';
      } else if (transactionStatus === 'deny' || transactionStatus === 'expire' || transactionStatus === 'cancel') {
        console.log('✅ Using status from URL transaction_status:', transactionStatus, '→ error');
        return 'error';
      }
    }
    
    // Fallback to path
    if (pathname.includes('/success')) {
      console.log('✅ Using status from URL path: success');
      return 'success';
    } else if (pathname.includes('/error')) {
      console.log('✅ Using status from URL path: error');
      return 'error';
    } else if (pathname.includes('/pending')) {
      console.log('✅ Using status from URL path: pending');
      return 'pending';
    }
    
    return 'pending';
  };

  const paymentStatus = getPaymentStatus();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    console.log('🚀 Starting payment callback flow...');
    
    // Wait a bit for webhook to process
    setTimeout(() => {
      fetchBookingAndPayment();
    }, 2000);
  }, [bookingId, user]);

  const fetchBookingAndPayment = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log(`📡 Fetching booking ${bookingId}... (attempt ${retryCount + 1})`);
      
      // Fetch booking details
      const bookingResponse = await api.get(`/bookings/${bookingId}`);
      console.log('✅ Booking fetched:', bookingResponse.data.data);
      setBooking(bookingResponse.data.data);

      // Fetch payment details
      try {
        const paymentResponse = await api.get(`/payments/booking/${bookingId}`);
        console.log('✅ Payment fetched:', paymentResponse.data.data);
        const paymentData = paymentResponse.data.data;
        setPayment(paymentData);
        
        // Jika ada orderId dan payment masih pending, check status ke Midtrans
        if (orderId && paymentData.status === 'pending') {
          console.log('⏳ Payment still pending, checking Midtrans status...');
          try {
            const statusResponse = await api.get(`/payments/${paymentData.order_id}/status`);
            console.log('✅ Midtrans status checked:', statusResponse.data);
            
            // Update payment state dengan data terbaru
            if (statusResponse.data.success) {
              setPayment(prev => ({
                ...prev,
                status: statusResponse.data.data.payment_status,
                transaction_status: statusResponse.data.data.transaction_status
              }));
              
              // Update booking status juga
              setBooking(prev => ({
                ...prev,
                status: statusResponse.data.data.booking_status
              }));
              
              console.log('✅ Payment and booking updated from Midtrans');
            }
          } catch (statusErr) {
            console.log('⚠️ Could not check Midtrans status:', statusErr.response?.status);
          }
        }
      } catch (err) {
        console.log('⏳ Payment not found yet, might still be processing', err.response?.status);
        
        // Retry up to 3 times if payment not found (webhook might be slow)
        if (retryCount < 3 && err.response?.status === 404) {
          console.log(`🔄 Retrying in 2 seconds... (${retryCount + 1}/3)`);
          setTimeout(() => {
            fetchBookingAndPayment(retryCount + 1);
          }, 2000);
          return; // Don't set loading to false yet
        }
      }
      
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      if (retryCount >= 3) {
        console.log('⚠️ Max retries reached, showing current data');
      }
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-16 w-16 text-yellow-600" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Pembayaran Berhasil!';
      case 'error':
        return 'Pembayaran Gagal';
      case 'pending':
      default:
        return 'Menunggu Pembayaran';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Terima kasih! Pembayaran Anda telah berhasil diproses. Booking Anda sedang menunggu konfirmasi dari pemilik kost.';
      case 'error':
        return 'Maaf, pembayaran Anda gagal diproses. Silakan coba lagi atau hubungi customer service.';
      case 'pending':
      default:
        return 'Pembayaran Anda sedang diproses. Kami akan memberitahu Anda setelah pembayaran dikonfirmasi.';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Card className={`border-2 ${getStatusColor()}`}>
          <CardContent className="p-8">
            {/* Status Icon & Title */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {getStatusIcon()}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {getStatusTitle()}
              </h1>
              <p className="text-gray-600">
                {getStatusMessage()}
              </p>
            </div>

            {/* Booking Details */}
            {booking && (
              <div className="mt-6 space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Detail Booking</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Kode Booking</p>
                    <p className="font-semibold">{booking.booking_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status Booking</p>
                    <p className="font-semibold capitalize">{booking.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Check-in</p>
                    <p className="font-semibold">
                      {new Date(booking.check_in_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Durasi</p>
                    <p className="font-semibold">{booking.duration_months} bulan</p>
                  </div>
                </div>

                {booking.kost && (
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Nama Kost</p>
                    <p className="font-semibold">{booking.kost.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{booking.kost.address}</p>
                  </div>
                )}

                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(booking.total_price)}
                  </p>
                </div>

                {payment && (
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <p className="text-gray-500 text-sm mb-1">Status Pembayaran</p>
                    <p className="font-semibold capitalize">{payment.status}</p>
                    {payment.payment_method && (
                      <p className="text-sm text-gray-600 mt-1">
                        Via: {payment.payment_method}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/reservations')}
                className="flex-1"
                variant="default"
              >
                <FileText className="mr-2 h-4 w-4" />
                Lihat Reservasi Saya
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1"
                variant="outline"
              >
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </div>

            {paymentStatus === 'error' && (
              <div className="mt-4">
                <Button
                  onClick={() => navigate(`/payment/${bookingId}`)}
                  className="w-full"
                  variant="default"
                >
                  Coba Bayar Lagi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PaymentCallback;
