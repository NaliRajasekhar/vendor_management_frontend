import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// const base = import.meta.env.VITE_API_BASE_URL


export default defineConfig({
  plugins: [react()],
  server: {
    // Optional dev proxy. Change target to your API server.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
