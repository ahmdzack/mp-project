import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from current directory (frontend/)
  const env = loadEnv(mode, '.', '')
  
  console.log('🔧 Vite Build Mode:', mode);
  console.log('🔗 VITE_API_URL:', env.VITE_API_URL);
  
  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      host: true
    },
    // Force production API URL if building for production
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'production' 
          ? 'https://mp-project-production.up.railway.app'
          : (env.VITE_API_URL || 'http://localhost:5000')
      ),
      'import.meta.env.VITE_MIDTRANS_CLIENT_KEY': JSON.stringify(
        env.VITE_MIDTRANS_CLIENT_KEY || 'Mid-client-cm0WvOH0yKDz0eEL'
      ),
    }
  }
})