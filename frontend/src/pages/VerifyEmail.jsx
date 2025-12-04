import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, XCircle, Loader2, Mail, Shield, RefreshCw } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    if (!email) {
      setResendMessage('Email harus diisi');
      return;
    }

    setResending(true);
    setResendMessage('');

    try {
      const response = await api.post('/auth/resend-verification', { email });

      setResendMessage('✅ Kode verifikasi baru telah dikirim! Check inbox Anda.');
      
      // If in development, show code in console
      if (response.data?.data?.verificationCode) {
        const verificationCode = response.data.data.verificationCode;
        console.log('🔢 NEW VERIFICATION CODE:', verificationCode);
        setResendMessage(`✅ Kode baru dikirim! (Dev: ${verificationCode})`);
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setResendMessage(''), 5000);
    } catch (error) {
      setResendMessage('❌ ' + (error.response?.data?.message || 'Gagal mengirim ulang kode'));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !code) {
      setStatus('error');
      setMessage('Email dan kode verifikasi harus diisi');
      return;
    }

    if (code.length !== 6) {
      setStatus('error');
      setMessage('Kode verifikasi harus 6 digit');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await api.post('/auth/verify-email', { email, code });

      setStatus('success');
      setMessage(response.data.message);
      
      // Countdown redirect
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Verifikasi gagal. Kode mungkin salah atau sudah kadaluarsa.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        
        {/* Form State */}
        {(status === 'idle' || status === 'loading' || status === 'error') && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifikasi Email
              </h2>
              <p className="text-gray-600 text-sm">
                Masukkan kode verifikasi 6 digit yang telah dikirim ke email Anda
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Verifikasi
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={status === 'loading'}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Kode 6 digit dari email
                </p>
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{message}</p>
                  </div>
                </div>
              )}

              {resendMessage && (
                <div className={`border rounded-lg p-4 ${resendMessage.startsWith('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-sm ${resendMessage.startsWith('✅') ? 'text-green-800' : 'text-red-800'}`}>
                    {resendMessage}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi Email'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Tidak menerima email?
              </p>
              <button 
                type="button"
                onClick={handleResend}
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
            </div>
          </div>
        )}
        
        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifikasi Berhasil! ✅
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Email Anda telah berhasil diverifikasi. Sekarang Anda dapat login dan menggunakan semua fitur aplikasi.
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Mengalihkan ke halaman login dalam <span className="font-bold text-blue-600">{countdown}</span> detik...
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Login Sekarang
              </button>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifikasi Gagal ❌
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-red-800 font-medium mb-1">
                    Kemungkinan Penyebab:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    <li>Link verifikasi sudah kadaluarsa (max 1 jam)</li>
                    <li>Link sudah pernah digunakan</li>
                    <li>Email sudah terverifikasi sebelumnya</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ke Halaman Login
              </button>
              <p className="text-sm text-gray-600">
                Belum menerima email?{' '}
                <button 
                  onClick={() => navigate('/resend-verification')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Kirim ulang email verifikasi
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
