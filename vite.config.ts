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
    include: ['lucide-react', 'framer-motion', '@supabase/supabase-js'],
    force: true
  },
  server: {
    // Fix WebSocket connection issues
    port: 5175,
    host: true,
    hmr: {
      port: 5175,
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
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
          animation: ['framer-motion']
        }
      }
    }
  },
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
