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
    include: [
      'lucide-react',
      'framer-motion',
      '@supabase/supabase-js',
      'react',
      'react-dom',
      'react-router-dom'
    ],
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  server: {
    // Production-ready server configuration
    port: 5175,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      port: 5175,
      host: 'localhost',
      clientPort: 5175,
      overlay: false // Disable error overlay in production
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    },
    cors: true,
    headers: {
      'Cache-Control': 'no-cache'
    }
  },
  // Fix module resolution
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Production-ready build configuration
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
          animation: ['framer-motion'],
          router: ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
