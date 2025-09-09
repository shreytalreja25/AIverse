import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['bootstrap', 'react-bootstrap']
        }
      }
    }
  },
  server: {
    allowedHosts: [
      '0aaa-106-219-158-59.ngrok-free.app',  // Add the host you are trying to use,
      'https://aiverse-sbs6.onrender.com'
    ],
    host: true,  // Allow external access if needed
    port: 5173   // Ensure you're using the correct port
  }
});
