/**
 * TextInput Component
 * Unified text input with consistent styling across the app
 */

import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

export type InputVariant = 'standard' | 'search' | 'multiline';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
  showPasswordToggle?: boolean; // For password inputs
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  hint,
  variant = 'standard',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required = false,
  showPasswordToggle = false,
  secureTextEntry,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = showPasswordToggle || secureTextEntry;
  const shouldSecureText = isPassword && !isPasswordVisible;

  const inputStyle = [
    styles.input,
    variant === 'multiline' && styles.inputMultiline,
    variant === 'search' && styles.inputSearch,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || isPassword) && styles.inputWithRightIcon,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    textInputProps.editable === false && styles.inputDisabled,
  ];

  const containerStyles = [
    styles.container,
    containerStyle,
  ];

  return (
    <View style={containerStyles}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? theme.colors.primary : '#9CA3AF'}
            style={styles.leftIcon}
          />
        )}

        {/* Input */}
        <RNTextInput
          {...textInputProps}
          secureTextEntry={shouldSecureText}
          style={inputStyle}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor={textInputProps.placeholderTextColor || '#9CA3AF'}
          accessibilityLabel={textInputProps.accessibilityLabel || label}
        />

        {/* Right Icon or Password Toggle */}
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
            accessibilityRole={onRightIconPress ? 'button' : undefined}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={onRightIconPress ? theme.colors.primary : '#9CA3AF'}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Error or Hint */}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputSearch: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingLeft: 44, // Space for search icon
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
    opacity: 0.6,
  },
  leftIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 14,
    padding: 4,
    zIndex: 1,
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
});
