import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Hardcode API URL để đảm bảo được embed vào bundle khi build
    'import.meta.env.VITE_API_URL': JSON.stringify('https://salon-p2ww.onrender.com'),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})

