import { TextStyle } from 'react-native';

/**
 * Ora AI Typography System
 * Based on Ora Brand Guidelines 2024
 * 
 * Font Hierarchy:
 * - Sentient: Primary font for headings, body text, and intimate/personal content
 * - Switzer: Secondary font for UI elements, buttons, labels, and system text
 * 
 * Design Intent:
 * - Sentient brings warmth and humanity (letters, journals, personal content)
 * - Switzer provides clarity and precision (navigation, buttons, metadata)
 */

// Font family mappings
export const fontFamilies = {
  sentient: {
    extralight: 'Sentient-Extralight',
    extralightItalic: 'Sentient-ExtralightItalic',
    light: 'Sentient-Light',
    lightItalic: 'Sentient-LightItalic',
    regular: 'Sentient-Regular',
    italic: 'Sentient-Italic',
    medium: 'Sentient-Medium',
    mediumItalic: 'Sentient-MediumItalic',
    bold: 'Sentient-Bold',
    boldItalic: 'Sentient-BoldItalic',
  },
  switzer: {
    thin: 'Switzer-Thin',
    thinItalic: 'Switzer-ThinItalic',
    extralight: 'Switzer-Extralight',
    extralightItalic: 'Switzer-ExtralightItalic',
    light: 'Switzer-Light',
    lightItalic: 'Switzer-LightItalic',
    regular: 'Switzer-Regular',
    italic: 'Switzer-Italic',
    medium: 'Switzer-Medium',
    mediumItalic: 'Switzer-MediumItalic',
    semibold: 'Switzer-Semibold',
    semiboldItalic: 'Switzer-SemiboldItalic',
    bold: 'Switzer-Bold',
    boldItalic: 'Switzer-BoldItalic',
    extrabold: 'Switzer-Extrabold',
    extraboldItalic: 'Switzer-ExtraboldItalic',
    black: 'Switzer-Black',
    blackItalic: 'Switzer-BlackItalic',
  },
};

// Typography scale with semantic naming
export const typography = {
  // Hero / Display (Sentient Bold - for impactful headlines)
  hero: {
    fontFamily: fontFamilies.sentient.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,

  // Heading 1 (Sentient Bold - main page titles)
  h1: {
    fontFamily: fontFamilies.sentient.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  } as TextStyle,

  // Heading 2 (Sentient Medium - section titles)
  h2: {
    fontFamily: fontFamilies.sentient.medium,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  } as TextStyle,

  // Heading 3 (Sentient Medium - subsection titles)
  h3: {
    fontFamily: fontFamilies.sentient.medium,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,

  // Heading 4 (Switzer Semibold - card titles, UI headings)
  h4: {
    fontFamily: fontFamilies.switzer.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  // Body Large (Sentient Regular - primary body text)
  bodyLarge: {
    fontFamily: fontFamilies.sentient.regular,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  } as TextStyle,

  // Body (Sentient Regular - default body text)
  body: {
    fontFamily: fontFamilies.sentient.regular,
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  // Body Small (Sentient Light - secondary body text)
  bodySmall: {
    fontFamily: fontFamilies.sentient.light,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
  } as TextStyle,

  // Letter Text (Sentient Regular - for intimate, personal content)
  // Use this for user-written letters, journal entries, personal messages
  letter: {
    fontFamily: fontFamilies.sentient.regular,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.15,
  } as TextStyle,

  // Caption (Switzer Regular - metadata, timestamps)
  caption: {
    fontFamily: fontFamilies.switzer.regular,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,

  // Label (Switzer Medium - form labels, tags)
  label: {
    fontFamily: fontFamilies.switzer.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  // Label Small (Switzer Medium - small labels, badges)
  labelSmall: {
    fontFamily: fontFamilies.switzer.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
  } as TextStyle,

  // Button Large (Switzer Semibold - primary CTAs)
  buttonLarge: {
    fontFamily: fontFamilies.switzer.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0.2,
  } as TextStyle,

  // Button (Switzer Semibold - default buttons)
  button: {
    fontFamily: fontFamilies.switzer.semibold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
  } as TextStyle,

  // Button Small (Switzer Medium - compact buttons)
  buttonSmall: {
    fontFamily: fontFamilies.switzer.medium,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.2,
  } as TextStyle,

  // Overline (Switzer Semibold - category labels, eyebrows)
  overline: {
    fontFamily: fontFamilies.switzer.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  // Tiny (Switzer Regular - ultra-small UI text)
  tiny: {
    fontFamily: fontFamilies.switzer.regular,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0,
  } as TextStyle,

  // Quote (Sentient Light Italic - pull quotes, testimonials)
  quote: {
    fontFamily: fontFamilies.sentient.lightItalic,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.15,
  } as TextStyle,

  // Emphasis (Sentient Medium Italic - inline emphasis)
  emphasis: {
    fontFamily: fontFamilies.sentient.mediumItalic,
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,
};

// Variant presets for common text combinations
export const textVariants = {
  // Headers
  pageTitle: typography.h1,
  sectionTitle: typography.h2,
  cardTitle: typography.h3,
  listItemTitle: typography.h4,

  // Body
  primaryText: typography.body,
  secondaryText: typography.bodySmall,
  metadata: typography.caption,

  // Interactive
  primaryButton: typography.buttonLarge,
  secondaryButton: typography.button,
  link: typography.body,
  
  // Special contexts
  letterContent: typography.letter,
  timestamp: typography.caption,
  badge: typography.labelSmall,
  tag: typography.label,
};

// Type exports for TypeScript autocomplete
export type TypographyKey = keyof typeof typography;
export type TextVariantKey = keyof typeof textVariants;
