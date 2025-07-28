// Theme utility functions and constants
// Separated from ThemeContext to avoid React refresh warnings

import React from 'react';
// Note: You will need to create this file and export the items from it.
import { pageThemes, componentColors, getPageTheme, getComponentColor } from '../styles/themes';

// Defines the shape of the theme context hook's return value
type UseThemeType = () => {
  isDark: boolean;
  setPageTheme: (page: keyof typeof pageThemes) => void;
};

// Custom hook for page-specific theming
export const createPageThemeHook = (useTheme: UseThemeType) => {
  return (page: keyof typeof pageThemes) => {
    const { setPageTheme } = useTheme();

    useEffect(() => {
      if (setPageTheme) {
        setPageTheme(page);
      }
    }, [page, setPageTheme]);

    return getPageTheme(page);
  };
};

// Utility for component colors (Renamed from createComponentColorsHook)
export const createComponentColors = () => {
  return (component: keyof typeof componentColors) => {
    return {
      getColor: (variant?: string) => getComponentColor(component, variant),
      colors: componentColors[component],
    };
  };
};

// Utility hook for creating dynamic class names based on theme
export const createThemeClassesHook = (useTheme: UseThemeType) => {
  return () => {
    const { isDark } = useTheme();

    return {
      // Background classes
      bg: {
        primary: isDark ? 'bg-gray-900' : 'bg-white',
        secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
        accent: isDark ? 'bg-blue-900' : 'bg-blue-50',
        card: isDark ? 'bg-gray-800' : 'bg-white',
        overlay: isDark ? 'bg-black/50' : 'bg-white/50',
      },
      // Text classes
      text: {
        primary: isDark ? 'text-white' : 'text-gray-900',
        secondary: isDark ? 'text-gray-300' : 'text-gray-600',
        tertiary: isDark ? 'text-gray-400' : 'text-gray-500',
        accent: isDark ? 'text-blue-400' : 'text-blue-600',
        muted: isDark ? 'text-gray-500' : 'text-gray-400',
      },
      // Border classes
      border: {
        primary: isDark ? 'border-gray-700' : 'border-gray-200',
        accent: isDark ? 'border-blue-600' : 'border-blue-300',
        focus: isDark ? 'border-blue-500' : 'border-blue-400',
      },
      // Button classes
      button: {
        primary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
        secondary: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
        danger: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600',
        disabled: isDark ? 'disabled:bg-gray-800' : 'disabled:bg-gray-100',
      },
    };
  };
};

// HOC for automatic page theme setting
export const createPageThemeHOC = (usePageTheme: (page: keyof typeof pageThemes) => unknown) => {
  // This is a function that returns a component, which contains JSX.
  // This requires the .tsx file extension.
  return <P extends object>(
      WrappedComponent: React.ComponentType<P>,
      page: keyof typeof pageThemes
  ) => {
    const WithPageThemeComponent = (props: P) => {
      usePageTheme(page);
      // This is JSX syntax
      return <WrappedComponent {...props} />;
    };

    WithPageThemeComponent.displayName = `withPageTheme(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithPageThemeComponent;
  };
};

// Theme-aware className builder
export const buildThemeClass = (
    baseClasses: string,
    themeClasses: {
      light?: string;
      dark?: string;
    },
    isDark: boolean
): string => {
  const themeClass = isDark ? themeClasses.dark : themeClasses.light;
  return `${baseClasses} ${themeClass || ''}`.trim();
};