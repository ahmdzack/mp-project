import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

function MyReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'pencari') {
      navigate('/');
      return;
    }
    fetchMyReservations();
  }, [user, navigate]);

  useEffect(() => {
    filterBookings();
  }, [statusFilter, bookings]);

  const fetchMyReservations = async () => {
    try {
      const { data } = await api.get('/bookings');
      const myBookings = data.data || [];
      setBookings(myBookings);
      setFilteredBookings(myBookings);
    } catch (error) {
      console.error('Fetch bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === statusFilter));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Menunggu Pembayaran',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      confirmed: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Terkonfirmasi',
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      cancelled: {
        icon: <XCircle className="h-4 w-4" />,
        text: 'Dibatalkan',
        className: 'bg-red-100 text-red-700 border-red-200'
      },
      completed: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Selesai',
        className: 'bg-blue-100 text-blue-700 border-blue-200'
      }
    };

    const badge = badges[status] || badges.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${badge.className}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </div>
    );
  };

  const getDurationText = (booking) => {
    const types = {
      weekly: 'minggu',
      monthly: 'bulan',
      yearly: 'tahun'
    };
    return `${booking.duration} ${types[booking.duration_type] || 'bulan'}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reservasi Saya</h1>
          <p className="text-gray-600 mt-1">Kelola semua reservasi kost Anda</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            Semua ({bookings.length})
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
            size="sm"
          >
            Pending ({bookings.filter(b => b.status === 'pending').length})
          </Button>
          <Button
            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('confirmed')}
            size="sm"
          >
            Terkonfirmasi ({bookings.filter(b => b.status === 'confirmed').length})
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
            size="sm"
          >
            Selesai ({bookings.filter(b => b.status === 'completed').length})
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('cancelled')}
            size="sm"
          >
            Dibatalkan ({bookings.filter(b => b.status === 'cancelled').length})
          </Button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? 'Belum ada reservasi' : `Tidak ada reservasi ${statusFilter}`}
              </h3>
              <p className="text-gray-600 mb-6">
                Mulai cari kost impian Anda sekarang
              </p>
              <Button onClick={() => navigate('/kost')}>
                <Search className="h-4 w-4 mr-2" />
                Cari Kost
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Kost Image */}
                    <div className="lg:w-48 h-48 lg:h-auto">
                      <img
                        src={booking.kost?.primary_image || 'https://via.placeholder.com/200'}
                        alt={booking.kost?.name || 'Kost'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {booking.kost?.name || 'Kost'}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm gap-1 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span>{booking.kost?.address || 'Alamat tidak tersedia'}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Kode Booking: <span className="font-semibold text-gray-900">{booking.booking_code}</span>
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check-in</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {new Date(booking.check_in_date).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check-out</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {new Date(booking.check_out_date).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Durasi</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{getDurationText(booking)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Guest Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-xs text-gray-500 mb-2">Data Penyewa</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p><span className="text-gray-600">Nama:</span> <span className="font-medium">{booking.guest_name}</span></p>
                          <p><span className="text-gray-600">Email:</span> <span className="font-medium">{booking.guest_email}</span></p>
                          <p><span className="text-gray-600">Telepon:</span> <span className="font-medium">{booking.guest_phone}</span></p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Pembayaran</p>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(booking.total_price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/reservation/${booking.id}`)}
                          >
                            Detail
                          </Button>
                          {booking.status === 'pending' && (
                            <Button onClick={() => navigate(`/payment/${booking.id}`)}>
                              Bayar Sekarang
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReservations;
