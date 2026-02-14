import React from 'react';
import { View, Modal, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { Typography } from '../common';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
  overlayColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * LoadingOverlay - Blocks user interaction during async operations
 * 
 * Usage:
 * ```tsx
 * <LoadingOverlay visible={isSubmitting} message="Saving your changes..." />
 * ```
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = true,
  overlayColor = 'rgba(255, 255, 255, 0.85)',
  style,
  testID = 'loading-overlay',
}) => {
  return (
    <Modal
      transparent={transparent}
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }, style]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {message && (
            <View style={styles.messageContainer}>
              <Typography variant="body" color={theme.colors.textSecondary}>
                {message}
              </Typography>
              <View style={styles.bouncingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    ...theme.shadows.lg,
    minWidth: 200,
  },
  messageContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  bouncingDots: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
});

export default LoadingOverlay;
