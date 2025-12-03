import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button, Card, CardContent, Badge } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import {
  Clock,
  Check,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Loader2,
  Filter,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  ClockIcon,
  CreditCard,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

function BookingConfirmation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingRefs = useRef({});

  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);

  // Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user?.role !== 'pemilik') {
      navigate('/');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  useEffect(() => {
    // Jika ada bookingId dari state, scroll ke booking tersebut
    if (location.state?.bookingId && bookings.length > 0) {
      const bookingId = location.state.bookingId;
      setHighlightedBookingId(bookingId);
      
      setTimeout(() => {
        const element = bookingRefs.current[bookingId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Hilangkan highlight setelah 3 detik
      setTimeout(() => {
        setHighlightedBookingId(null);
      }, 3000);
    }
  }, [location.state, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      // Ambil semua booking tanpa filter
      const { data } = await api.get('/bookings/owner/my-bookings');
      console.log('📦 Bookings data:', data.data);
      console.log('💳 Payment info:', data.data.map(b => ({
        id: b.id,
        code: b.booking_code,
        payment: b.payment
      })));
      setBookings(data.data || []);
      setSummary(data.summary || {});
    } catch (err) {
      setError('Gagal memuat data booking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    if (!window.confirm('Apakah Anda yakin ingin mengkonfirmasi booking ini?')) {
      return;
    }

    try {
      setActionLoading(bookingId);
      await api.patch(`/bookings/${bookingId}/confirm`);
      alert('Booking berhasil dikonfirmasi!');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengkonfirmasi booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Mohon berikan alasan penolakan');
      return;
    }

    try {
      setActionLoading(rejectBookingId);
      await api.patch(`/bookings/${rejectBookingId}/reject`, {
        rejection_reason: rejectionReason
      });
      alert('Booking berhasil ditolak');
      setShowRejectModal(false);
      setRejectBookingId(null);
      setRejectionReason('');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak booking');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (bookingId) => {
    setRejectBookingId(bookingId);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectBookingId(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'default', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
      confirmed: { label: 'Dikonfirmasi', variant: 'default', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      checked_in: { label: 'Check In', variant: 'default', className: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      checked_out: { label: 'Check Out', variant: 'default', className: 'bg-gray-100 text-gray-700', icon: CheckCircle },
      cancelled: { label: 'Dibatalkan', variant: 'destructive', className: 'bg-red-100 text-red-700', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === selectedStatus);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat data booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Konfirmasi Booking</h1>
          <p className="mt-2 text-muted-foreground">
            Kelola booking masuk untuk kost Anda
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === 'all' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
            onClick={() => setSelectedStatus('all')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{summary.total || 0}</p>
                </div>
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === 'pending' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedStatus('pending')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Menunggu</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === 'confirmed' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedStatus('confirmed')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dikonfirmasi</p>
                  <p className="text-2xl font-bold text-green-600">{summary.confirmed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === 'checked_in' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedStatus('checked_in')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check In</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.checked_in || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === 'cancelled' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedStatus('cancelled')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dibatalkan</p>
                  <p className="text-2xl font-bold text-red-600">{summary.cancelled || 0}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {selectedStatus === 'all' 
                ? 'Belum ada booking masuk' 
                : `Tidak ada booking dengan status ${selectedStatus}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card 
                key={booking.id} 
                ref={(el) => bookingRefs.current[booking.id] = el}
                className={`overflow-hidden transition-all ${
                  highlightedBookingId === booking.id 
                    ? 'ring-4 ring-blue-500 shadow-xl' 
                    : ''
                }`}
              >
                <div className="grid md:grid-cols-[200px_1fr] gap-0">
                  {/* Kost Image */}
                  <div className="relative aspect-[4/3] md:aspect-auto bg-muted">
                    {booking.kost?.images?.[0]?.image_url ? (
                      <img 
                        src={booking.kost.images[0].image_url} 
                        alt={booking.kost.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Home className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{booking.kost?.name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {booking.kost?.address}, {booking.kost?.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Kode Booking</p>
                        <p className="text-lg font-bold text-primary">{booking.booking_code}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* Guest Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground">Informasi Tamu</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.guest_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.guest_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.guest_email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground">Detail Booking</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Check In: {moment(booking.check_in_date).format('DD MMM YYYY')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Check Out: {moment(booking.check_out_date).format('DD MMM YYYY')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ClockIcon className="h-4 w-4 text-muted-foreground" />
                            <span>Durasi: {booking.duration} {booking.duration_type === 'monthly' ? 'bulan' : booking.duration_type === 'weekly' ? 'minggu' : 'tahun'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <span>Total:</span>
                            <span className="text-primary">{formatCurrency(booking.total_price)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Catatan:</p>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    )}

                    {/* Payment Status */}
                    <div className={`mb-4 p-4 rounded-lg border-2 ${
                      booking.payment?.status === 'success' 
                        ? 'bg-green-50 border-green-300' 
                        : booking.payment?.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-red-50 border-red-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        {booking.payment?.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : booking.payment?.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-4 w-4" />
                            <p className="font-semibold text-sm">Status Pembayaran</p>
                          </div>
                          
                          {booking.payment?.status === 'success' ? (
                            <>
                              <p className="text-sm text-green-700 font-medium mb-1">✓ Pembayaran Berhasil</p>
                              <div className="text-xs text-green-600 space-y-0.5">
                                {booking.payment.payment_method && (
                                  <p>Metode: {booking.payment.payment_method} ({booking.payment.payment_type})</p>
                                )}
                                {booking.payment.settlement_time && (
                                  <p>Waktu: {moment(booking.payment.settlement_time).format('DD MMM YYYY, HH:mm')}</p>
                                )}
                              </div>
                            </>
                          ) : booking.payment?.status === 'pending' ? (
                            <>
                              <p className="text-sm text-yellow-700 font-medium mb-1">⏳ Menunggu Pembayaran</p>
                              <p className="text-xs text-yellow-600">
                                Tamu belum menyelesaikan pembayaran. Booking akan otomatis dibatalkan jika tidak dibayar dalam 24 jam.
                              </p>
                            </>
                          ) : !booking.payment ? (
                            <>
                              <p className="text-sm text-orange-700 font-medium mb-1">⚠️ Belum Ada Pembayaran</p>
                              <p className="text-xs text-orange-600">
                                Tamu belum melakukan pembayaran untuk booking ini. Silakan hubungi tamu untuk menyelesaikan pembayaran.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-red-700 font-medium mb-1">✗ Pembayaran Gagal/Kadaluarsa</p>
                              <p className="text-xs text-red-600">
                                Pembayaran gagal atau kadaluarsa. Tamu perlu melakukan booking ulang.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Reason */}
                    {booking.cancellation_reason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 mb-1">Alasan Pembatalan:</p>
                        <p className="text-sm text-red-700">{booking.cancellation_reason}</p>
                      </div>
                    )}

                    {/* Actions - Only show if payment is successful */}
                    {booking.status === 'pending' && (
                      <div className="pt-4 border-t">
                        {booking.payment?.status === 'success' ? (
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => handleConfirm(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Konfirmasi
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => openRejectModal(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Tolak
                            </Button>
                            <div className="ml-auto text-xs text-muted-foreground">
                              Dibuat {moment(booking.created_at).fromNow()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <div className="text-sm text-yellow-700">
                              <span className="font-semibold">Menunggu Pembayaran</span>
                              <p className="text-xs mt-0.5">
                                Anda dapat mengkonfirmasi atau menolak booking setelah tamu menyelesaikan pembayaran.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-green-600">
                            ✓ Dikonfirmasi {booking.confirmed_at ? moment(booking.confirmed_at).fromNow() : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Dibuat {moment(booking.created_at).fromNow()}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Tolak Booking</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mohon berikan alasan penolakan booking ini:
            </p>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Contoh: Kamar sudah terisi, Tanggal tidak tersedia, dll."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={closeRejectModal}
                disabled={actionLoading === rejectBookingId}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading === rejectBookingId || !rejectionReason.trim()}
                className="flex items-center gap-2"
              >
                {actionLoading === rejectBookingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Tolak Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingConfirmation;
