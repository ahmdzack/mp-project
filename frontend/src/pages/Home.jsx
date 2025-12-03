import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Button, Card, CardContent, Badge } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { Search, Shield, Clock, CreditCard, MapPin, Wifi, Star, Loader2, Navigation } from 'lucide-react';
import MapView, { calculateDistance } from '../components/Map';

function Home() {
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyKosts, setNearbyKosts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchKosts = async () => {
      try {
        const { data } = await api.get('/kost', {
          signal: abortController.signal
        });
        setKosts(data.data || []);
      } catch (err) {
        if (err.name === 'CanceledError') {
          return; // Ignore abort errors
        }
        setError('Gagal memuat data kost');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchKosts();

    return () => {
      abortController.abort();
    };
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
        }
      );
    }
  }, []);

  // Calculate nearby kosts
  useEffect(() => {
    if (userLocation && kosts.length > 0) {
      const kostsWithDistance = kosts
        .filter(kost => kost.latitude && kost.longitude)
        .map(kost => ({
          ...kost,
          distance: calculateDistance(
            userLocation[0],
            userLocation[1],
            parseFloat(kost.latitude),
            parseFloat(kost.longitude)
          )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // Top 5 terdekat
      
      setNearbyKosts(kostsWithDistance);
    }
  }, [userLocation, kosts]);

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

  const handleKostClick = (kostId) => {
    navigate(`/kost/${kostId}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/kost?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const featuredKosts = kosts.slice(0, 3);

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

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchKosts}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Temukan Kost Impian Anda dengan <span className="text-primary">Mudah</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                KostKu membantu Anda menemukan hunian yang nyaman dan sesuai budget. Proses reservasi cepat, aman, dan transparan.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari lokasi atau nama kost..."
                    className="h-12 w-full rounded-md border border-input bg-background px-3 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button size="lg" className="h-12" onClick={handleSearch}>
                  Cari Kost
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{kosts.length}+ Kost</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Terverifikasi</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Booking Instan</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                {kosts[0]?.images?.[0]?.image_url ? (
                  <img 
                    src={kosts[0].images[0].image_url} 
                    alt="Kost modern" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <MapPin className="h-24 w-24" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Mengapa Memilih KostKu?</h2>
            <p className="mt-4 text-muted-foreground">
              Kami menyediakan pengalaman pencarian dan reservasi kost terbaik
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card className="text-center border-border">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Pencarian Mudah</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Filter berdasarkan lokasi, harga, dan fasilitas untuk menemukan kost yang sempurna
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Terverifikasi</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Semua kost telah diverifikasi untuk memastikan kualitas dan keamanan
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Pembayaran Aman</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sistem pembayaran yang aman dan transparan dengan berbagai metode
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Kosts */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Map Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {showMap ? 'Peta Lokasi Kost' : 'Kost Terbaru'}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {showMap 
                  ? 'Lihat lokasi kost di peta dan temukan yang terdekat' 
                  : 'Kost-kost terbaru yang baru saja ditambahkan'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={showMap ? 'default' : 'outline'} 
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Peta
              </Button>
              <Button 
                variant={!showMap ? 'default' : 'outline'} 
                onClick={() => setShowMap(false)}
              >
                Daftar
              </Button>
            </div>
          </div>

          {/* Map View */}
          {showMap && (
            <div className="mb-8">
              <Card className="overflow-hidden">
                <MapView
                  kosts={kosts.filter(k => k.latitude && k.longitude)}
                  zoom={12}
                  height="500px"
                  showUserLocation={true}
                  onKostClick={handleKostClick}
                />
              </Card>
              
              {/* Nearby Kosts List */}
              {nearbyKosts.length > 0 && userLocation && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    Kost Terdekat dari Lokasi Anda
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {nearbyKosts.map((kost) => (
                      <Card 
                        key={kost.id} 
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleKostClick(kost.id)}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          {kost.images && kost.images.length > 0 ? (
                            <img 
                              src={kost.images[0].image_url} 
                              alt={kost.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <MapPin className="h-16 w-16" />
                            </div>
                          )}
                          <Badge className="absolute top-2 right-2 bg-primary">
                            {kost.distance.toFixed(1)} km
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold line-clamp-1">{kost.name}</h4>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-xl font-bold text-primary">
                              {formatCurrency(kost.price_monthly)}
                            </span>
                            <span className="text-xs text-muted-foreground">/bulan</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{kost.city}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {!showMap && (
            <>
              {featuredKosts.length === 0 ? (
                <div className="mt-8 text-center py-12">
                  <p className="text-muted-foreground">Belum ada kost tersedia saat ini</p>
                </div>
              ) : (
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featuredKosts.map((kost) => (
                <Card 
                  key={kost.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleKostClick(kost.id)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {kost.images && kost.images.length > 0 ? (
                      <img 
                        src={kost.images[0].image_url} 
                        alt={kost.name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <MapPin className="h-16 w-16" />
                      </div>
                    )}
                    {kost.images && kost.images.length > 1 && (
                      <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground">
                        +{kost.images.length - 1} foto
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-1">{kost.name}</h3>
                    
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(kost.price_monthly)}
                      </span>
                      <span className="text-sm text-muted-foreground">/bulan</span>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{kost.address}</span>
                    </div>

                    {kost.Facilities && kost.Facilities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {kost.Facilities.slice(0, 3).map((facility, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {facility.name}
                          </Badge>
                        ))}
                        {kost.Facilities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{kost.Facilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-muted-foreground">
                        {kost.KostType?.name || 'Kost'}
                      </span>
                      <span className="text-sm font-medium">
                        {kost.available_rooms || 0} kamar tersedia
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

              {/* Tombol Lebih Banyak */}
              {kosts.length > 3 && (
                <div className="mt-12 text-center">
                  <Button size="lg" asChild className="min-w-[200px]">
                    <Link to="/kost" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Lebih Banyak Kost
                    </Link>
                  </Button>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Lihat {kosts.length - 3}+ kost lainnya
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section - Only show for non-logged in users */}
      {!isLoggedIn && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-primary px-8 py-16 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground">Siap Menemukan Kost Impian?</h2>
              <p className="mt-4 text-primary-foreground/80">
                Daftar sekarang dan dapatkan akses ke ribuan kost terverifikasi
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/register">Daftar Gratis</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-primary-foreground/20"
                  asChild
                >
                  <Link to="/kost">Jelajahi Kost</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
