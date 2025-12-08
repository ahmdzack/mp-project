import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { ArrowLeft, Plus, X, Upload, MapPin, CheckCircle } from 'lucide-react';
import MapPicker from '../components/MapPicker';

function KostCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [categories, setCategories] = useState([]);
  const [kostTypes, setKostTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Makassar',
    district: '',
    latitude: '',
    longitude: '',
    category_id: '',
    type_id: '',
    price_weekly: '',
    price_monthly: '',
    price_yearly: '',
    total_rooms: '',
    available_rooms: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Redirect if not pemilik
    if (user && user.role !== 'pemilik') {
      alert('⚠️ Akses Ditolak!\n\nHanya pemilik kost yang dapat menambahkan kost.\nSilakan login sebagai pemilik kost atau hubungi admin.');
      navigate('/');
      return;
    }

    fetchCategories();
    fetchKostTypes();
    fetchFacilities();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchKostTypes = async () => {
    try {
      const response = await api.get('/kost-types');
      setKostTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching kost types:', error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await api.get('/facilities');
      setFacilities(response.data.data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFacilityToggle = (facilityId) => {
    setSelectedFacilities(prev => {
      if (prev.includes(facilityId)) {
        return prev.filter(id => id !== facilityId);
      } else {
        return [...prev, facilityId];
      }
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 5 images
    if (images.length + files.length > 5) {
      alert('Maksimal 5 gambar');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nama kost wajib diisi';
    if (!formData.address.trim()) newErrors.address = 'Alamat wajib diisi';
    if (!formData.district.trim()) newErrors.district = 'Kecamatan wajib diisi';
    if (!formData.category_id) newErrors.category_id = 'Kategori wajib dipilih';
    if (!formData.type_id) newErrors.type_id = 'Tipe kost wajib dipilih';
    if (!formData.price_monthly) newErrors.price_monthly = 'Harga bulanan wajib diisi';
    if (!formData.total_rooms) newErrors.total_rooms = 'Jumlah kamar wajib diisi';

    // Validate positive numbers
    if (formData.price_monthly && formData.price_monthly < 0) {
      newErrors.price_monthly = 'Harga tidak boleh negatif';
    }
    if (formData.total_rooms && formData.total_rooms < 1) {
      newErrors.total_rooms = 'Minimal 1 kamar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setLoading(true);

    try {
      // Prepare data
      const kostData = {
        ...formData,
        category_id: parseInt(formData.category_id),
        type_id: parseInt(formData.type_id),
        price_weekly: formData.price_weekly ? parseInt(formData.price_weekly) : null,
        price_monthly: parseInt(formData.price_monthly),
        price_yearly: formData.price_yearly ? parseInt(formData.price_yearly) : null,
        total_rooms: parseInt(formData.total_rooms),
        available_rooms: formData.available_rooms ? parseInt(formData.available_rooms) : parseInt(formData.total_rooms),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        facilities: selectedFacilities
      };

      // Create kost
      const response = await api.post('/kost', kostData);

      const newKostId = response.data.data.id;

      // Upload images if any
      if (images.length > 0) {
        const formDataImages = new FormData();
        images.forEach(image => {
          formDataImages.append('images', image);
        });

        await api.post(
          `/kost/${newKostId}/images`,
          formDataImages,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error creating kost:', error);
      
      if (error.response?.data?.errors) {
        // Validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      }
      
      alert('❌ ' + (error.response?.data?.message || 'Gagal membuat kost'));
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'pemilik') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Dialog */}
        {showSuccessDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Kost Berhasil Dibuat!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Kost Anda telah berhasil ditambahkan dan sedang menunggu persetujuan admin.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 bg-gray-50 rounded-b-2xl border-t">
                <button
                  onClick={() => navigate('/dashboard/owner')}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-200 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30"
                >
                  Oke
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Kost Baru</h1>
          <p className="text-gray-600 mt-1">Lengkapi informasi kost Anda</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Informasi Dasar */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Informasi Dasar</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kost <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: Kost Sederhana Dekat Kampus"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Deskripsikan kost Anda..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Kost <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type_id"
                    value={formData.type_id}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.type_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Pilih Tipe</option>
                    {kostTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  {errors.type_id && <p className="text-red-500 text-sm mt-1">{errors.type_id}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lokasi
            </h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Jl. Contoh No. 123"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kota
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Contoh: Tamalanrea"
                  />
                  {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                </div>
              </div>

              {/* Lokasi dengan Map Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Lokasi Kost (Klik pada peta untuk memilih lokasi)
                </label>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat.toString(),
                      longitude: lng.toString()
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Harga & Kamar */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Harga & Kamar</h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Mingguan
                  </label>
                  <input
                    type="number"
                    name="price_weekly"
                    value={formData.price_weekly}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="300000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Bulanan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price_monthly"
                    value={formData.price_monthly}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.price_monthly ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1000000"
                  />
                  {errors.price_monthly && <p className="text-red-500 text-sm mt-1">{errors.price_monthly}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Tahunan
                  </label>
                  <input
                    type="number"
                    name="price_yearly"
                    value={formData.price_yearly}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Kamar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="total_rooms"
                    value={formData.total_rooms}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.total_rooms ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10"
                  />
                  {errors.total_rooms && <p className="text-red-500 text-sm mt-1">{errors.total_rooms}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kamar Tersedia
                  </label>
                  <input
                    type="number"
                    name="available_rooms"
                    value={formData.available_rooms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kosongkan jika sama dengan total kamar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fasilitas */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Fasilitas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {facilities.map(facility => (
                <label
                  key={facility.id}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFacilities.includes(facility.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFacilities.includes(facility.id)}
                    onChange={() => handleFacilityToggle(facility.id)}
                    className="rounded text-blue-500"
                  />
                  <span className="text-sm">{facility.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Upload Gambar */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Gambar Kost</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                  <Upload className="h-5 w-5" />
                  <span>Upload Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-600">Maksimal 5 gambar</span>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kost'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>

          <p className="text-sm text-gray-600 text-center">
            * Kost yang baru dibuat akan menunggu persetujuan admin terlebih dahulu
          </p>
        </form>
      </div>
    </div>
  );
}

export default KostCreate;
