import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Alert, AlertDescription } from '../components/ui';
import { Home, Loader2, Eye, EyeOff, Mail, CheckCircle, RefreshCw } from 'lucide-react';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setResendMessage('Silakan masukkan email terlebih dahulu');
      setTimeout(() => setResendMessage(''), 5000);
      return;
    }

    setResending(true);
    setResendMessage('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('Kode verifikasi berhasil dikirim ulang! Cek inbox atau console.');
        
        // Log code to console in development
        if (data.data?.verificationCode) {
          console.log('🔢 VERIFICATION CODE:', data.data.verificationCode);
          console.log('💡 TIP: Gunakan kode ini untuk verifikasi email');
        }

        // Clear success message after 5 seconds
        setTimeout(() => setResendMessage(''), 5000);
      } else {
        setResendMessage(data.message || 'Gagal mengirim ulang kode verifikasi');
        setTimeout(() => setResendMessage(''), 5000);
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setResendMessage('Terjadi kesalahan saat mengirim ulang kode');
      setTimeout(() => setResendMessage(''), 5000);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      await login(formData);
      navigate('/');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.needsVerification) {
        setNeedsVerification(true);
        setError(errorData.message || 'Silakan verifikasi email Anda terlebih dahulu.');
      } else {
        setError(errorData?.message || 'Login gagal. Periksa email dan password Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Masuk ke akun Anda untuk melanjutkan</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {needsVerification && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200">
              <Mail className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-2">
                  <p><strong>Email belum diverifikasi.</strong> Silakan cek inbox Anda dan masukkan kode verifikasi.</p>
                  
                  {resendMessage && (
                    <p className={`text-sm ${resendMessage.includes('berhasil') ? 'text-green-700' : 'text-red-700'}`}>
                      {resendMessage}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Mengirim ulang...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Kirim ulang kode
                        </>
                      )}
                    </button>
                    <span className="text-sm text-gray-500">atau</span>
                    <Link to="/verify-email" state={{ email: formData.email }} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Verifikasi sekarang
                    </Link>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-1">
                    💡 Cek console browser (F12) untuk melihat kode di development mode
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Belum punya akun? </span>
            <Link to="/register" className="font-medium text-primary hover:underline">
              Daftar di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
