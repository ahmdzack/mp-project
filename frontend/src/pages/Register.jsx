import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Alert, AlertDescription } from '../components/ui';
import { Home, Loader2, Eye, EyeOff, Building2, Search, CheckCircle, Mail, Smartphone } from 'lucide-react';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'pencari' // Default role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationType, setVerificationType] = useState('email'); // 'email' or 'phone'
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      
      // Add verification type to register data
      const dataWithVerificationType = {
        ...registerData,
        verificationType: verificationType
      };
      
      const response = await register(dataWithVerificationType);
      
      console.log('📦 Register response:', response);
      
      // Backend response structure: { success, message, data: { user, email, needsVerification, emailSent, verificationCode } }
      const { data } = response;
      
      // Check if superadmin (auto-verified) - no verification needed
      if (data && data.user && data.user.email_verified) {
        navigate('/login', { 
          state: { 
            message: 'Admin registration successful! You can login now.',
            email: data.email || data.user.email
          } 
        });
        return;
      }
      
      // Regular users need verification
      if (data && data.needsVerification) {
        setSuccess(true);
        setRegisteredEmail(data.email);
        
        // Show verification code if email service failed
        if (data.verificationCode) {
          setVerificationCode(data.verificationCode);
          console.log('🔢 VERIFICATION CODE:', data.verificationCode);
        }
        
        // Auto-redirect to appropriate verify page
        setTimeout(() => {
          if (verificationType === 'phone') {
            navigate('/verify-phone', { 
              state: { 
                phone: formData.phone,
                email: data.email 
              } 
            });
          } else {
            navigate('/verify-email', { state: { email: data.email } });
          }
        }, 2000);
      } else {
        // Fallback - shouldn't happen
        console.warn('⚠️ Unexpected response structure:', response);
        navigate('/');
      }
    } catch (err) {
      console.error('❌ Register error:', err);
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            {success ? <CheckCircle className="h-6 w-6 text-primary-foreground" /> : <Home className="h-6 w-6 text-primary-foreground" />}
          </div>
          <div>
            <CardTitle className="text-2xl">{success ? 'Registrasi Berhasil!' : 'Daftar'}</CardTitle>
            <CardDescription>
              {success ? 'Verifikasi email Anda untuk melanjutkan' : 'Buat akun baru untuk melanjutkan'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Registrasi Berhasil!
                    </p>
                    <p className="text-sm text-green-700">
                      Akun untuk <strong>{registeredEmail}</strong> telah dibuat.
                    </p>
                  </div>
                </div>
              </div>

              {verificationCode && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    ⚠️ Email Service Belum Dikonfigurasi
                  </p>
                  <p className="text-sm text-yellow-800 mb-3">
                    Gunakan kode verifikasi di bawah ini:
                  </p>
                  <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 mb-1">Kode Verifikasi Anda:</p>
                    <p className="text-3xl font-bold text-gray-900 tracking-widest">
                      {verificationCode}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Berlaku selama 1 jam</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Langkah Selanjutnya:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Klik tombol "Verifikasi Email Sekarang"</li>
                  <li>Masukkan kode verifikasi di atas</li>
                  <li>Login setelah verifikasi berhasil</li>
                </ol>
              </div>

              <Button 
                onClick={() => navigate('/verify-email', { state: { email: registeredEmail } })} 
                className="w-full"
              >
                Verifikasi Email Sekarang
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Daftar Sebagai</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'pencari' })}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    formData.role === 'pencari'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                  disabled={loading}
                >
                  <Search className="h-6 w-6" />
                  <span className="font-medium">Pencari Kost</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'pemilik' })}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    formData.role === 'pemilik'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                  disabled={loading}
                >
                  <Building2 className="h-6 w-6" />
                  <span className="font-medium">Pemilik Kost</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08123456789"
                required
                disabled={loading}
              />
            </div>

            {/* Verification Method Selection */}
            <div className="space-y-3">
              <Label>Metode Verifikasi</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerificationType('email')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    verificationType === 'email'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                  disabled={loading}
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-sm font-medium">Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationType('phone')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    verificationType === 'phone'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                  disabled={loading}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-sm font-medium">SMS/WhatsApp</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {verificationType === 'email' 
                  ? '✉️ Kode verifikasi akan dikirim ke email Anda' 
                  : '📱 Kode verifikasi akan dikirim via SMS ke nomor telepon Anda'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Sudah punya akun? </span>
            <Link to="/login" className="font-medium text-primary hover:underline">
              Login di sini
            </Link>
          </div>
        </>
        )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;
