import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface ErrorStateProps {
  title?: string;
  message: string;
  icon?: string;
  retryText?: string;
  onRetry?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * ErrorState - Friendly error state component with retry functionality
 * 
 * Usage:
 * ```tsx
 * <ErrorState
 *   title="Oops!"
 *   message="We couldn't load your letters. Please check your connection and try again."
 *   icon="😕"
 *   retryText="Try Again"
 *   onRetry={() => fetchLetters()}
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  icon = '⚠️',
  retryText = 'Try Again',
  onRetry,
  style,
  testID = 'error-state',
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
    maxWidth: 320,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorState;
