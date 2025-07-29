// Theme Context for Sensa AI - Components Only
// Provides centralized theme management throughout the React app

import React, { useState, useEffect, ReactNode, useContext } from 'react';
import {
  ThemeContext,
  type ThemeContextType,
  type ThemeColors,
  type PageTheme,
  sensaTheme,
  pageThemes
} from './ThemeContextDefinition';



// Theme Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeColors>(sensaTheme || {
    background: { primary: '#ffffff', secondary: '#f8fafc', accent: '#e2e8f0', surface: '#f1f5f9' },
    text: { primary: '#1e293b', secondary: '#475569', accent: '#3b82f6', muted: '#64748b' },
    border: { primary: '#e2e8f0', secondary: '#cbd5e1', accent: '#94a3b8' }
  });
  const [pageTheme, setCurrentPageTheme] = useState<PageTheme>(pageThemes?.dashboard || {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    card: 'rgba(255, 255, 255, 0.1)',
    accent: '#3b82f6',
    button: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      transformation: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      wisdom: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      growth: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  });
  const [isDark, setIsDark] = useState<boolean>(false);

  const setPageTheme = (page: keyof typeof pageThemes) => {
    if (pageThemes && pageThemes[page]) {
      setCurrentPageTheme(pageThemes[page]);
    }
  };

  const toggleDark = () => {
    setIsDark(!isDark);
  };

  // Apply theme to document
  useEffect(() => {
    if (typeof document === 'undefined') return; // SSR safety

    const root = document.documentElement;

    // Apply CSS custom properties with fallbacks
    if (theme?.text) {
      root.style.setProperty('--color-primary', theme.text.primary || '#1e293b');
      root.style.setProperty('--color-secondary', theme.text.secondary || '#475569');
      root.style.setProperty('--color-accent', theme.text.accent || '#3b82f6');
      root.style.setProperty('--color-muted', theme.text.muted || '#64748b');
    }

    if (theme?.background) {
      root.style.setProperty('--bg-primary', theme.background.primary || '#ffffff');
      root.style.setProperty('--bg-secondary', theme.background.secondary || '#f8fafc');
      root.style.setProperty('--bg-surface', theme.background.surface || '#f1f5f9');
    }

    if (theme?.border) {
      root.style.setProperty('--border-primary', theme.border.primary || '#e2e8f0');
    }

    // Apply page theme with fallbacks
    if (pageTheme) {
      root.style.setProperty('--page-background', pageTheme.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
      root.style.setProperty('--page-card', pageTheme.card || 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--page-accent', pageTheme.accent || '#3b82f6');
      root.style.setProperty('--page-button', pageTheme.button || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)');
    }
  }, [theme, pageTheme]);

  const value: ThemeContextType = {
    theme,
    pageTheme,
    setPageTheme,
    isDark,
    toggleDark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
