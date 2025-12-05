import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Input, 
  Label, 
  Alert, 
  AlertDescription 
} from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { Calendar, Clock, User, Mail, Phone, ArrowLeft, ArrowRight, Loader2, MapPin, ChevronDown, Check } from 'lucide-react';
import { format, addWeeks, addMonths, addYears } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

function Booking() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  console.log('🔵 Booking component mounted/updated', { id, user: user?.email });
  
  const [kost, setKost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    checkInDate: '',
    durationType: 'monthly', // 'weekly', 'monthly', 'yearly'
    duration: 1,
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: user?.phone || ''
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user && id) {
      fetchKostDetail();
    }
  }, [id, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchKostDetail = async () => {
    try {
      const { data } = await api.get(`/kost/${id}`);
      console.log('📊 Kost Data:', {
        name: data.data.name,
        price_monthly: data.data.price_monthly,
        price_weekly: data.data.price_weekly,
        price_yearly: data.data.price_yearly,
        hasWeekly: !!data.data.price_weekly,
        hasYearly: !!data.data.price_yearly
      });
      setKost(data.data);
    } catch (err) {
      setError('Gagal memuat detail kost');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotal = () => {
    if (!kost) return 0;
    
    const duration = parseInt(formData.duration);
    
    switch (formData.durationType) {
      case 'weekly':
        return (kost.price_weekly || kost.price_monthly / 4) * duration;
      case 'monthly':
        return kost.price_monthly * duration;
      case 'yearly':
        return (kost.price_yearly || kost.price_monthly * 12) * duration;
      default:
        return kost.price_monthly * duration;
    }
  };

  const calculateCheckOutDate = () => {
    if (!formData.checkInDate) return null;
    const checkIn = new Date(formData.checkInDate);
    const duration = parseInt(formData.duration);
    
    switch (formData.durationType) {
      case 'weekly':
        return addWeeks(checkIn, duration);
      case 'monthly':
        return addMonths(checkIn, duration);
      case 'yearly':
        return addYears(checkIn, duration);
      default:
        return addMonths(checkIn, duration);
    }
  };

  const getDurationLabel = () => {
    switch (formData.durationType) {
      case 'weekly':
        return 'minggu';
      case 'monthly':
        return 'bulan';
      case 'yearly':
        return 'tahun';
      default:
        return 'bulan';
    }
  };

  const getPricePerPeriod = () => {
    if (!kost) return 0;
    
    switch (formData.durationType) {
      case 'weekly':
        return kost.price_weekly || kost.price_monthly / 4;
      case 'monthly':
        return kost.price_monthly;
      case 'yearly':
        return kost.price_yearly || kost.price_monthly * 12;
      default:
        return kost.price_monthly;
    }
  };

  const getDurationTypeLabel = () => {
    switch (formData.durationType) {
      case 'weekly':
        return 'Mingguan';
      case 'monthly':
        return 'Bulanan';
      case 'yearly':
        return 'Tahunan';
      default:
        return 'Bulanan';
    }
  };

  const getDurationOptions = () => {
    const options = [];
    console.log('🔍 Checking duration options:', {
      kostExists: !!kost,
      price_weekly: kost?.price_weekly,
      price_yearly: kost?.price_yearly
    });
    
    if (kost?.price_weekly) {
      options.push({ value: 'weekly', label: 'Mingguan' });
    }
    options.push({ value: 'monthly', label: 'Bulanan' });
    if (kost?.price_yearly) {
      options.push({ value: 'yearly', label: 'Tahunan' });
    }
    
    console.log('✅ Available options:', options);
    return options;
  };

  const handleDurationTypeSelect = (value) => {
    setFormData({
      ...formData,
      durationType: value
    });
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi form
    if (!formData.checkInDate) {
      setError('Tanggal check-in harus diisi');
      return;
    }

    if (!formData.guestName || !formData.guestEmail || !formData.guestPhone) {
      setError('Data tamu (nama, email, telepon) harus diisi lengkap');
      return;
    }

    if (parseInt(formData.duration) < 1) {
      setError('Durasi minimal adalah 1 ' + getDurationLabel());
      return;
    }

    console.log('👤 Current user:', user);
    console.log('🔑 User role:', user?.role);

    setSubmitting(true);

    try {
      console.log('🎯 Submitting booking with data:', {
        kost_id: parseInt(id),
        check_in_date: formData.checkInDate,
        duration_type: formData.durationType,
        duration: parseInt(formData.duration),
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: formData.guestPhone
      });

      const bookingData = {
        kost_id: parseInt(id),
        check_in_date: formData.checkInDate,
        duration_type: formData.durationType,
        duration: parseInt(formData.duration),
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: formData.guestPhone
      };

      console.log('📤 Sending POST request to /bookings');
      const { data } = await api.post('/bookings', bookingData);
      console.log('✅ Booking created successfully:', data);
      
      // Redirect to payment page
      navigate(`/payment/${data.data.id}`);
    } catch (err) {
      console.error('❌ Booking error:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        data: err.response?.data,
        error: err
      });
      
      // Handle 403 Forbidden - likely due to role mismatch
      if (err.response?.status === 403) {
        setError(`Akses ditolak. Role Anda saat ini: "${user?.role}". Hanya pengguna dengan role "pencari" yang dapat membuat booking. Silakan hubungi admin jika ini adalah kesalahan.`);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Data booking tidak valid. Silakan periksa kembali.');
      } else if (err.response?.status === 404) {
        setError('Kost tidak ditemukan atau sudah tidak tersedia.');
      } else {
        setError(err.response?.data?.message || 'Booking gagal. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!kost) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Kost tidak ditemukan</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const checkOutDate = calculateCheckOutDate();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(`/kost/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Kost
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Kost Info */}
                <div className="mb-6 rounded-lg bg-muted/50 p-4">
                  <h3 className="font-semibold text-lg mb-2">{kost.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{kost.address}</span>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Harga: </span>
                    <span className="font-semibold text-primary">{formatCurrency(kost.price_monthly)}/bulan</span>
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Date Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="checkInDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal Check-in
                      </Label>
                      <Input
                        id="checkInDate"
                        type="date"
                        name="checkInDate"
                        value={formData.checkInDate}
                        onChange={handleChange}
                        min={today}
                        required
                        disabled={submitting}
                        className="mt-2"
                      />
                    </div>

                    {/* Tipe Sewa - Custom Dropdown */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        Tipe Sewa
                      </Label>
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          disabled={submitting}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-gray-700 font-medium">
                            {getDurationTypeLabel()}
                          </span>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                            <div className="py-1">
                              {getDurationOptions().map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleDurationTypeSelect(option.value)}
                                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                                    formData.durationType === option.value
                                      ? 'bg-green-50 text-green-700 font-medium'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {formData.durationType === option.value && (
                                    <Check className="h-5 w-5 text-green-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lama Sewa - Muncul di bawah Tipe Sewa */}
                    <div>
                      <Label htmlFor="duration">
                        Lama Sewa ({getDurationLabel()})
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        min="1"
                        max={formData.durationType === 'weekly' ? '52' : formData.durationType === 'monthly' ? '24' : '5'}
                        required
                        disabled={submitting}
                        className="mt-2"
                        placeholder={`Masukkan jumlah ${getDurationLabel()}`}
                      />
                    </div>
                  </div>

                  {/* Guest Data */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Data Penyewa
                    </h3>
                    
                    <div>
                      <Label htmlFor="guestName">Nama Lengkap</Label>
                      <Input
                        id="guestName"
                        type="text"
                        name="guestName"
                        value={formData.guestName}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="guestEmail" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        name="guestEmail"
                        value={formData.guestEmail}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="guestPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        No. Telepon
                      </Label>
                      <Input
                        id="guestPhone"
                        type="tel"
                        name="guestPhone"
                        value={formData.guestPhone}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitting ? 'Memproses...' : (
                      <>
                        Lanjut ke Pembayaran
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary Section (Sticky) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Ringkasan Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-medium">
                      {formData.checkInDate ? 
                        format(new Date(formData.checkInDate), 'dd MMMM yyyy', { locale: idLocale }) 
                        : '-'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">
                      {checkOutDate ? 
                        format(checkOutDate, 'dd MMMM yyyy', { locale: idLocale }) 
                        : '-'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durasi:</span>
                    <span className="font-medium">{formData.duration} {getDurationLabel()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga/{getDurationLabel()}:</span>
                    <span className="font-medium">{formatCurrency(getPricePerPeriod())}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p>💡 Harga sudah termasuk biaya booking</p>
                  <p className="mt-1">🔒 Pembayaran aman dengan Midtrans</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;
