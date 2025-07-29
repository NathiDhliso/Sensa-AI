import { StrictMode, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';

// Pre-initialize theme to prevent runtime errors
import { sensaTheme, pageThemes } from './contexts/ThemeContextDefinition';

// Validate theme objects are properly loaded
if (!sensaTheme || !sensaTheme.background) {
  console.error('Critical: sensaTheme not properly initialized');
}
if (!pageThemes || !pageThemes.dashboard) {
  console.error('Critical: pageThemes not properly initialized');
}

// Prevent initial flicker by hiding the app root until first paint is ready
const rootElement = document.getElementById('root')!;
rootElement.style.visibility = 'hidden';

// Decide whether to wrap in StrictMode (DEV only) to avoid double-render flicker in prod
const Wrapper: React.ComponentType<{ children: React.ReactNode }> =
  import.meta.env.MODE === 'development' ? StrictMode : Fragment;

createRoot(rootElement).render(
  <Wrapper>
    <App />
  </Wrapper>
);

// Reveal the app once React has mounted (next frame)
requestAnimationFrame(() => {
  rootElement.style.visibility = 'visible';
});