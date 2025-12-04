import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      host: true
    },
    // Expose env variables to the app
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:5000'),
      'import.meta.env.VITE_MIDTRANS_CLIENT_KEY': JSON.stringify(env.VITE_MIDTRANS_CLIENT_KEY || ''),
    }
  }
})