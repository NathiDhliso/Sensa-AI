// Theme Context for Sensa AI
// Provides centralized theme management throughout the React app

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

// Define theme types
interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  border: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface PageTheme {
  background: string;
  card: string;
  accent: string;
  button: string;
  gradients: {
    memoryToLearning: string;
    transformation: string;
    wisdom: string;
    growth: string;
  };
}

export interface ThemeContextType {
  theme: ThemeColors;
  pageTheme: PageTheme;
  setPageTheme: (page: keyof typeof pageThemes) => void;
  isDark: boolean;
  toggleDark: () => void;
}

// Define base themes
const sensaTheme: ThemeColors = {
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    accent: '#e3f2fd',
    surface: '#ffffff'
  },
  text: {
    primary: '#1a1a1a',
    secondary: '#6b7280',
    accent: '#2563eb',
    muted: '#9ca3af'
  },
  border: {
    primary: '#e5e7eb',
    secondary: '#d1d5db',
    accent: '#3b82f6'
  }
};

const darkTheme: Partial<ThemeColors> = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#1e40af',
    surface: '#334155'
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    accent: '#60a5fa',
    muted: '#94a3b8'
  },
  border: {
    primary: '#475569',
    secondary: '#64748b',
    accent: '#3b82f6'
  }
};

// Import comprehensive page themes from styles
import { pageThemes, getPageTheme } from '../styles/themes';

// Create the theme context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
  defaultPage?: keyof typeof pageThemes;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
                                                              children,
                                                              defaultPage = 'home'
                                                            }) => {
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState<keyof typeof pageThemes>(defaultPage);

  // Get the current theme (light or dark)
  const currentTheme: ThemeColors = useMemo(() => {
    if (isDark) {
      return {
        background: { ...sensaTheme.background, ...darkTheme.background },
        text: { ...sensaTheme.text, ...darkTheme.text },
        border: { ...sensaTheme.border, ...darkTheme.border }
      };
    }
    return sensaTheme;
  }, [isDark]);

  // Get the current page theme
  const pageTheme = getPageTheme(currentPage);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;

    // Set CSS custom properties for dynamic theming
    Object.entries(currentTheme.background).forEach(([key, value]) => {
      root.style.setProperty(`--bg-${key}`, value);
    });

    Object.entries(currentTheme.text).forEach(([key, value]) => {
      root.style.setProperty(`--text-${key}`, value);
    });

    Object.entries(currentTheme.border).forEach(([key, value]) => {
      root.style.setProperty(`--border-${key}`, value);
    });

    // Add/remove dark class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark, currentTheme]);

  const setPageTheme = (page: keyof typeof pageThemes) => {
    setCurrentPage(page);
  };

  const toggleDark = () => {
    setIsDark(!isDark);
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    pageTheme: pageTheme,
    setPageTheme,
    isDark,
    toggleDark,
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

// Custom hook for page-specific theming
export const usePageTheme = (page: keyof typeof pageThemes) => {
  const { setPageTheme } = useTheme();

  useEffect(() => {
    setPageTheme(page);
  }, [page, setPageTheme]);

  return getPageTheme(page);
};

// Custom hook for component colors
export const useComponentColors = () => {
  const { theme, pageTheme } = useTheme();

  return {
    ...theme,
    pageAccent: pageTheme.accent,
    pageBackground: pageTheme.background,
    pageCard: pageTheme.card,
    pageButton: pageTheme.button,
    pageGradients: pageTheme.gradients
  };
};

// Create theme classes hook factory
export const createThemeClassesHook = (useThemeHook: () => ThemeContextType) => {
  return () => {
    const { theme, pageTheme } = useThemeHook();

    return {
      // Background classes
      bg: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        card: 'bg-white/60'
      },
      // Text classes
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      // Border classes
      border: {
        light: 'border-gray-200/60'
      },
      // Interactive classes
      interactive: {
        hover: 'hover:bg-white/80'
      },
      // Page-specific classes
      pageAccent: pageTheme.accent,
      pageBackground: pageTheme.background,
      pageCard: pageTheme.card,
      pageButton: pageTheme.button,
      pageGradients: pageTheme.gradients,
      // Utility functions
      getButtonClass: (variant: 'primary' | 'secondary' | 'accent' = 'primary') => {
        const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors';
        switch (variant) {
          case 'primary':
            return `${baseClass} bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90`;
          case 'secondary':
            return `${baseClass} bg-gray-50 text-gray-900 hover:opacity-90`;
          case 'accent':
            return `${baseClass} bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90`;
          default:
            return baseClass;
        }
      },
      getCardClass: () => {
        return `bg-white rounded-lg shadow-sm border border-gray-200`;
      }
    };
  };
};

// Utility hook for creating dynamic class names based on theme
export const useThemeClasses = createThemeClassesHook(useTheme);

// HOC for automatic page theme setting
export const withPageTheme = <P extends object>(
    Component: React.ComponentType<P>,
    page: keyof typeof pageThemes
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    usePageTheme(page);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPageTheme(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Theme-aware className builder
export const buildThemeClass = (
    baseClass: string,
    isDark: boolean,
    darkClass?: string
): string => {
  return isDark && darkClass ? `${baseClass} ${darkClass}` : baseClass;
};

export default ThemeContext;