import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Button, Card, CardContent, Badge } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { MapPin, Home, Wifi, Car, Tv, Wind, Zap, Droplet, Shield, Loader2, ArrowLeft, Check } from 'lucide-react';
import MapView from '../components/Map';

function KostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kost, setKost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  // Memoize map center to prevent re-creation on every render
  const mapCenter = useMemo(() => {
    if (kost?.latitude && kost?.longitude) {
      return [parseFloat(kost.latitude), parseFloat(kost.longitude)];
    }
    return [-5.1477, 119.4327]; // Default Makassar
  }, [kost?.latitude, kost?.longitude]);

  console.log('🏠 KostDetail render:', { id, hasUser: !!user, kost: kost?.name });

  const fetchKostDetail = useCallback(async () => {
    try {
      const { data } = await api.get(`/kost/${id}`);
      setKost(data.data);
    } catch (err) {
      setError('Gagal memuat detail kost');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    console.log('🔄 KostDetail useEffect triggered for id:', id);
    // Reset state when id changes
    setLoading(true);
    setError('');
    setKost(null);
    setSelectedImage(0);
    fetchKostDetail();
  }, [id, fetchKostDetail]);

  const handleBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Force navigation and scroll to top
    navigate(`/booking/${id}`, { replace: false });
    window.scrollTo(0, 0);
  };

  const getFacilityIcon = (facilityName) => {
    const name = facilityName.toLowerCase();
    if (name.includes('wifi') || name.includes('internet')) return <Wifi className="h-4 w-4" />;
    if (name.includes('parkir') || name.includes('parking')) return <Car className="h-4 w-4" />;
    if (name.includes('tv') || name.includes('televisi')) return <Tv className="h-4 w-4" />;
    if (name.includes('ac') || name.includes('air')) return <Wind className="h-4 w-4" />;
    if (name.includes('listrik') || name.includes('electric')) return <Zap className="h-4 w-4" />;
    if (name.includes('air') || name.includes('water')) return <Droplet className="h-4 w-4" />;
    if (name.includes('keamanan') || name.includes('security')) return <Shield className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat detail kost...</p>
        </div>
      </div>
    );
  }

  if (error || !kost) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Kost tidak ditemukan'}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const images = kost.images || [];
  const facilities = kost.facilities || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Gallery & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery Section */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10] bg-muted">
                {images.length > 0 ? (
                  <img 
                    src={images[selectedImage]?.image_url} 
                    alt={kost.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x500?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Home className="h-24 w-24" />
                  </div>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4 bg-muted/30">
                  {images.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      className={`relative aspect-video overflow-hidden rounded-md border-2 transition-all ${
                        selectedImage === idx 
                          ? 'border-primary' 
                          : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img 
                        src={img.image_url} 
                        alt={`${kost.name} ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {idx === 3 && images.length > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold">
                          +{images.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Info Section */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h1 className="text-3xl font-bold">{kost.name}</h1>
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{kost.address}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {kost.KostType?.name || 'Kost'}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-3">Deskripsi</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {kost.description || 'Tidak ada deskripsi tersedia untuk kost ini.'}
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Fasilitas</h2>
                  {facilities.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {facilities.map((facility) => (
                        <div 
                          key={facility.id} 
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {getFacilityIcon(facility.name)}
                          </div>
                          <span>{facility.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Tidak ada fasilitas tersedia</p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-3">Ketersediaan</h2>
                  <div className="flex items-center gap-2">
                    {kost.available_rooms > 0 ? (
                      <>
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                          Tersedia
                        </Badge>
                        <span className="text-muted-foreground">
                          {kost.available_rooms} kamar tersedia
                        </span>
                      </>
                    ) : (
                      <Badge variant="destructive">Tidak Tersedia</Badge>
                    )}
                  </div>
                </div>

                {/* Lokasi Map Section */}
                {kost.latitude && kost.longitude && (
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">Lokasi</h2>
                    <div className="rounded-lg overflow-hidden border">
                      <MapView
                        singleKost={kost}
                        center={mapCenter}
                        zoom={15}
                        height="300px"
                        showUserLocation={true}
                      />
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {kost.address}, {kost.city}, {kost.province}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Card (Sticky) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Harga per bulan</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(kost.price_monthly)}
                    </span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {kost.available_rooms > 0 ? 'Tersedia' : 'Penuh'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipe</span>
                    <span className="font-medium">{kost.KostType?.name || 'Kost'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kategori</span>
                    <span className="font-medium">{kost.Category?.name || '-'}</span>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleBooking}
                  disabled={kost.available_rooms <= 0}
                >
                  {kost.available_rooms > 0 ? 'Booking Sekarang' : 'Tidak Tersedia'}
                </Button>

                {!user && (
                  <p className="text-xs text-center text-muted-foreground">
                    Login untuk melakukan booking
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KostDetail;
