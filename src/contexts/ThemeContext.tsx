// Theme Context for Sensa AI - Components Only
// Provides centralized theme management throughout the React app

import React, { createContext, useState, useEffect, ReactNode } from 'react';

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
    secondary: '#f8fafc',
    accent: '#e2e8f0',
    surface: '#f1f5f9'
  },
  text: {
    primary: '#1e293b',
    secondary: '#475569',
    accent: '#3b82f6',
    muted: '#64748b'
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    accent: '#94a3b8'
  }
};

// Define page-specific themes - USING ORIGINAL SENSA BRAND COLORS
const pageThemes = {
  home: {
    background: 'bg-gradient-to-br from-purple-50 via-orange-50 to-pink-50',
    card: 'bg-white/80 backdrop-blur-sm border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-600 to-orange-500',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
      transformation: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
      wisdom: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
      growth: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)'
    }
  },
  auth: {
    background: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
    card: 'bg-white/90 backdrop-blur-md border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-600 to-orange-500',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
      transformation: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
      wisdom: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
      growth: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)'
    }
  },
  dashboard: {
    background: 'bg-gradient-to-br from-purple-50 via-white to-orange-50',
    card: 'bg-white/80 backdrop-blur-sm border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-600 to-orange-500',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
      transformation: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
      wisdom: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
      growth: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)'
    }
  },
  memory: {
    background: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
    card: 'bg-white/90 backdrop-blur-md border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-700 to-pink-500',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
      transformation: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
      wisdom: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
      growth: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)'
    }
  },
  course: {
    background: 'bg-gradient-to-br from-amber-50 via-white to-emerald-50',
    card: 'bg-white/85 backdrop-blur-sm border-amber-200/50',
    accent: 'text-amber-600',
    button: 'bg-gradient-to-r from-amber-500 to-emerald-500',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
      transformation: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
      wisdom: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
      growth: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)'
    }
  },
  epistemicDriver: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    accent: '#ec4899',
    button: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      transformation: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      wisdom: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      growth: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  },
  businessLens: {
    background: 'bg-gradient-to-br from-orange-50 via-white to-red-50',
    card: 'bg-white/90 backdrop-blur-sm border-orange-200/50',
    accent: 'text-orange-600',
    button: 'bg-gradient-to-r from-orange-500 to-red-500',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
      transformation: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
      wisdom: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
      growth: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)'
    }
  }
};

// Create context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeColors>(sensaTheme);
  const [pageTheme, setCurrentPageTheme] = useState<PageTheme>(pageThemes.home);
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

    // Apply body background for immediate visual effect
    document.body.className = pageTheme.background;
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

export default ThemeContext;
