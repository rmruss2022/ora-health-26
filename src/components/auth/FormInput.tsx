import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { theme } from '../../theme';

interface FormInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  isPassword?: boolean;
  showPasswordToggle?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  isPassword = false,
  showPasswordToggle = false,
  ...textInputProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !isPasswordVisible}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={togglePasswordVisibility}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
          >
            <Text style={styles.eyeIcon}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  inputContainerFocused: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  eyeIcon: {
    fontSize: 20,
    color: theme.colors.mediumGrey,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 6,
  },
});
