import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '10.176.18.41',
    port: 5005,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})