import { StrictMode, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';

const rootElement = document.getElementById('root')!;

// Decide whether to wrap in StrictMode (DEV only) to avoid double-render flicker in prod
const Wrapper: React.ComponentType<{ children: React.ReactNode }> =
  import.meta.env.MODE === 'development' ? StrictMode : Fragment;

createRoot(rootElement).render(
  <Wrapper>
    <App />
  </Wrapper>
);