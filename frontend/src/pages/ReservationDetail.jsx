import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '../components/ui';
import { 
  Calendar, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Home,
  CreditCard,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

function ReservationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookingDetail();
  }, [id, user]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/bookings/${id}`);
      setBooking(data.data);
    } catch (error) {
      console.error('Fetch booking error:', error);
      setError('Gagal memuat detail reservasi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      alert('Mohon berikan alasan pembatalan');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin membatalkan reservasi ini?')) {
      return;
    }

    try {
      setCancelling(true);
      await api.patch(`/bookings/${id}/cancel`, {
        cancellation_reason: cancelReason
      });
      alert('Reservasi berhasil dibatalkan');
      setShowCancelModal(false);
      fetchBookingDetail(); // Refresh data
    } catch (error) {
      console.error('Cancel booking error:', error);
      alert(error.response?.data?.message || 'Gagal membatalkan reservasi');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: <AlertCircle className="h-5 w-5" />,
        text: 'Menunggu Pembayaran',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        bgClass: 'bg-yellow-50'
      },
      confirmed: {
        icon: <CheckCircle className="h-5 w-5" />,
        text: 'Terkonfirmasi',
        className: 'bg-green-100 text-green-700 border-green-200',
        bgClass: 'bg-green-50'
      },
      checked_in: {
        icon: <CheckCircle className="h-5 w-5" />,
        text: 'Sudah Check-in',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        bgClass: 'bg-blue-50'
      },
      checked_out: {
        icon: <CheckCircle className="h-5 w-5" />,
        text: 'Sudah Check-out',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        bgClass: 'bg-gray-50'
      },
      cancelled: {
        icon: <XCircle className="h-5 w-5" />,
        text: 'Dibatalkan',
        className: 'bg-red-100 text-red-700 border-red-200',
        bgClass: 'bg-red-50'
      }
    };

    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat detail reservasi...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Reservasi Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/reservations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Reservasi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const canCancel = ['pending', 'confirmed'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/reservations')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detail Reservasi</h1>
              <p className="text-gray-600 mt-1">Kode Booking: <span className="font-semibold text-gray-900">{booking.booking_code}</span></p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.className}`}>
              {statusConfig.icon}
              <span className="font-medium">{statusConfig.text}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6">
          {/* Kost Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Informasi Kost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {booking.kost?.primary_image && (
                  <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={booking.kost.primary_image} 
                      alt={booking.kost.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.kost?.name}</h3>
                  <div className="flex items-start gap-2 text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{booking.kost?.address}, {booking.kost?.city}</span>
                  </div>
                  {booking.kost?.description && (
                    <p className="text-sm text-gray-600">{booking.kost.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detail Pemesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Check-in</p>
                  <p className="text-lg font-semibold">{moment(booking.check_in_date).format('DD MMMM YYYY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Check-out</p>
                  <p className="text-lg font-semibold">{moment(booking.check_out_date).format('DD MMMM YYYY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Durasi</p>
                  <p className="text-lg font-semibold">
                    {booking.duration} {booking.duration_type === 'monthly' ? 'bulan' : booking.duration_type === 'weekly' ? 'minggu' : 'tahun'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(booking.total_price)}</p>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Catatan:</p>
                  <p className="text-gray-900">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Data Penyewa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nama Lengkap</p>
                    <p className="font-medium">{booking.guest_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nomor Telepon</p>
                    <p className="font-medium">{booking.guest_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{booking.guest_email}</p>
                  </div>
                </div>
                {booking.guest_id_card && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nomor KTP</p>
                      <p className="font-medium">{booking.guest_id_card}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Reason if cancelled */}
          {booking.status === 'cancelled' && booking.cancellation_reason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Alasan Pembatalan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{booking.cancellation_reason}</p>
                {booking.cancelled_at && (
                  <p className="text-sm text-gray-500 mt-2">
                    Dibatalkan pada: {moment(booking.cancelled_at).format('DD MMMM YYYY, HH:mm')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {booking.status === 'pending' && (
              <Button 
                onClick={() => navigate(`/payment/${booking.id}`)}
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Bayar Sekarang
              </Button>
            )}
            {canCancel && (
              <Button 
                variant="destructive" 
                onClick={() => setShowCancelModal(true)}
                size="lg"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Batalkan Reservasi
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Batalkan Reservasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Apakah Anda yakin ingin membatalkan reservasi ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Pembatalan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Masukkan alasan pembatalan..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={cancelling}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  disabled={cancelling}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelBooking}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membatalkan...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Batalkan Reservasi
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ReservationDetail;
