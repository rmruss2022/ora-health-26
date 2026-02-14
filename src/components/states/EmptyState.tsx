import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * EmptyState - Friendly empty state component for when lists/content is empty
 * 
 * Usage:
 * ```tsx
 * <EmptyState
 *   title="No letters yet"
 *   message="You haven't received any letters from Ora. Check back soon!"
 *   icon="💌"
 *   actionText="Write a letter"
 *   onAction={() => navigate('Compose')}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = '📭',
  actionText,
  onAction,
  style,
  testID = 'empty-state',
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {actionText && onAction && (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{actionText}</Text>
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
    maxWidth: 300,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmptyState;
