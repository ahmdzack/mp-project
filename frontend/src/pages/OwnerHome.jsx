import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button } from '../components/ui';
import { 
  Plus, 
  Bell, 
  Building2, 
  Users, 
  Calendar, 
  DollarSign
} from 'lucide-react';

function OwnerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalKost: 0,
    kamaTersedia: 0,
    bookingPending: 0,
    totalPendapatan: 0,
    tingkatHunian: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [myKosts, setMyKosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch owner's kosts
      const kostsResponse = await api.get('/kost/owner/my-kosts');
      const kostsData = kostsResponse.data.data || [];
      setMyKosts(kostsData);

      // Fetch bookings
      const bookingsResponse = await api.get('/bookings');
      const allBookings = bookingsResponse.data.data || [];
      
      // Filter bookings for owner's kosts
      const myKostIds = kostsData.map(k => k.id);
      const myBookings = allBookings.filter(b => myKostIds.includes(b.kost_id));
      setRecentBookings(myBookings.slice(0, 5)); // Show 5 recent bookings

      // Calculate stats
      const activeKosts = kostsData.filter(k => k.status === 'active');
      const totalRooms = kostsData.reduce((sum, k) => sum + (k.available_rooms || 0), 0);
      const bookingPending = myBookings.filter(b => b.status === 'pending').length;
      const confirmedBookings = myBookings.filter(b => b.status === 'confirmed');
      const totalIncome = confirmedBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      
      // Calculate tingkat hunian
      const totalAllRooms = kostsData.reduce((sum, k) => sum + (k.total_rooms || 0), 0);
      const occupancyRate = totalAllRooms > 0 ? Math.round(((totalAllRooms - totalRooms) / totalAllRooms) * 100) : 0;
      
      setStats({
        totalKost: activeKosts.length,
        kamaTersedia: totalRooms,
        bookingPending: bookingPending,
        totalPendapatan: totalIncome,
        tingkatHunian: occupancyRate
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching owner data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span>Dashboard Pemilik</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Selamat Pagi, <span className="text-primary">{user?.name}</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Kelola kost Anda dengan mudah dan pantau performa bisnis Anda secara real-time.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/dashboard/owner/kost/create')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kost Baru
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/owner/bookings')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Lihat Booking
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Kost */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Kost</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalKost}</p>
            <p className="text-xs text-muted-foreground mt-2">kost aktif</p>
          </div>

          {/* Kamar Tersedia */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Kamar Tersedia</p>
            <p className="text-3xl font-bold text-gray-900">{stats.kamaTersedia}</p>
            <p className="text-xs text-muted-foreground mt-2">{stats.tingkatHunian}% tingkat hunian</p>
          </div>

          {/* Booking Pending */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Booking Pending</p>
            <p className="text-3xl font-bold text-gray-900">{stats.bookingPending}</p>
            <p className="text-xs text-muted-foreground mt-2">menunggu konfirmasi</p>
          </div>

          {/* Total Pendapatan */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
            <p className="text-2xl font-bold text-gray-900">Rp {stats.totalPendapatan.toLocaleString('id-ID')}</p>
            <p className="text-xs text-muted-foreground mt-2">sepanjang waktu</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Aksi Cepat */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
              <p className="text-sm text-muted-foreground mb-6">Kelola bisnis kost Anda dengan cepat</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/dashboard/owner/kost/create')}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all"
                >
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Tambah Kost</p>
                    <p className="text-xs text-muted-foreground">Daftarkan kost baru</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/dashboard/owner/bookings')}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-orange-50 transition-all"
                >
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Lihat Booking</p>
                    <p className="text-xs text-muted-foreground">Konfirmasi pemesanan</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/dashboard/owner/kost')}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-purple-50 transition-all"
                >
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Lihat Semua Kost</p>
                    <p className="text-xs text-muted-foreground">Daftar lengkap kost Anda</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Kost Saya */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Kost Saya</h2>
                <Link to="/dashboard/owner/kost" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Lihat Semua
                  <span>→</span>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Daftar kost yang Anda kelola</p>
              
              {myKosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Belum Ada Kost</p>
                  <p className="text-sm text-muted-foreground mb-4">Mulai daftarkan kost pertama Anda</p>
                  <Button 
                    onClick={() => navigate('/dashboard/owner/kost/create')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kost Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myKosts.slice(0, 3).map((kost) => (
                    <div 
                      key={kost.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/kost/${kost.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {kost.images?.[0] ? (
                            <img 
                              src={kost.images[0].image_url} 
                              alt={kost.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{kost.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {kost.available_rooms || 0} kamar tersedia
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Rp {(kost.price || 0).toLocaleString('id-ID')}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          kost.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {kost.status === 'active' ? 'Aktif' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Ringkasan Performa */}
          <div className="space-y-6">
            {/* Ringkasan Performa */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Ringkasan Performa</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-100">Tingkat Hunian</span>
                    <span className="text-lg font-bold">{stats.tingkatHunian}%</span>
                  </div>
                  <div className="w-full bg-blue-400/30 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${stats.tingkatHunian}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-blue-400 pt-4">
                  <p className="text-sm text-blue-100 mb-2">Pendapatan Bulan Ini</p>
                  <p className="text-2xl font-bold">Rp {stats.totalPendapatan.toLocaleString('id-ID')}</p>
                </div>

                <div className="border-t border-blue-400 pt-4">
                  <p className="text-sm text-blue-100 mb-2">Booking Dikonfirmasi</p>
                  <p className="text-2xl font-bold">{stats.bookingPending}</p>
                </div>
              </div>
            </div>

            {/* Booking Terbaru */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Booking Terbaru</h2>
                <Link to="/dashboard/owner/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Lihat Semua
                  <span>→</span>
                </Link>
              </div>
              
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Belum Ada Booking</p>
                  <p className="text-sm text-muted-foreground">Booking akan muncul di sini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/owner/bookings')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {booking.kost_name || 'Kost'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'Terkonfirmasi' :
                           booking.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{booking.user_name || 'Penyewa'}</p>
                      <p className="text-sm font-medium text-blue-600 mt-1">
                        Rp {(Number(booking.total_price) || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerHome;
