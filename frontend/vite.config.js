import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import replacePlugin from './vite-replace-plugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from current directory (frontend/)
  const env = loadEnv(mode, '.', '')
  
  // FORCE production URL - NO EXCEPTION
  const apiUrl = mode === 'production' 
    ? 'https://mp-project-production.up.railway.app'
    : (env.VITE_API_URL || 'http://localhost:5000');
  
  const midtransKey = mode === 'production'
    ? 'Mid-client-cm0WvOH0yKDz0eEL'
    : (env.VITE_MIDTRANS_CLIENT_KEY || '');

  console.log('🔧 Vite Build Mode:', mode);
  console.log('🔗 VITE_API_URL:', apiUrl);
  console.log('💳 VITE_MIDTRANS_CLIENT_KEY:', midtransKey ? '***' + midtransKey.slice(-4) : 'not set');
  
  return {
    plugins: [
      react(),
      replacePlugin() // Plugin ekstrim untuk replace localhost
    ],
    server: {
      port: 5174,
      strictPort: true,
      host: true
    },
    // Force production API URL if building for production
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_MIDTRANS_CLIENT_KEY': JSON.stringify(midtransKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  }
})