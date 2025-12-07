import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Building2, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  MapPin,
  Bed
} from 'lucide-react';

function OwnerKostList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchMyKosts();
  }, []);

  const fetchMyKosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kost/owner/my-kosts');
      setKosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching kosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kost ini?')) return;
    
    try {
      setDeleteLoading(id);
      await api.delete(`/kost/${id}`);
      alert('Kost berhasil dihapus');
      fetchMyKosts();
    } catch (error) {
      console.error('Error deleting kost:', error);
      alert(error.response?.data?.message || 'Gagal menghapus kost');
    } finally {
      setDeleteLoading(null);
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
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/owner/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daftar Kost Saya</h1>
              <p className="text-muted-foreground mt-2">
                Kelola semua properti kost yang Anda miliki
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/owner/kost/create')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              Tambah Kost Baru
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-muted-foreground mb-1">Total Kost</p>
            <p className="text-3xl font-bold text-gray-900">{kosts.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-muted-foreground mb-1">Kost Aktif</p>
            <p className="text-3xl font-bold text-gray-900">
              {kosts.filter(k => k.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-muted-foreground mb-1">Total Kamar</p>
            <p className="text-3xl font-bold text-gray-900">
              {kosts.reduce((sum, k) => sum + (k.available_rooms || 0), 0)}
            </p>
          </div>
        </div>

        {/* Kost List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Semua Kost</h2>
          </div>
          
          {kosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">Belum Ada Kost</p>
              <p className="text-sm text-muted-foreground mb-6">Mulai daftarkan kost pertama Anda</p>
              <button
                onClick={() => navigate('/dashboard/owner/kost/create')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                Tambah Kost Pertama
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {kosts.map((kost) => (
                <div key={kost.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {kost.images?.[0] ? (
                        <img
                          src={kost.images[0].image_url}
                          alt={kost.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {kost.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              kost.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {kost.status === 'active' ? 'Aktif' : 'Pending'}
                            </span>
                            {kost.is_approved ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Disetujui Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Menunggu Persetujuan
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{kost.address}, {kost.city}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Bed className="h-4 w-4" />
                        <span>{kost.available_rooms || 0} kamar tersedia dari {kost.total_rooms || 0} kamar</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Harga per bulan</p>
                          <p className="text-2xl font-bold text-blue-600">
                            Rp {(kost.price_monthly || 0).toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/kost/${kost.id}`)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Detail</span>
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/owner/kost/edit/${kost.id}`)}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            title="Edit kost"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(kost.id)}
                            disabled={deleteLoading === kost.id}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Hapus kost"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {deleteLoading === kost.id ? 'Menghapus...' : 'Hapus'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerKostList;
