import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Building2, 
  Bed, 
  Calendar, 
  DollarSign, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  Minus
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKost: 0,
    totalRooms: 0,
    bookingPending: 0,
    totalIncome: 0
  });
  const [myKosts, setMyKosts] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'pemilik') {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch my kosts
      const { data: kostData } = await api.get('/kost', {
        params: { owner_id: user.id }
      });
      
      // Fetch bookings
      const { data: bookingData } = await api.get('/bookings');
      
      const myKostsList = kostData.data || [];
      const allBookings = bookingData.data || [];
      
      // Filter bookings untuk kost milik user ini
      const myKostIds = myKostsList.map(k => k.id);
      const myBookings = allBookings.filter(b => myKostIds.includes(b.kost_id));
      
      // Calculate stats - use available_rooms instead of total_rooms
      const totalAvailableRooms = myKostsList.reduce((sum, k) => sum + (k.available_rooms || 0), 0);
      const bookingPending = myBookings.filter(b => b.status === 'pending').length;
      const confirmedBookings = myBookings.filter(b => b.status === 'confirmed');
      const totalIncome = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
      
      setStats({
        totalKost: myKostsList.length,
        totalRooms: totalAvailableRooms,
        bookingPending,
        totalIncome
      });
      
      setMyKosts(myKostsList.slice(0, 5)); // Show only 5 recent
      setRecentBookings(myBookings.slice(0, 5)); // Show only 5 recent
      
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRooms = async (kostId, action) => {
    try {
      await api.patch(`/kost/${kostId}/rooms`, { action });
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Update rooms error:', error);
      alert(error.response?.data?.message || 'Gagal mengubah jumlah kamar');
    }
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Pemilik</h1>
            <p className="text-gray-600 mt-1">Selamat datang, {user?.name}!</p>
          </div>
          <button 
            onClick={() => navigate('/kost/create')} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Tambah Kost Baru
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Kost</p>
                <h3 className="text-3xl font-bold mt-2">{stats.totalKost}</h3>
                <p className="text-xs text-gray-500 mt-1">properti terdaftar</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Kamar</p>
                <h3 className="text-3xl font-bold mt-2">{stats.totalRooms}</h3>
                <p className="text-xs text-gray-500 mt-1">kamar tersedia</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Bed className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Booking Pending</p>
                <h3 className="text-3xl font-bold mt-2">{stats.bookingPending}</h3>
                <p className="text-xs text-gray-500 mt-1">menunggu konfirmasi</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            {stats.bookingPending > 0 && (
              <button
                onClick={() => navigate('/bookings/confirmation')}
                className="mt-4 w-full text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 py-2 rounded-md font-medium transition-colors"
              >
                Lihat Booking Masuk →
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pendapatan</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.totalIncome)}</h3>
                <p className="text-xs text-gray-500 mt-1">dari booking terkonfirmasi</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Kost Saya */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Kost Saya</h2>
              <button 
                onClick={() => navigate('/kost/manage')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              {myKosts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Belum ada kost terdaftar</p>
                  <button 
                    onClick={() => navigate('/kost/create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Tambah kost pertama Anda
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myKosts.map((kost) => (
                    <div 
                      key={kost.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={kost.primary_image || 'https://via.placeholder.com/80'}
                        alt={kost.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{kost.name}</h4>
                        <p className="text-sm text-gray-600">{kost.city}</p>
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          {formatCurrency(kost.price_monthly)}/bulan
                        </p>
                        
                        {/* Available Rooms Control */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Kamar tersedia:</span>
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRooms(kost.id, 'decrement');
                              }}
                              disabled={kost.available_rooms <= 0}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Kurangi kamar"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-semibold min-w-[40px] text-center">
                              {kost.available_rooms}/{kost.total_rooms}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRooms(kost.id, 'increment');
                              }}
                              disabled={kost.available_rooms >= kost.total_rooms}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Tambah kamar"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/kost/${kost.id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/kost/edit/${kost.id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit kost"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Terbaru */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Booking Terbaru</h2>
              <button 
                onClick={() => navigate('/bookings/confirmation')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              {recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada booking masuk</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Booking akan muncul disini saat ada penyewa
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate('/bookings/confirmation', { state: { bookingId: booking.id } })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{booking.booking_code}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'Terkonfirmasi' :
                           booking.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{booking.guest_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.check_in_date).toLocaleDateString('id-ID')} - {new Date(booking.check_out_date).toLocaleDateString('id-ID')}
                      </p>
                      <p className="text-sm font-medium text-blue-600 mt-2">
                        {formatCurrency(booking.total_price)}
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

export default OwnerDashboard;
