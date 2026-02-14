/**
 * Button Component
 * Unified button with consistent styling across the app
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.buttonFullWidth,
    isDisabled && styles.buttonDisabled,
    isDisabled && styles[`button_${variant}_disabled`],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  buttonFullWidth: {
    width: '100%',
  },

  // Variants
  button_primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  button_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  button_text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  button_danger: {
    backgroundColor: '#EF4444',
    borderWidth: 0,
  },

  // Sizes
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 52,
  },

  // Disabled states
  buttonDisabled: {
    opacity: 0.5,
  },
  button_primary_disabled: {
    backgroundColor: '#D1D5DB',
  },
  button_secondary_disabled: {
    borderColor: '#D1D5DB',
  },
  button_danger_disabled: {
    backgroundColor: '#FCA5A5',
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: theme.colors.primary,
  },
  text_text: {
    color: theme.colors.primary,
  },
  text_danger: {
    color: '#FFFFFF',
  },

  // Text sizes
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },

  textDisabled: {
    color: '#9CA3AF',
  },
});
