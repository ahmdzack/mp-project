import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button } from '../components/ui';
import { 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  CreditCard,
  Filter,
  Search
} from 'lucide-react';

function OwnerBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/owner/my-bookings');
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    if (!confirm('Terima booking ini?')) return;
    
    try {
      setProcessingId(bookingId);
      await api.patch(`/bookings/${bookingId}/confirm`);
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'confirmed' }
          : booking
      ));
      
      alert('Booking berhasil diterima!');
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert(error.response?.data?.message || 'Gagal menerima booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt('Alasan penolakan (opsional):');
    if (reason === null) return; // User clicked cancel
    
    try {
      setProcessingId(bookingId);
      await api.patch(`/bookings/${bookingId}/reject`, { reason });
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'rejected' }
          : booking
      ));
      
      alert('Booking berhasil ditolak');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert(error.response?.data?.message || 'Gagal menolak booking');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: AlertCircle,
        label: 'Menunggu'
      },
      confirmed: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircle,
        label: 'Dikonfirmasi'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Ditolak'
      },
      cancelled: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: XCircle,
        label: 'Dibatalkan'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filter !== 'all' && booking.status !== filter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.user?.name?.toLowerCase().includes(query) ||
        booking.user?.email?.toLowerCase().includes(query) ||
        booking.kost?.name?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat data booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Booking</h1>
          <p className="text-muted-foreground">Lihat dan kelola semua booking untuk properti kost Anda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-muted-foreground mb-1">Total Booking</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-muted-foreground mb-1">Menunggu</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-muted-foreground mb-1">Dikonfirmasi</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-muted-foreground mb-1">Ditolak</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, email, atau kost..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="text-sm"
              >
                Semua
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                className="text-sm"
              >
                Menunggu
              </Button>
              <Button
                variant={filter === 'confirmed' ? 'default' : 'outline'}
                onClick={() => setFilter('confirmed')}
                className="text-sm"
              >
                Dikonfirmasi
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilter('rejected')}
                className="text-sm"
              >
                Ditolak
              </Button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">Tidak Ada Booking</p>
            <p className="text-sm text-muted-foreground">
              {filter !== 'all' 
                ? `Tidak ada booking dengan status "${filter}"`
                : 'Belum ada yang booking kost Anda'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Kost Info */}
                  <div className="flex gap-4 flex-1">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {booking.kost?.primary_image ? (
                        <img 
                          src={booking.kost.primary_image} 
                          alt={booking.kost.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{booking.kost?.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {booking.kost?.city}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Check-in: {new Date(booking.check_in_date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Durasi: {booking.duration_months} bulan</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span className="font-semibold text-gray-900">
                            Rp {(booking.total_price || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden lg:block w-px bg-gray-200"></div>

                  {/* User Info & Actions */}
                  <div className="lg:w-80">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Penyewa:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-gray-900">{booking.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{booking.user?.email}</span>
                        </div>
                        {booking.user?.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{booking.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptBooking(booking.id)}
                          disabled={processingId === booking.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Terima
                        </Button>
                        <Button
                          onClick={() => handleRejectBooking(booking.id)}
                          disabled={processingId === booking.id}
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Tolak
                        </Button>
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-green-700">Booking Dikonfirmasi</p>
                      </div>
                    )}

                    {booking.status === 'rejected' && (
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-red-700">Booking Ditolak</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerBookings;
