import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Shield,
  Users, 
  Building2, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPemilik: 0,
    totalPencari: 0,
    totalKost: 0,
    kostPending: 0,
    kostApproved: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [users, setUsers] = useState([]);
  const [kosts, setKosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterKostStatus, setFilterKostStatus] = useState('all');

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data
      const [statsRes, usersRes, kostsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/kost')
      ]);

      const statsData = statsRes.data.data || {};
      const usersData = usersRes.data.data || [];
      const kostsData = kostsRes.data.data || [];

      console.log('Dashboard Data Received:');
      console.log('Stats:', statsData);
      console.log('Users:', usersData);
      console.log('Kosts:', kostsData);

      // Set stats from backend
      setStats({
        totalUsers: statsData.users?.total || 0,
        totalPemilik: statsData.users?.pemilik || 0,
        totalPencari: statsData.users?.pencari || 0,
        totalKost: statsData.kost?.total || 0,
        kostPending: statsData.kost?.pending || 0,
        kostApproved: statsData.kost?.approved || 0,
        totalBookings: statsData.bookings?.total || 0,
        totalRevenue: statsData.revenue || 0
      });

      setUsers(Array.isArray(usersData) ? usersData : []);
      setKosts(Array.isArray(kostsData) ? kostsData : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 403) {
        alert('Anda tidak memiliki akses ke halaman ini');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKost = async (kostId) => {
    if (!confirm('Approve kost ini? Kost akan langsung muncul di halaman publik.')) return;

    try {
      await api.put(`/admin/kost/${kostId}/approve`);
      alert('✅ Kost berhasil diapprove!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving kost:', error);
      alert('❌ ' + (error.response?.data?.message || 'Gagal approve kost'));
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('kostku-mp-project.vercel.app menyatakan:\n\n⚠️ Hapus user ini?\n\nTindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus.');
    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      alert('✅ User berhasil dihapus!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ ' + (error.response?.data?.message || 'Gagal hapus user'));
    }
  };

  const handleDeleteKost = async (kostId) => {
    const confirmed = window.confirm('kostku-mp-project.vercel.app menyatakan:\n\n⚠️ Hapus kost ini?\n\nTindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus.');
    if (!confirmed) return;

    try {
      await api.delete(`/admin/kost/${kostId}`);
      alert('✅ Kost berhasil dihapus!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting kost:', error);
      alert('❌ ' + (error.response?.data?.message || 'Gagal hapus kost'));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || user.role === filterRole;
    return matchSearch && matchRole;
  });

  const filteredKosts = kosts.filter(kost => {
    const matchSearch = kost.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterKostStatus === 'all' || 
                       (filterKostStatus === 'approved' && kost.is_approved) ||
                       (filterKostStatus === 'pending' && !kost.is_approved);
    return matchSearch && matchStatus;
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6" />
                <p className="text-sm opacity-90">Kelola seluruh platform KostKu</p>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Dashboard Super Admin</h1>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Pengguna</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers}</h3>
            <p className="text-xs text-gray-500">
              <span className="text-blue-600 font-medium">{stats.totalPencari} pencari</span>
              {' • '}
              <span className="text-purple-600 font-medium">{stats.totalPemilik} pemilik</span>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Kost</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalKost}</h3>
            <p className="text-xs text-gray-500">Kost terdaftar</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Reservasi</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalBookings}</h3>
            <p className="text-xs text-gray-500">0 menunggu konfirmasi</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-xs text-gray-500">Dari transaksi sukses</p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Users Management */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kelola Pengguna</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pengguna..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">Semua Role</option>
                  <option value="pencari">Pencari</option>
                  <option value="pemilik">Pemilik</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Tidak ada pengguna</p>
                  <p className="text-sm text-gray-400 mt-1">Pengguna akan muncul di sini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'pemilik' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 
                             user.role === 'pemilik' ? 'Pemilik' : 'Pencari'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.phone || '-'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={user.role === 'admin'}
                        title={user.role === 'admin' ? 'Admin tidak dapat dihapus' : 'Hapus pengguna'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kost Management */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kelola Kost</h2>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kost..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterKostStatus}
                  onChange={(e) => setFilterKostStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div className="flex gap-3 text-sm bg-gray-50 rounded-lg p-3">
                <span className="text-gray-600">Pending: <strong className="text-orange-600">{stats.kostPending}</strong></span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">Approved: <strong className="text-green-600">{stats.kostApproved}</strong></span>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {filteredKosts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Tidak ada kost</p>
                  <p className="text-sm text-gray-400 mt-1">Kost akan muncul di sini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredKosts.map((kost) => (
                    <div 
                      key={kost.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                    >
                      <img
                        src={kost.primary_image || 'https://via.placeholder.com/80'}
                        alt={kost.name}
                        className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">{kost.name}</h4>
                          {kost.is_approved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{kost.city}</p>
                        <p className="text-sm font-medium text-blue-600">
                          {formatCurrency(kost.price_monthly)}/bulan
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!kost.is_approved && (
                          <button
                            onClick={() => handleApproveKost(kost.id)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600 hover:scale-110"
                            title="Approve Kost"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/kost/${kost.id}`)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:scale-110"
                          title="Lihat Detail"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKost(kost.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:scale-110"
                          title="Hapus Kost"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
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

export default SuperAdminDashboard;
