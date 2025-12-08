import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

// Log environment info for debugging
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('🔗 API URL:', import.meta.env.VITE_API_URL);
console.log('📦 Vercel Env:', import.meta.env.VERCEL_ENV || 'local');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
