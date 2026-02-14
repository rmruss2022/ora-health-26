/**
 * Theme Context
 * Provides theme (light/dark mode) to the entire app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { theme, lightColors, darkColors, ColorScheme } from '../theme';
import type { Theme } from '../theme';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme | 'auto') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useRNColorScheme(); // 'light', 'dark', or null
  const [userPreference, setUserPreference] = useState<ColorScheme | 'auto'>('auto');

  // Determine actual color scheme
  const colorScheme: ColorScheme =
    userPreference === 'auto'
      ? (systemColorScheme || 'light')
      : userPreference;

  const isDark = colorScheme === 'dark';

  // Build current theme based on color scheme
  const currentTheme: Theme = {
    ...theme,
    colors: isDark ? darkColors : lightColors,
  };

  const toggleTheme = () => {
    setUserPreference(prev => {
      if (prev === 'auto') return 'light';
      if (prev === 'light') return 'dark';
      return 'light';
    });
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    colorScheme,
    isDark,
    setColorScheme: setUserPreference,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * Hook to get theme-aware colors (shorthand)
 */
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

/**
 * Hook to check if dark mode is active
 */
export const useIsDark = (): boolean => {
  const { isDark } = useTheme();
  return isDark;
};
