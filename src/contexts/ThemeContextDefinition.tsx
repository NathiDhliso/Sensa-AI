// Theme Context Definition - Separate file for Fast Refresh compatibility
import { createContext } from 'react';

// Define theme types
export interface ThemeColors {
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

export interface PageTheme {
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
export const sensaTheme: ThemeColors = {
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

// Define page-specific themes
export const pageThemes = {
  dashboard: {
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
  memory: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    accent: '#34d399',
    button: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    gradients: {
      memoryToLearning: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      transformation: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      wisdom: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      growth: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)'
    }
  }
};

// Create context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export default ThemeContext;
