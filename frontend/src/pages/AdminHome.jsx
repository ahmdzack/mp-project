import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button } from '../components/ui';
import { 
  Shield,
  Users, 
  Building2, 
  Calendar,
  TrendingUp,
  MapPin,
  Activity,
  DollarSign,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  ArrowRight
} from 'lucide-react';

function AdminHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalKosts: 0,
    totalReservations: 0,
    totalRevenue: 0,
    usersByRole: { pencari: 0, pemilik: 0 },
    kostsByCity: [],
    averagePrice: 0,
    availableRooms: 0,
    reservationStatus: {
      pending: 0,
      confirmed: 0,
      cancelled: 0
    }
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data
      const [usersRes, kostsRes, bookingsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/kost'),
        api.get('/bookings')
      ]);

      const users = usersRes.data.data || [];
      const kosts = kostsRes.data.data || [];
      const bookings = bookingsRes.data.data || [];

      // Calculate user statistics
      const usersByRole = users.reduce((acc, user) => {
        if (user.role === 'pencari') acc.pencari++;
        if (user.role === 'pemilik') acc.pemilik++;
        return acc;
      }, { pencari: 0, pemilik: 0 });

      // Calculate kost statistics by city
      const cityCount = kosts.reduce((acc, kost) => {
        const city = kost.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});

      const kostsByCity = Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Calculate average price and available rooms
      const totalPrice = kosts.reduce((sum, kost) => sum + (kost.price_monthly || 0), 0);
      const averagePrice = kosts.length > 0 ? Math.round(totalPrice / kosts.length) : 0;
      const availableRooms = kosts.reduce((sum, kost) => sum + (kost.available_rooms || 0), 0);

      // Calculate reservation status
      const reservationStatus = bookings.reduce((acc, booking) => {
        if (booking.status === 'pending') acc.pending++;
        if (booking.status === 'confirmed') acc.confirmed++;
        if (booking.status === 'cancelled' || booking.status === 'rejected') acc.cancelled++;
        return acc;
      }, { pending: 0, confirmed: 0, cancelled: 0 });

      // Get recent users (last 5)
      const sortedUsers = [...users].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 5);

      // Get recent reservations (last 5)
      const sortedReservations = [...bookings].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 5);

      setStats({
        totalUsers: users.length,
        totalKosts: kosts.length,
        totalReservations: bookings.length,
        totalRevenue: 0, // Calculate from actual payments when available
        usersByRole,
        kostsByCity,
        averagePrice,
        availableRooms,
        reservationStatus
      });

      setRecentUsers(sortedUsers);
      setRecentReservations(sortedReservations);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxCityCount = () => {
    return Math.max(...stats.kostsByCity.map(c => c.count), 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6" />
                <p className="text-sm opacity-90">Selamat Pagi, Admin</p>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Pusat Kontrol KostKu</h1>
              <p className="text-sm opacity-75">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-4">
              <div className="text-right">
                <p className="text-sm opacity-75 mb-1">Total Pendapatan</p>
                <p className="text-3xl font-bold">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75 mb-1">Tingkat Keberhasilan</p>
                <p className="text-3xl font-bold">
                  {stats.totalReservations > 0 
                    ? ((stats.reservationStatus.confirmed / stats.totalReservations) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pengguna */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Pengguna</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600 font-medium">{stats.usersByRole.pencari} pencari</span>
              {' • '}
              <span className="text-purple-600 font-medium">{stats.usersByRole.pemilik} pemilik</span>
            </p>
          </div>

          {/* Total Kost */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Kost</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalKosts}</p>
            <p className="text-xs text-muted-foreground">
              {stats.availableRooms} kamar tersedia
            </p>
          </div>

          {/* Total Reservasi */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Reservasi</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalReservations}</p>
            <p className="text-xs text-muted-foreground">
              {stats.reservationStatus.pending} menunggu
            </p>
          </div>

          {/* Rata-rata Harga */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Rata-rata Harga</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              Rp {stats.averagePrice.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground">per bulan</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Aksi Cepat Admin */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold">Aksi Cepat Admin</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Akses langsung ke fitur manajemen platform</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/dashboard/admin/users')}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Kelola Pengguna</p>
                    <p className="text-xs text-muted-foreground">{stats.totalUsers} pengguna terdaftar</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              </button>

              <button
                onClick={() => navigate('/dashboard/admin')}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Kelola Kost</p>
                    <p className="text-xs text-muted-foreground">{stats.totalKosts} kost aktif</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
              </button>

              <button
                onClick={() => navigate('/dashboard/admin/reservations')}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-3 rounded-lg group-hover:bg-yellow-200 transition-colors">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Kelola Reservasi</p>
                    <p className="text-xs text-muted-foreground">{stats.totalReservations} total reservasi</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-yellow-600" />
              </button>

              <button
                onClick={() => navigate('/dashboard/admin/analytics')}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Dashboard Analitik</p>
                    <p className="text-xs text-muted-foreground">Lihat laporan lengkap</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
              </button>
            </div>
          </div>

          {/* Status Reservasi */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold">Status Reservasi</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Ringkasan status booking platform</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">Menunggu</span>
                </div>
                <span className="text-xl font-bold text-yellow-600">{stats.reservationStatus.pending}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Sukses</span>
                </div>
                <span className="text-xl font-bold text-green-600">{stats.reservationStatus.confirmed}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">Dibatalkan/Ditolak</span>
                </div>
                <span className="text-xl font-bold text-red-600">{stats.reservationStatus.cancelled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribusi Kost per Kota */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold">Distribusi Kost per Kota</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Sebaran kost di berbagai kota</p>

            <div className="space-y-4">
              {stats.kostsByCity.map((item, index) => {
                const percentage = (item.count / getMaxCityCount()) * 100;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{item.city}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} kost ({Math.round((item.count / stats.totalKosts) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistik Cepat */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Statistik Cepat</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pemilik Aktif</span>
                <span className="text-sm font-bold text-gray-900">{stats.usersByRole.pemilik}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pencari Aktif</span>
                <span className="text-sm font-bold text-gray-900">{stats.usersByRole.pencari}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kamar Tersedia</span>
                <span className="text-sm font-bold text-gray-900">{stats.availableRooms}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Pengguna Terbaru */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Pengguna Terbaru</h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/admin/users')}
                className="text-sm"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {recentUsers.length} pengguna terakhir mendaftar
            </p>

            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada pengguna</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === 'pemilik' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role === 'pemilik' ? 'Pemilik' : 'Pencari'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reservasi Terbaru */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Reservasi Terbaru</h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/admin/reservations')}
                className="text-sm"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {recentReservations.length} reservasi terakhir
            </p>

            <div className="space-y-3">
              {recentReservations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada reservasi</p>
              ) : (
                recentReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <Calendar className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {reservation.kost?.name || 'Kost'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reservation.user?.name || 'User'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      reservation.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : reservation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {reservation.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
