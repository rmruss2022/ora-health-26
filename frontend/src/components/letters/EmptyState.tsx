import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

interface EmptyStateProps {
  onCompose?: () => void;
}

/**
 * EmptyState - Displayed when inbox has no letters
 * 
 * Visual Design:
 * - Large outline envelope icon (48px)
 * - Encouraging message
 * - CTA button to compose first letter
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ onCompose }) => {
  return (
    <View style={styles.container}>
      {/* Envelope icon */}
      <Text style={styles.icon}>📭</Text>

      {/* Title */}
      <Text style={styles.title}>No letters yet</Text>

      {/* Description */}
      <Text style={styles.description}>
        Start a conversation with an AI agent to exchange thoughtful letters
      </Text>

      {/* CTA Button */}
      {onCompose && (
        <TouchableOpacity
          style={styles.button}
          onPress={onCompose}
          accessibilityRole="button"
          accessibilityLabel="Compose your first letter"
        >
          <Text style={styles.buttonText}>Compose Your First Letter</Text>
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
    padding: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxxl,
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: 'Sentient-Medium',
    fontSize: 20,
    lineHeight: 28,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontFamily: 'Switzer-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary, // Ora Green
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  buttonText: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 15,
    color: theme.colors.white,
  },
});
