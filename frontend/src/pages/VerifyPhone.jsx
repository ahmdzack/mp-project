import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendPhoneOTP, verifyPhoneOTP } from '../config/supabase';
import api from '../api/axios';
import { CheckCircle, XCircle, Loader2, Smartphone, Shield, RefreshCw } from 'lucide-react';

const VerifyPhone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneFromState = location.state?.phone || '';
  const emailFromState = location.state?.email || '';
  
  const [phone, setPhone] = useState(phoneFromState);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Auto send OTP on mount if phone exists
  useEffect(() => {
    if (phone && !otpSent) {
      handleSendOTP();
    }
  }, []);

  const handleSendOTP = async () => {
    if (!phone) {
      setResendMessage('Nomor telepon harus diisi');
      return;
    }

    setResending(true);
    setResendMessage('');

    try {
      // Format phone number to international format (e.g., +62812...)
      let formattedPhone = phone;
      if (phone.startsWith('0')) {
        formattedPhone = '+62' + phone.substring(1);
      } else if (!phone.startsWith('+')) {
        formattedPhone = '+62' + phone;
      }

      await sendPhoneOTP(formattedPhone);
      setOtpSent(true);
      setResendMessage('✅ Kode OTP telah dikirim ke nomor telepon Anda via SMS');
      
      setTimeout(() => setResendMessage(''), 5000);
    } catch (error) {
      console.error('Send OTP error:', error);
      setResendMessage('❌ ' + (error.message || 'Gagal mengirim OTP. Pastikan nomor telepon benar.'));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phone || !code) {
      setStatus('error');
      setMessage('Nomor telepon dan kode OTP harus diisi');
      return;
    }

    if (code.length !== 6) {
      setStatus('error');
      setMessage('Kode OTP harus 6 digit');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // Format phone number
      let formattedPhone = phone;
      if (phone.startsWith('0')) {
        formattedPhone = '+62' + phone.substring(1);
      } else if (!phone.startsWith('+')) {
        formattedPhone = '+62' + phone;
      }

      // Verify OTP with Supabase
      await verifyPhoneOTP(formattedPhone, code);

      // Update phone verification status in our backend
      await api.post('/auth/verify-phone', { 
        email: emailFromState,
        phone: phone,
        verified: true 
      });

      setStatus('success');
      setMessage('Nomor telepon berhasil diverifikasi!');
      
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
      console.error('Verify OTP error:', error);
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        error.message ||
        'Verifikasi gagal. Kode OTP mungkin salah atau sudah kadaluarsa.'
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
                <Smartphone className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifikasi Nomor Telepon
              </h2>
              <p className="text-gray-600 text-sm">
                Masukkan kode OTP 6 digit yang telah dikirim ke nomor telepon Anda
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={status === 'loading' || otpSent}
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Kode OTP
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
                    Kode 6 digit dari SMS
                  </p>
                </div>
              )}

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

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={resending}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Mengirim OTP...
                    </>
                  ) : (
                    'Kirim Kode OTP'
                  )}
                </button>
              ) : (
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
                    'Verifikasi Nomor'
                  )}
                </button>
              )}
            </form>

            {otpSent && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Tidak menerima OTP?
                </p>
                <button 
                  type="button"
                  onClick={handleSendOTP}
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
                      Kirim ulang OTP
                    </>
                  )}
                </button>
              </div>
            )}
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
                Nomor telepon Anda telah berhasil diverifikasi. Sekarang Anda dapat login dan menggunakan semua fitur aplikasi.
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
      </div>
    </div>
  );
};

export default VerifyPhone;
