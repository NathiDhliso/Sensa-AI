import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Fix React Refresh issues
    include: "**/*.{jsx,tsx}",
    exclude: /node_modules/,
  })],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Fix WebSocket connection issues
    port: 5173,
    host: true,
    hmr: {
      port: 5173,
    }
  },
  // Fix module resolution
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Fix build issues
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  // Prevent service worker caching issues
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
