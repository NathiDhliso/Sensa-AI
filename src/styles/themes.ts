// Modular Color Theme System for Sensa AI
// Centralized color management for consistent theming across all pages
// NOW PROPERLY INTEGRATED WITH SENSA BRAND COLORS

import { sensaBrandColors } from './brandColors';

export interface ColorVariant {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ThemeColors {
  // Primary brand colors - directly from Sensa brand
  primary: ColorVariant;
  secondary: ColorVariant;
  accent: ColorVariant;
  
  // Semantic colors - mapped to Sensa brand colors
  success: ColorVariant;
  warning: ColorVariant;
  error: ColorVariant;
  info: ColorVariant;
  
  // Neutral colors
  gray: ColorVariant;
  
  // Background and surface colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
    glass: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    accent: string;
  };
  
  // Border colors
  border: {
    light: string;
    medium: string;
    heavy: string;
    focus: string;
  };
  
  // Interactive states
  interactive: {
    hover: string;
    focus: string;
    active: string;
    disabled: string;
  };
}

// Sensa AI Theme Configuration - USING ACTUAL SENSA BRAND COLORS
export const sensaTheme: ThemeColors = {
  // Primary: Deep Amethyst - from sensaBrandColors.primary.amethyst
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: sensaBrandColors.primary.amethyst.hex, // #6B46C1
    600: '#5b21b6',
    700: '#4c1d95',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  
  // Secondary: Rich Plum - from sensaBrandColors.primary.plum
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: sensaBrandColors.primary.plum.hex, // #7C2D92
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  
  // Accent: Warm Coral - from sensaBrandColors.primary.coral
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: sensaBrandColors.primary.coral.hex, // #F97316
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
  
  // Success: Sage Green - from sensaBrandColors.secondary.sage
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: sensaBrandColors.secondary.sage.hex, // #10B981
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  
  // Warning: Golden Amber - from sensaBrandColors.secondary.amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: sensaBrandColors.secondary.amber.hex, // #F59E0B
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Error: Soft Rose - from sensaBrandColors.secondary.rose
  error: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: sensaBrandColors.secondary.rose.hex, // #EC4899
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  
  // Info: Same as primary amethyst for consistency
  info: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: sensaBrandColors.primary.amethyst.hex, // #6B46C1
    600: '#5b21b6',
    700: '#4c1d95',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  
  // Neutral grays - using sensaBrandColors.neutrals.warmGray
  gray: {
    50: sensaBrandColors.neutrals.warmGray[50].hex,
    100: sensaBrandColors.neutrals.warmGray[100].hex,
    200: sensaBrandColors.neutrals.warmGray[200].hex,
    300: sensaBrandColors.neutrals.warmGray[300].hex,
    400: sensaBrandColors.neutrals.warmGray[400].hex,
    500: sensaBrandColors.neutrals.warmGray[500].hex,
    600: sensaBrandColors.neutrals.warmGray[600].hex,
    700: sensaBrandColors.neutrals.warmGray[700].hex,
    800: sensaBrandColors.neutrals.warmGray[800].hex,
    900: sensaBrandColors.neutrals.warmGray[900].hex,
    950: '#0a0a0a',
  },
  
  // Background colors - using Sensa brand gradient inspiration
  background: {
    primary: '#ffffff',
    secondary: '#FAF5FF', // Light tint of amethyst
    tertiary: '#FFF7ED', // Light tint of coral
    overlay: 'rgba(107, 70, 193, 0.5)', // Amethyst with opacity
    glass: 'rgba(255, 255, 255, 0.9)',
  },
  
  // Text colors - using Sensa brand grays and amethyst
  text: {
    primary: sensaBrandColors.neutrals.warmGray[900].hex,
    secondary: sensaBrandColors.neutrals.warmGray[600].hex,
    tertiary: sensaBrandColors.neutrals.warmGray[500].hex,
    inverse: '#ffffff',
    accent: sensaBrandColors.primary.amethyst.hex,
  },
  
  // Border colors
  border: {
    light: sensaBrandColors.neutrals.warmGray[200].hex,
    medium: sensaBrandColors.neutrals.warmGray[300].hex,
    heavy: sensaBrandColors.neutrals.warmGray[400].hex,
    focus: sensaBrandColors.primary.amethyst.hex,
  },
  
  // Interactive states - using Sensa amethyst with opacity
  interactive: {
    hover: `${sensaBrandColors.primary.amethyst.rgb.replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
    focus: `${sensaBrandColors.primary.amethyst.rgb.replace('rgb', 'rgba').replace(')', ', 0.2)')}`,
    active: `${sensaBrandColors.primary.amethyst.rgb.replace('rgb', 'rgba').replace(')', ', 0.3)')}`,
    disabled: `${sensaBrandColors.neutrals.warmGray[400].rgb.replace('rgb', 'rgba').replace(')', ', 0.5)')}`,
  },
};

// Page-specific color configurations - USING SENSA BRAND GRADIENTS
export const pageThemes = {
  // Home/Dashboard - Memory to Learning gradient
  home: {
    background: `bg-gradient-to-br from-purple-50 via-white to-orange-50`,
    card: 'bg-white/80 backdrop-blur-sm border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-600 to-orange-500', // memoryToLearning colors
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  },
  
  // Memory pages - Wisdom gradient (plum to amethyst to rose)
  memory: {
    background: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
    card: 'bg-white/90 backdrop-blur-md border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-700 to-pink-500', // wisdom gradient colors
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  },
  
  // Course/Learning pages - Growth gradient (amber to sage)
  course: {
    background: 'bg-gradient-to-br from-amber-50 via-white to-emerald-50',
    card: 'bg-white/85 backdrop-blur-sm border-amber-200/50',
    accent: 'text-amber-600',
    button: 'bg-gradient-to-r from-amber-500 to-emerald-500', // growth gradient colors
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  },
  
  // Know Me feature - Transformation gradient (full spectrum)
  knowMe: {
    background: 'bg-gradient-to-br from-purple-50 via-orange-50 to-amber-50',
    card: 'bg-white/80 backdrop-blur-sm border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-700 via-purple-600 via-orange-500 to-amber-500', // transformation colors
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  },
  
  // Analytics/Reports
  analytics: {
    background: 'bg-gradient-to-br from-purple-50 via-white to-blue-50',
    card: 'bg-white/80 backdrop-blur-sm border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-600 to-blue-500',
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  },
  
  // Settings/Auth
  auth: {
    background: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
    card: 'bg-white/90 backdrop-blur-md border-purple-200/50',
    accent: 'text-purple-600',
    button: 'bg-gradient-to-r from-purple-600 to-orange-500', // memoryToLearning colors
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  },
  
  // Settings
  settings: {
    background: 'bg-gradient-to-br from-gray-50 via-white to-purple-50',
    card: 'bg-white/85 backdrop-blur-sm border-gray-200/50',
    accent: 'text-gray-600',
    button: 'bg-gradient-to-r from-gray-600 to-purple-500',
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  },

  // Epistemic Driver
  epistemicDriver: {
    background: 'bg-gradient-to-br from-slate-50 via-white to-amber-50',
    card: 'bg-white/90 backdrop-blur-sm border-slate-200/50',
    accent: 'text-amber-600',
    button: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    gradients: {
      memoryToLearning: sensaBrandColors.gradients.memoryToLearning.css,
      transformation: sensaBrandColors.gradients.transformation.css,
      wisdom: sensaBrandColors.gradients.wisdom.css,
      growth: sensaBrandColors.gradients.growth.css,
    }
  }
};

// Component-specific color utilities
export const componentColors = {
  // Navigation
  nav: {
    background: 'bg-white/90 backdrop-blur-md border-gray-200/50',
    link: 'text-gray-600 hover:text-gray-800',
    active: 'text-indigo-600',
    icon: 'text-gray-500',
  },
  
  // Buttons
  button: {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
  },
  
  // Form elements
  form: {
    input: 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500',
    label: 'text-gray-700',
    error: 'text-red-600 border-red-300 focus:ring-red-500',
    success: 'text-green-600 border-green-300 focus:ring-green-500',
    disabled: 'bg-gray-100 text-gray-500 cursor-not-allowed',
  },
  
  // Cards and surfaces
  card: {
    default: 'bg-white border border-gray-200 shadow-soft',
    elevated: 'bg-white border border-gray-200 shadow-lg',
    interactive: 'bg-white border border-gray-200 shadow-soft hover:shadow-lg transition-shadow',
    glass: 'bg-white/80 backdrop-blur-sm border border-gray-200/50',
  },
  
  // Status indicators
  status: {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  },
  
  // Text variants
  text: {
    heading: 'text-gray-900',
    body: 'text-gray-700',
    caption: 'text-gray-500',
    link: 'text-indigo-600 hover:text-indigo-700',
    muted: 'text-gray-400',
  },
};

// Utility functions for theme usage
export const getPageTheme = (page: keyof typeof pageThemes) => {
  return pageThemes[page] || pageThemes.home;
};

export const getComponentColor = (component: keyof typeof componentColors, variant?: string) => {
  const componentTheme = componentColors[component];
  if (variant && typeof componentTheme === 'object' && variant in componentTheme) {
    return componentTheme[variant as keyof typeof componentTheme];
  }
  return componentTheme;
};

// Dark mode theme (for future implementation)
export const darkTheme: Partial<ThemeColors> = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    overlay: 'rgba(0, 0, 0, 0.8)',
    glass: 'rgba(15, 23, 42, 0.8)',
  },
  
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
    accent: '#a78bfa',
  },
  
  border: {
    light: '#334155',
    medium: '#475569',
    heavy: '#64748b',
    focus: '#a78bfa',
  },
};

// Export theme context type for React Context usage
export type ThemeContextType = {
  theme: ThemeColors;
  pageTheme: string;
  setPageTheme: (page: keyof typeof pageThemes) => void;
  isDark: boolean;
  toggleDark: () => void;
};

// Helper for creating Tailwind class strings
export const createColorClass = (
  type: 'bg' | 'text' | 'border',
  color: string,
  shade?: number
): string => {
  const shadeStr = shade ? `-${shade}` : '';
  return `${type}-${color}${shadeStr}`;
};

// Animation and transition utilities
export const animations = {
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  
  // Hover animations
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverLift: 'hover:-translate-y-1 transition-transform duration-200',
  hoverGlow: 'hover:shadow-xl transition-shadow duration-300',
};

export default sensaTheme; 