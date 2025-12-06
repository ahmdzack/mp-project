import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeft, 
  MapPin, 
  Home, 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

function AdminKostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kost, setKost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchKostDetail();
  }, [id]);

  const fetchKostDetail = async () => {
    try {
      const response = await api.get(`/kost/${id}`);
      
      setKost(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching kost:', error);
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui kost ini?')) return;
    
    setProcessing(true);
    try {
      await api.put(`/admin/kost/${id}/approve`);
      
      alert('Kost berhasil disetujui!');
      fetchKostDetail();
    } catch (error) {
      console.error('Error approving kost:', error);
      alert('Gagal menyetujui kost');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kost ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    setProcessing(true);
    try {
      await api.delete(`/admin/kost/${id}`);
      
      alert('Kost berhasil dihapus!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error deleting kost:', error);
      alert('Gagal menghapus kost');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data kost...</p>
        </div>
      </div>
    );
  }

  if (!kost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Kost tidak ditemukan</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{kost.name}</h1>
                  {kost.is_approved ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      <XCircle className="h-4 w-4" />
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {kost.address}, {kost.city}
                </p>
              </div>

              <div className="flex gap-2">
                {!kost.is_approved && (
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approve
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200">
                {kost.images && kost.images.length > 0 ? (
                  <img
                    src={kost.images[selectedImage]?.image_url}
                    alt={kost.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Home className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {kost.images && kost.images.length > 1 && (
                <div className="p-4 grid grid-cols-5 gap-2">
                  {kost.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`${kost.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Deskripsi</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {kost.description || 'Tidak ada deskripsi'}
              </p>
            </div>

            {/* Facilities */}
            {kost.facilities && kost.facilities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Fasilitas</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {kost.facilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>{facility.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {kost.rules && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Peraturan</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{kost.rules}</p>
              </div>
            )}
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Pemilik</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Nama Pemilik</p>
                    <p className="font-medium text-gray-900">{kost.owner?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{kost.owner?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Telepon</p>
                    <p className="font-medium text-gray-900">{kost.owner?.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Harga Sewa</h3>
              <div className="space-y-3">
                {kost.price_daily && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Harian</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(kost.price_daily)}
                    </span>
                  </div>
                )}
                {kost.price_weekly && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mingguan</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(kost.price_weekly)}
                    </span>
                  </div>
                )}
                {kost.price_monthly && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bulanan</span>
                    <span className="font-semibold text-blue-600 text-lg">
                      {formatCurrency(kost.price_monthly)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Room Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Kamar</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Kamar</span>
                  <span className="font-semibold text-gray-900">{kost.total_rooms} kamar</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kamar Tersedia</span>
                  <span className="font-semibold text-green-600">
                    {kost.available_rooms} kamar
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kategori</span>
                  <span className="font-semibold text-gray-900">
                    {kost.Category?.name || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tipe</span>
                  <span className="font-semibold text-gray-900">
                    {kost.KostType?.name || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status Kost</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Dibuat</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(kost.created_at)}
                    </p>
                  </div>
                </div>
                {kost.approved_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Disetujui</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(kost.approved_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminKostDetail;
