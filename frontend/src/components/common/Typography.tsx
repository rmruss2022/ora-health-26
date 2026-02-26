import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { typography, textVariants, TypographyKey, TextVariantKey } from '../../theme/typography';

/**
 * Typography Component - Typed text wrapper with brand fonts
 * 
 * Usage Examples:
 * ```tsx
 * <Typography variant="h1">Page Title</Typography>
 * <Typography variant="body" color="#1d473e">Body text</Typography>
 * <Typography variant="button" style={{ textAlign: 'center' }}>Click Me</Typography>
 * <Typography preset="pageTitle">Quick Preset</Typography>
 * ```
 * 
 * Props:
 * - variant: Typography style key (h1, h2, body, button, etc.)
 * - preset: Quick access to common text combinations
 * - color: Text color (hex or named color)
 * - style: Additional React Native TextStyle overrides
 * - All standard React Native Text props
 */

interface TypographyProps extends TextProps {
  /** Typography variant from theme/typography.ts */
  variant?: TypographyKey;
  /** Quick preset (alternative to variant) */
  preset?: TextVariantKey;
  /** Text color */
  color?: string;
  /** Children (text content) */
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant,
  preset,
  color,
  style,
  children,
  ...rest
}) => {
  // Determine which style to use (preset > variant > default)
  const baseStyle = preset
    ? textVariants[preset]
    : variant
    ? typography[variant]
    : typography.body;

  // Combine base style with color and custom overrides
  const combinedStyle: TextStyle = {
    ...baseStyle,
    ...(color && { color }),
    ...(style as TextStyle),
  };

  return (
    <Text style={combinedStyle} {...rest}>
      {children}
    </Text>
  );
};

/**
 * Pre-configured Typography Components
 * For convenience and consistency across the app
 */

export const Hero: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="hero" {...props} />
);

export const H1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const H2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const H3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const H4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const BodyLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodyLarge" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodySmall" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="label" {...props} />
);

export const LabelSmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="labelSmall" {...props} />
);

export const ButtonText: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="button" {...props} />
);

export const ButtonTextLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="buttonLarge" {...props} />
);

export const ButtonTextSmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="buttonSmall" {...props} />
);

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="overline" {...props} />
);

export const Quote: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="quote" {...props} />
);

export const Letter: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="letter" {...props} />
);

export const Emphasis: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="emphasis" {...props} />
);

/**
 * Usage Guide:
 * 
 * 1. For headings and titles:
 *    <H1>Welcome to Ora</H1>
 *    <H2>Your Personal AI</H2>
 * 
 * 2. For body text:
 *    <Body>This is regular body text</Body>
 *    <BodySmall>Secondary information</BodySmall>
 * 
 * 3. For letters and intimate content (uses Sentient):
 *    <Letter>Dear future self...</Letter>
 * 
 * 4. For UI elements (uses Switzer):
 *    <ButtonText>Continue</ButtonText>
 *    <Caption>Last updated 2 hours ago</Caption>
 *    <Label>Email Address</Label>
 * 
 * 5. With custom colors:
 *    <H1 color="#1d473e">Ora Green Title</H1>
 *    <Body color="#D4B8E8">Lavender accent text</Body>
 * 
 * 6. With additional styles:
 *    <Body style={{ textAlign: 'center', marginTop: 20 }}>
 *      Centered text with spacing
 *    </Body>
 */
