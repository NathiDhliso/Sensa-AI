// Theme Context for Sensa AI - Components Only
// Provides centralized theme management throughout the React app

import React, { useState, useEffect, ReactNode, useContext } from 'react';
import {
  ThemeContext,
  type ThemeContextType,
  sensaTheme,
  pageThemes
} from './ThemeContextDefinition';



// Theme Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeColors>(sensaTheme);
  const [pageTheme, setCurrentPageTheme] = useState<PageTheme>(pageThemes.dashboard);
  const [isDark, setIsDark] = useState<boolean>(false);

  const setPageTheme = (page: keyof typeof pageThemes) => {
    setCurrentPageTheme(pageThemes[page]);
  };

  const toggleDark = () => {
    setIsDark(!isDark);
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', theme.text.primary);
    root.style.setProperty('--color-secondary', theme.text.secondary);
    root.style.setProperty('--color-accent', theme.text.accent);
    root.style.setProperty('--color-muted', theme.text.muted);
    root.style.setProperty('--bg-primary', theme.background.primary);
    root.style.setProperty('--bg-secondary', theme.background.secondary);
    root.style.setProperty('--bg-surface', theme.background.surface);
    root.style.setProperty('--border-primary', theme.border.primary);
    
    // Apply page theme
    root.style.setProperty('--page-background', pageTheme.background);
    root.style.setProperty('--page-card', pageTheme.card);
    root.style.setProperty('--page-accent', pageTheme.accent);
    root.style.setProperty('--page-button', pageTheme.button);
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
