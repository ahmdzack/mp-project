import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { MapPin, Home, DollarSign, Image as ImageIcon, X, CheckCircle } from 'lucide-react';

const KostEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    district: '',
    latitude: '',
    longitude: '',
    price_weekly: '',
    price_monthly: '',
    price_yearly: '',
    total_rooms: '',
    available_rooms: '',
    category_id: '',
    type_id: '',
    facilities: []
  });

  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    fetchKostData();
    fetchMasterData();
  }, [id]);

  const fetchKostData = async () => {
    try {
      const response = await api.get(`/kost/${id}`);

      const kost = response.data.data;
      setFormData({
        name: kost.name || '',
        description: kost.description || '',
        address: kost.address || '',
        city: kost.city || '',
        district: kost.district || '',
        latitude: kost.latitude || '',
        longitude: kost.longitude || '',
        price_weekly: kost.price_weekly || '',
        price_monthly: kost.price_monthly || '',
        price_yearly: kost.price_yearly || '',
        total_rooms: kost.total_rooms || '',
        available_rooms: kost.available_rooms || '',
        category_id: kost.category_id || '',
        type_id: kost.type_id || '',
        facilities: kost.facilities?.map(f => f.id) || []
      });

      setExistingImages(kost.images || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching kost:', error);
      alert('Gagal memuat data kost');
      navigate('/dashboard/owner');
    }
  };

  const fetchMasterData = async () => {
    try {
      const [categoriesRes, typesRes, facilitiesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/kost-types'),
        api.get('/facilities')
      ]);

      setCategories(categoriesRes.data.data || []);
      setTypes(typesRes.data.data || []);
      setFacilities(facilitiesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilityToggle = (facilityId) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facilityId)
        ? prev.facilities.filter(id => id !== facilityId)
        : [...prev.facilities, facilityId]
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length - imagesToDelete.length + newImages.length > 5) {
      alert('Maksimal 5 gambar!');
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveExistingImage = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Update kost data
      await api.put(`/kost/${id}`, formData);

      // Delete images
      for (const imageId of imagesToDelete) {
        await api.delete(`/kost/${id}/images/${imageId}`);
      }

      // Upload new images
      if (newImages.length > 0) {
        const imageFormData = new FormData();
        newImages.forEach(file => {
          imageFormData.append('images', file);
        });

        await api.post(
          `/kost/${id}/images`,
          imageFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error updating kost:', error);
      alert('❌ ' + (error.response?.data?.message || 'Gagal update kost'));
      alert(error.response?.data?.message || 'Gagal update kost');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
                      Kost Berhasil Diupdate!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Perubahan data kost Anda telah berhasil disimpan.
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

        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Kost</h1>
          <p className="text-gray-600 mt-2">Perbarui informasi kost Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Basic Info */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Home className="h-5 w-5" />
              Informasi Dasar
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kost *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: Kost Mawar Indah"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deskripsikan kost Anda..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe *
                  </label>
                  <select
                    name="type_id"
                    value={formData.type_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Tipe</option>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lokasi
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Lengkap *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kota *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="-6.200000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="106.816666"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Harga
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga per Minggu
                </label>
                <input
                  type="number"
                  name="price_weekly"
                  value={formData.price_weekly}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga per Bulan *
                </label>
                <input
                  type="number"
                  name="price_monthly"
                  value={formData.price_monthly}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga per Tahun
                </label>
                <input
                  type="number"
                  name="price_yearly"
                  value={formData.price_yearly}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5000000"
                />
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Kamar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Kamar *
                </label>
                <input
                  type="number"
                  name="total_rooms"
                  value={formData.total_rooms}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kamar Tersedia *
                </label>
                <input
                  type="number"
                  name="available_rooms"
                  value={formData.available_rooms}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Fasilitas</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {facilities.map(facility => (
                <label
                  key={facility.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility.id)}
                    onChange={() => handleFacilityToggle(facility.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{facility.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gambar Kost
            </h2>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Gambar Saat Ini:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages
                    .filter(img => !imagesToDelete.includes(img.id))
                    .map(image => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image_url}
                          alt="Kost"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* New Images Preview */}
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Gambar Baru:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                <ImageIcon className="h-5 w-5" />
                Tambah Gambar
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Maksimal 5 gambar. Format: JPG, PNG. Ukuran maks: 5MB per gambar
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/owner')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KostEdit;
