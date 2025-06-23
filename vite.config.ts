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
  // This `define` block makes environment variables available in your client-side code
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)
  }
});
