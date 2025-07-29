import { useContext, useEffect } from 'react';
import { ThemeContext, type ThemeContextType } from './ThemeContext';

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Custom hook for page-specific theming
export const usePageTheme = (page: string) => {
  const { setPageTheme } = useTheme();

  useEffect(() => {
    setPageTheme(page as any);
  }, [page, setPageTheme]);
};

// Custom hook for component colors
export const useComponentColors = () => {
  const { theme } = useTheme();
  return theme;
};

// Utility hook for creating dynamic class names based on theme
export const useThemeClasses = () => {
  const { isDark, theme, pageTheme } = useTheme();

  return {
    isDark,
    theme,
    pageTheme,
    getThemeClass: (lightClass: string, darkClass: string) =>
      isDark ? darkClass : lightClass,
    conditionalClass: (condition: boolean, trueClass: string, falseClass: string = '') =>
      condition ? trueClass : falseClass,
  };
};

// Utility for getting responsive theme values
export const useResponsiveTheme = () => {
  const { theme } = useTheme();

  return {
    getResponsiveValue: (values: {
      mobile?: string;
      tablet?: string;
      desktop?: string;
    }) => {
      // This would typically use a media query hook
      // For now, return desktop value as default
      return values.desktop || values.tablet || values.mobile || '';
    },
    theme,
  };
};

// Utility for theme-aware animations
export const useThemeAnimations = () => {
  const { isDark } = useTheme();
  
  return {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: isDark ? 0.3 : 0.2 }
    },
    slideUp: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
      transition: { duration: isDark ? 0.4 : 0.3 }
    },
    scale: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
      transition: { duration: isDark ? 0.3 : 0.2 }
    }
  };
};

// Utility for theme-aware spacing
export const useThemeSpacing = () => {
  const { theme } = useTheme();

  return {
    getSpacing: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
      const spacingMap = {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      };
      return spacingMap[size];
    },
    theme,
  };
};
