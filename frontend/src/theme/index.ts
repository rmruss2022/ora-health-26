// Ora 2 Design System
// Integrated from Ora 2 Brand Guidelines 2024
// Source: /Users/matthew/Desktop/Feb26/Ora 2/02-Brand Bible/

// Export typography system from dedicated file
export { typography, fontFamilies, textVariants } from './typography';
export type { TypographyKey, TextVariantKey } from './typography';

export const colors = {
  // Primary - Ora Forest Green (Brand Bible)
  // Deep forest green with teal undertones - hero brand color
  primary: '#1d473e',
  primaryDark: '#0f2a24',
  primaryLight: '#2d5e52',
  primaryLightest: '#d4e3df',

  // Secondary - Lavender Accent (Brand Bible)
  // Soft pastel purple/lavender for accents and highlights
  secondary: '#D4B8E8',
  secondaryDark: '#b894d4',
  secondaryLight: '#e6d9f2',
  secondaryLightest: '#f5f0fa',

  // Accent - Keeping warm tones for UI variety
  accent: '#6B5B95',
  accentDark: '#4F4570',
  accentLight: '#9B8BC4',
  accentLightest: '#E8E3F0',

  // Warm earth tones (complementary to brand green)
  golden: '#D4A574',
  goldenDark: '#B88C5F',
  goldenLight: '#E8C9A3',
  goldenLightest: '#F5E8D8',

  // Earth tones (harmonize with Ora green)
  terracotta: '#B8927D',
  olive: '#6B7A5D',
  sand: '#E8DFD3',

  // Semantic colors - Adapted to Ora palette
  info: '#5B8B9A',
  infoLight: '#E1EDF1',
  warning: '#D4A574',
  warningLight: '#F5E8D8',
  error: '#C87B7B',
  errorLight: '#F5E8E8',
  success: '#2d5e52', // Uses primary green shade
  successLight: '#d4e3df', // Uses primary light shade

  // Neutrals - Warm creams and greyed tones
  cream: '#F5F1E8',
  white: '#FFFFFF',
  backgroundLight: '#FAF8F3',
  backgroundWarm: '#F0EDE6',
  backgroundGray: '#E8E4DC',
  border: '#E0DCD3',

  // Dark tones
  charcoal: '#2D2D2D',
  darkGrey: '#4A4A4A',
  mediumGrey: '#757575',
  lightGrey: '#B8B8B8',

  // Text colors
  textPrimary: '#2D2D2D',
  textSecondary: '#5A5A5A',
  textTertiary: '#8A8A8A',
  textLight: '#FFFFFF',
};

// Dark Mode Colors
export const darkColors = {
  // Primary - Lighter version of brand green for dark mode
  primary: '#2d5e52',
  primaryDark: '#1d473e',
  primaryLight: '#3d7366',
  primaryLightest: '#2a4842',

  // Secondary - Adjusted lavender for dark mode
  secondary: '#b894d4',
  secondaryDark: '#9775b8',
  secondaryLight: '#d4b8e8',
  secondaryLightest: '#3d3448',

  // Accent
  accent: '#9B8BC4',
  accentDark: '#6B5B95',
  accentLight: '#B8ABDA',
  accentLightest: '#3d3848',

  // Warm tones adjusted for dark mode
  golden: '#E8C9A3',
  goldenDark: '#D4A574',
  goldenLight: '#F5E8D8',
  goldenLightest: '#3d3630',

  // Earth tones
  terracotta: '#C8A090',
  olive: '#7A8A6D',
  sand: '#4A463C',

  // Semantic colors for dark mode
  info: '#6B9BAA',
  infoLight: '#2A3A42',
  warning: '#E8C9A3',
  warningLight: '#3d3630',
  error: '#D88B8B',
  errorLight: '#3d2A2A',
  success: '#3d7366',
  successLight: '#2a4842',

  // Dark mode backgrounds
  cream: '#1E1E1E',
  white: '#2A2A2A',
  backgroundLight: '#1A1A1A',
  backgroundWarm: '#242424',
  backgroundGray: '#2F2F2F',
  border: '#3A3A3A',

  // Surface colors for cards
  surface: '#2A2A2A',
  surfaceElevated: '#333333',

  // Dark neutrals
  charcoal: '#E8E8E8',
  darkGrey: '#D0D0D0',
  mediumGrey: '#A8A8A8',
  lightGrey: '#6A6A6A',

  // Text colors for dark mode
  text: '#E8E8E8',
  textPrimary: '#E8E8E8',
  textSecondary: '#B8B8B8',
  textTertiary: '#8A8A8A',
  textLight: '#FFFFFF',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 6,
  },
};

// Note: Import typography from ./typography.ts
// Re-export at the top for external use
import { typography } from './typography';

// Add surface colors to light mode for consistency
export const lightColors = {
  ...colors,
  surface: colors.white,
  surfaceElevated: colors.backgroundLight,
  text: colors.textPrimary,
  // Meditation Collective aliases
  forestGreen: colors.primary, // #1d473e
  lavender: colors.secondary, // #D4B8E8
};

export const theme = {
  colors: lightColors,
  darkColors,
  spacing,
  typography,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
export type ColorScheme = 'light' | 'dark';
