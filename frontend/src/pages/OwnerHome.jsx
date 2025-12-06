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
  DollarSign,
  TrendingUp,
  FileText,
  BarChart3,
  CheckCircle,
  Star,
  Target,
  Zap,
  Clock
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

      // Calculate stats
      const activeKosts = kostsData.filter(k => k.status === 'active');
      const totalRooms = kostsData.reduce((sum, k) => sum + (k.available_rooms || 0), 0);
      
      setStats({
        totalKost: activeKosts.length,
        kamaTersedia: totalRooms,
        bookingPending: 0, // Will be updated when booking API is ready
        totalPendapatan: 0, // Will be calculated from actual bookings
        tingkatHunian: totalRooms > 0 ? 0 : 0 // Will be calculated
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
              Kelola properti kost Anda dengan mudah dan pantau performa bisnis Anda secara real-time.
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
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Lihat Booking
            </Button>
          </div>
        </div>

        {/* Hero Image Card */}
        <div className="mb-8 relative overflow-hidden rounded-2xl shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=400&fit=crop" 
            alt="Hero" 
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Pendapatan Bulan Ini</p>
            <p className="text-3xl font-bold text-gray-900">Rp {stats.totalPendapatan.toLocaleString('id-ID')}</p>
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
            <p className="text-xs text-muted-foreground mt-2">properti aktif</p>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/dashboard/owner/kost/create')}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all"
                >
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Tambah Kost</p>
                    <p className="text-xs text-muted-foreground">Daftarkan properti baru</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/dashboard/owner')}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-green-50 transition-all"
                >
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Kelola Kost</p>
                    <p className="text-xs text-muted-foreground">Edit properti Anda</p>
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
                    <p className="font-semibold text-gray-900">Booking</p>
                    <p className="text-xs text-muted-foreground">Konfirmasi pemesanan</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/dashboard/owner')}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-purple-50 transition-all"
                >
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Dashboard</p>
                    <p className="text-xs text-muted-foreground">Lihat statistik lengkap</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Properti Saya */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Properti Saya</h2>
                <Link to="/dashboard/owner" className="text-sm text-primary hover:underline flex items-center gap-1">
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
                  <p className="text-sm text-muted-foreground mb-4">Mulai daftarkan properti kost pertama Anda</p>
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

          {/* Right Column - Ringkasan & Tips */}
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

            {/* Tips untuk Pemilik */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <h2 className="text-lg font-semibold">Tips untuk Pemilik</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg h-fit">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Tingkatkan Rating</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Respon cepat dan kebersihan baik meningkatkan rating kost Anda.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="bg-green-100 p-2 rounded-lg h-fit">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Optimalkan Harga</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sesuaikan harga dengan fasilitas dan lokasi untuk menarik lebih banyak penyewa.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg h-fit">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Respon Cepat</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Konfirmasi booking dalam 24 jam untuk pengalaman penyewa yang lebih baik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Pemilik */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Checklist Pemilik</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    myKosts.length > 0 ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {myKosts.length > 0 && <CheckCircle className="h-4 w-4 text-white" />}
                  </div>
                  <span className={`text-sm ${myKosts.length > 0 ? 'text-gray-900' : 'text-muted-foreground'}`}>
                    Tambahkan kost pertama
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                  <span className="text-sm text-muted-foreground">Konfirmasi semua booking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerHome;
