import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Button, Card, CardContent, Badge } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { 
  Search, 
  MapPin, 
  Loader2, 
  Navigation, 
  Filter,
  Wifi,
  Car,
  Tv,
  Wind,
  Home,
  ChevronDown,
  Star
} from 'lucide-react';
import MapView, { calculateDistance } from '../components/Map';

function KostSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [kosts, setKosts] = useState([]);
  const [filteredKosts, setFilteredKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Filter states
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState('all');
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [sortBy, setSortBy] = useState('rating');
  
  // Facilities and Categories from API
  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAllFacilities, setShowAllFacilities] = useState(false);

  useEffect(() => {
    fetchKosts();
    fetchFacilities();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [kosts, searchQuery, selectedType, selectedCity, selectedCategory, maxPrice, selectedFacilities, sortBy, userLocation]);

  const fetchKosts = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/kost');
      setKosts(data.data || []);
    } catch (err) {
      setError('Gagal memuat data kost');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const { data } = await api.get('/facilities');
      setFacilities(data.data || []);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLoadingLocation(false);
          setSortBy('nearest');
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          alert('Tidak dapat mengakses lokasi Anda. Pastikan Anda mengizinkan akses lokasi.');
          setLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert('Browser Anda tidak mendukung Geolocation');
    }
  };

  const applyFilters = () => {
    let filtered = [...kosts];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(kost => 
        kost.name.toLowerCase().includes(query) ||
        kost.address.toLowerCase().includes(query) ||
        kost.city.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(kost => kost.KostType?.name === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(kost => kost.Category?.name === selectedCategory);
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(kost => kost.city === selectedCity);
    }

    // Price filter
    if (maxPrice !== 'all') {
      const maxPriceValue = parseInt(maxPrice);
      filtered = filtered.filter(kost => kost.price_monthly <= maxPriceValue);
    }

    // Facilities filter
    if (selectedFacilities.length > 0) {
      filtered = filtered.filter(kost => {
        if (!kost.Facilities || kost.Facilities.length === 0) return false;
        const kostFacilityIds = kost.Facilities.map(f => f.id);
        return selectedFacilities.every(facilityId => 
          kostFacilityIds.includes(facilityId)
        );
      });
    }

    // Calculate distance if user location is available
    if (userLocation) {
      filtered = filtered.map(kost => {
        if (kost.latitude && kost.longitude) {
          return {
            ...kost,
            distance: calculateDistance(
              userLocation[0],
              userLocation[1],
              parseFloat(kost.latitude),
              parseFloat(kost.longitude)
            )
          };
        }
        return { ...kost, distance: null };
      });
    }

    // Sort
    switch (sortBy) {
      case 'nearest':
        if (userLocation) {
          filtered.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price_monthly - b.price_monthly);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price_monthly - a.price_monthly);
        break;
      case 'rating':
      default:
        // Sort by rating or availability
        filtered.sort((a, b) => b.available_rooms - a.available_rooms);
        break;
    }

    setFilteredKosts(filtered);
  };

  const handleKostClick = (kostId) => {
    navigate(`/kost/${kostId}`);
  };

  const toggleFacility = (facilityId) => {
    setSelectedFacilities(prev => 
      prev.includes(facilityId) 
        ? prev.filter(id => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const resetFilters = () => {
    setSelectedType('all');
    setSelectedCity('all');
    setSelectedCategory('all');
    setMaxPrice('all');
    setSelectedFacilities([]);
    setSortBy('rating');
  };

  const cities = [...new Set(kosts.map(k => k.city))];
  const types = [...new Set(kosts.map(k => k.KostType?.name).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat data kost...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Cari Kost</h1>
          <p className="mt-2 text-muted-foreground">
            Temukan kost yang sesuai dengan kebutuhan Anda
          </p>
        </div>
      </div>

      {/* Nearby Section */}
      <div className="bg-primary/5 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">Cari Kost Terdekat</h2>
                <p className="text-sm text-muted-foreground">
                  Aktifkan lokasi untuk menemukan kost terdekat dari posisi Anda
                </p>
              </div>
            </div>
            <Button 
              onClick={getUserLocation}
              disabled={loadingLocation}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              {loadingLocation ? 'Mendapatkan Lokasi...' : 'Gunakan Lokasi Saya'}
            </Button>
          </div>
          {userLocation && (
            <div className="mt-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
              Lokasi Anda berhasil diaktifkan
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama, lokasi, atau kota..."
              className="h-12 w-full rounded-md border border-input bg-background px-3 pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Filter */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                </div>

                {/* Tipe Kost */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipe Kost</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Semua Tipe</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Kategori */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Kategori</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Kota */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Kota</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Semua Kota</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Harga Maksimal */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Harga Maksimal</label>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Semua Harga</option>
                    <option value="500000">≤ Rp 500.000</option>
                    <option value="1000000">≤ Rp 1.000.000</option>
                    <option value="1500000">≤ Rp 1.500.000</option>
                    <option value="2000000">≤ Rp 2.000.000</option>
                    <option value="3000000">≤ Rp 3.000.000</option>
                  </select>
                </div>

                {/* Fasilitas */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Fasilitas</label>
                    {selectedFacilities.length > 0 && (
                      <span className="text-xs text-primary font-medium">
                        {selectedFacilities.length} dipilih
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {facilities.slice(0, showAllFacilities ? facilities.length : 6).map(facility => (
                      <label key={facility.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1.5 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedFacilities.includes(facility.id)}
                          onChange={() => toggleFacility(facility.id)}
                          className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                        />
                        <span className="text-sm">{facility.name}</span>
                      </label>
                    ))}
                  </div>
                  {facilities.length > 6 && (
                    <button
                      onClick={() => setShowAllFacilities(!showAllFacilities)}
                      className="w-full mt-2 text-xs text-primary hover:underline flex items-center justify-center gap-1"
                    >
                      {showAllFacilities ? 'Tampilkan Lebih Sedikit' : `Tampilkan Semua (${facilities.length})`}
                      <ChevronDown className={`h-3 w-3 transition-transform ${showAllFacilities ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sort & Results Count */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan <span className="font-semibold text-foreground">{filteredKosts.length}</span> kost
              </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Urutkan:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="rating">Rating Tertinggi</option>
                  {userLocation && <option value="nearest">Terdekat</option>}
                  <option value="price_low">Harga Terendah</option>
                  <option value="price_high">Harga Tertinggi</option>
                </select>
              </div>
            </div>

            {/* Kost List */}
            {filteredKosts.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedType !== 'all' || selectedCity !== 'all' 
                    ? 'Tidak ada kost yang sesuai dengan filter Anda' 
                    : 'Belum ada kost tersedia'}
                </p>
                {(searchQuery || selectedType !== 'all' || selectedCity !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="mt-4"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredKosts.map((kost) => (
                  <Card 
                    key={kost.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleKostClick(kost.id)}
                  >
                    <div className="grid md:grid-cols-[300px_1fr] gap-0">
                      {/* Image */}
                      <div className="relative aspect-[4/3] md:aspect-auto bg-muted">
                        {kost.images && kost.images.length > 0 ? (
                          <img 
                            src={kost.images[0].image_url} 
                            alt={kost.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Home className="h-16 w-16" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <Badge className="bg-primary text-primary-foreground">
                            {kost.KostType?.name || 'Kost'}
                          </Badge>
                          {kost.distance && (
                            <Badge className="bg-green-600 text-white">
                              {kost.distance.toFixed(1)} km
                            </Badge>
                          )}
                        </div>

                        {kost.images && kost.images.length > 1 && (
                          <Badge className="absolute bottom-3 right-3 bg-background/90 text-foreground">
                            +{kost.images.length - 1} foto
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <CardContent className="p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg line-clamp-1">{kost.name}</h3>
                              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm line-clamp-1">
                                  {kost.address}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {kost.city}, {kost.province}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {formatCurrency(kost.price_monthly)}
                              </div>
                              <span className="text-xs text-muted-foreground">/bulan</span>
                            </div>
                          </div>

                          {/* Facilities */}
                          {kost.Facilities && kost.Facilities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {kost.Facilities.slice(0, 4).map((facility, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs"
                                >
                                  {facility.name.toLowerCase().includes('wifi') && <Wifi className="h-3 w-3" />}
                                  {facility.name.toLowerCase().includes('ac') && <Wind className="h-3 w-3" />}
                                  {facility.name.toLowerCase().includes('parkir') && <Car className="h-3 w-3" />}
                                  {facility.name.toLowerCase().includes('tv') && <Tv className="h-3 w-3" />}
                                  <span>{facility.name}</span>
                                </div>
                              ))}
                              {kost.Facilities.length > 4 && (
                                <div className="px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                  +{kost.Facilities.length - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">{kost.available_rooms}</span> kamar tersedia
                            </span>
                            {kost.distance && (
                              <span className="text-sm text-muted-foreground">
                                📍 {kost.distance.toFixed(2)} km dari Anda
                              </span>
                            )}
                          </div>
                          <Button size="sm">
                            Lihat Detail
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KostSearch;
