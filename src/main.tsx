import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';

// Environment variable debugging
console.log('🔍 Environment check:');
console.log('   - isDevelopment:', import.meta.env.DEV);
console.log('   - VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('   - VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('   - URL length:', (import.meta.env.VITE_SUPABASE_URL || '').length);
console.log('   - Key length:', (import.meta.env.VITE_SUPABASE_ANON_KEY || '').length);

// Only log actual values in development for security
if (import.meta.env.DEV) {
  console.log('   - VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('   - VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// Clean up any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(const registration of registrations) {
      registration.unregister().then(() => {
        console.log('🧹 Cleaned up service worker:', registration.scope);
      });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);