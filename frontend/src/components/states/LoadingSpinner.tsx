import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: ViewStyle;
  fullScreen?: boolean;
  message?: string;
}

/**
 * LoadingSpinner - Generic loading spinner component
 * 
 * Usage:
 * ```tsx
 * <LoadingSpinner />
 * <LoadingSpinner size="small" color={theme.colors.secondary} />
 * <LoadingSpinner fullScreen message="Loading your content..." />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = theme.colors.primary,
  style,
  fullScreen = false,
  message,
}) => {
  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, style]} testID="loading-spinner-fullscreen">
        <ActivityIndicator size={size} color={color} />
        {message && (
          <View style={styles.messageContainer}>
            <View style={styles.messageBubble}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID="loading-spinner">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
  },
  messageContainer: {
    marginTop: theme.spacing.lg,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});

export default LoadingSpinner;
