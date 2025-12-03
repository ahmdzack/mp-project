import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, AlertDescription } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { CreditCard, Calendar, Clock, CheckCircle2, Loader2, ArrowLeft, AlertCircle, Building2, Wallet, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

function Payment() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookingDetails();
    fetchPaymentStatus();
  }, [bookingId, user]);

  const fetchBookingDetails = async () => {
    try {
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data.data);
    } catch (err) {
      setError('Gagal memuat detail booking');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const { data } = await api.get(`/payments/booking/${bookingId}`);
      setPayment(data.data);
    } catch (err) {
      console.log('Payment not found yet');
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    setError('');

    try {
      // Create payment and get snap token
      const { data } = await api.post('/payments', {
        booking_id: parseInt(bookingId)
      });

      const snapToken = data.data.snap_token;

      // Load Midtrans Snap
      window.snap.pay(snapToken, {
        onSuccess: function(result) {
          console.log('✅ Payment success:', result);
          // Redirect to payment callback success page
          navigate(`/bookings/${bookingId}/payment/success?order_id=${result.order_id}&status_code=${result.status_code}&transaction_status=settlement`);
        },
        onPending: function(result) {
          console.log('⏳ Payment pending:', result);
          // Redirect to pending page
          navigate(`/bookings/${bookingId}/payment/pending?order_id=${result.order_id}&status_code=${result.status_code}&transaction_status=pending`);
        },
        onError: function(result) {
          console.log('❌ Payment error:', result);
          // Redirect to error page
          navigate(`/bookings/${bookingId}/payment/error?order_id=${result.order_id || ''}&status_code=${result.status_code || ''}&transaction_status=failed`);
        },
        onClose: function() {
          console.log('🔒 Payment popup closed');
          setProcessingPayment(false);
          // Don't redirect on close - user might want to retry
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses pembayaran');
      setProcessingPayment(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusMap = {
      pending: { 
        text: 'Menunggu Pembayaran', 
        variant: 'default',
        icon: Clock,
        color: 'text-yellow-600'
      },
      settlement: { 
        text: 'Pembayaran Berhasil', 
        variant: 'default',
        icon: CheckCircle2,
        color: 'text-green-600'
      },
      confirmed: { 
        text: 'Terkonfirmasi', 
        variant: 'default',
        icon: CheckCircle2,
        color: 'text-green-600'
      },
      cancel: { 
        text: 'Dibatalkan', 
        variant: 'destructive',
        icon: AlertCircle,
        color: 'text-red-600'
      },
      expire: { 
        text: 'Expired', 
        variant: 'destructive',
        icon: AlertCircle,
        color: 'text-red-600'
      }
    };
    return statusMap[status] || { 
      text: status, 
      variant: 'secondary',
      icon: AlertCircle,
      color: 'text-muted-foreground'
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Booking tidak ditemukan</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = payment ? getStatusConfig(payment.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/my-bookings')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pembayaran Booking
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detail Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Kode Booking</p>
                  <p className="font-mono font-semibold">{booking.booking_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama Kost</p>
                  <p className="font-semibold">{booking.kost?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Check-in
                  </p>
                  <p className="font-medium">
                    {format(new Date(booking.check_in_date), 'dd MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Check-out
                  </p>
                  <p className="font-medium">
                    {format(new Date(booking.check_out_date), 'dd MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durasi</p>
                  <p className="font-medium">{booking.duration_months} bulan</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Harga</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(booking.total_price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Status */}
          {payment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {StatusIcon && <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />}
                  <div>
                    <Badge variant={statusConfig.variant} className="text-sm">
                      {statusConfig.text}
                    </Badge>
                    {payment.payment_type && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Metode: {payment.payment_type}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Actions */}
          {(!payment || payment.status === 'pending') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <p className="text-sm font-medium mb-3">Pilih metode pembayaran yang tersedia:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Bank Transfer (BCA, Mandiri, BNI, BRI, Permata)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Kartu Kredit/Debit (Visa, Mastercard)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>E-Wallet (GoPay, ShopeePay)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span>QRIS</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={processingPayment}
                >
                  {processingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  {processingPayment ? 'Memproses...' : 'Bayar Sekarang'}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  🔒 Pembayaran aman dengan Midtrans
                </p>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {payment?.status === 'settlement' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Pembayaran Berhasil!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Terima kasih. Booking Anda telah dikonfirmasi.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/my-bookings')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Lihat Booking Saya
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Payment;
