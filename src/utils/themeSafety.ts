// Theme Safety Utilities - Bulletproof theme property access
// This module provides 100% safe theme property access with guaranteed fallbacks

export interface SafeTheme {
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

export interface SafePageTheme {
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

// Emergency fallback theme - guaranteed to never be null/undefined
const EMERGENCY_THEME: SafeTheme = {
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

const EMERGENCY_PAGE_THEME: SafePageTheme = {
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
};

// Freeze emergency themes to prevent modification
Object.freeze(EMERGENCY_THEME);
Object.freeze(EMERGENCY_THEME.background);
Object.freeze(EMERGENCY_THEME.text);
Object.freeze(EMERGENCY_THEME.border);
Object.freeze(EMERGENCY_PAGE_THEME);
Object.freeze(EMERGENCY_PAGE_THEME.gradients);

/**
 * Safely access theme background properties with guaranteed fallbacks
 */
export const safeThemeBackground = (theme: any): SafeTheme['background'] => {
  try {
    if (theme?.background && 
        typeof theme.background.primary === 'string' &&
        typeof theme.background.secondary === 'string' &&
        typeof theme.background.accent === 'string' &&
        typeof theme.background.surface === 'string') {
      return theme.background;
    }
  } catch (error) {
    console.warn('Theme background access failed, using emergency fallback:', error);
  }
  return EMERGENCY_THEME.background;
};

/**
 * Safely access page theme background with guaranteed fallback
 */
export const safePageThemeBackground = (pageTheme: any): string => {
  try {
    if (pageTheme?.background && typeof pageTheme.background === 'string') {
      return pageTheme.background;
    }
  } catch (error) {
    console.warn('Page theme background access failed, using emergency fallback:', error);
  }
  return EMERGENCY_PAGE_THEME.background;
};

/**
 * Safely access page theme card with guaranteed fallback
 */
export const safePageThemeCard = (pageTheme: any): string => {
  try {
    if (pageTheme?.card && typeof pageTheme.card === 'string') {
      return pageTheme.card;
    }
  } catch (error) {
    console.warn('Page theme card access failed, using emergency fallback:', error);
  }
  return EMERGENCY_PAGE_THEME.card;
};

/**
 * Safely access page theme button with guaranteed fallback
 */
export const safePageThemeButton = (pageTheme: any): string => {
  try {
    if (pageTheme?.button && typeof pageTheme.button === 'string') {
      return pageTheme.button;
    }
  } catch (error) {
    console.warn('Page theme button access failed, using emergency fallback:', error);
  }
  return EMERGENCY_PAGE_THEME.button;
};

/**
 * Safely access page theme accent with guaranteed fallback
 */
export const safePageThemeAccent = (pageTheme: any): string => {
  try {
    if (pageTheme?.accent && typeof pageTheme.accent === 'string') {
      return pageTheme.accent;
    }
  } catch (error) {
    console.warn('Page theme accent access failed, using emergency fallback:', error);
  }
  return EMERGENCY_PAGE_THEME.accent;
};

/**
 * Get a completely safe theme object - guaranteed to never be null/undefined
 */
export const getSafeTheme = (theme: any): SafeTheme => {
  try {
    if (theme && 
        theme.background && 
        theme.text && 
        theme.border) {
      return {
        background: safeThemeBackground(theme),
        text: theme.text || EMERGENCY_THEME.text,
        border: theme.border || EMERGENCY_THEME.border
      };
    }
  } catch (error) {
    console.warn('Theme access failed, using emergency theme:', error);
  }
  return EMERGENCY_THEME;
};

/**
 * Get a completely safe page theme object - guaranteed to never be null/undefined
 */
export const getSafePageTheme = (pageTheme: any): SafePageTheme => {
  try {
    if (pageTheme) {
      return {
        background: safePageThemeBackground(pageTheme),
        card: safePageThemeCard(pageTheme),
        accent: safePageThemeAccent(pageTheme),
        button: safePageThemeButton(pageTheme),
        gradients: pageTheme.gradients || EMERGENCY_PAGE_THEME.gradients
      };
    }
  } catch (error) {
    console.warn('Page theme access failed, using emergency page theme:', error);
  }
  return EMERGENCY_PAGE_THEME;
};

/**
 * Emergency theme access - use this when all else fails
 */
export const getEmergencyTheme = (): SafeTheme => EMERGENCY_THEME;
export const getEmergencyPageTheme = (): SafePageTheme => EMERGENCY_PAGE_THEME;
