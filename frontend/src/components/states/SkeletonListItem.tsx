import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../theme';

interface SkeletonListItemProps {
  variant?: 'default' | 'letter' | 'post' | 'meditation';
}

/**
 * SkeletonListItem - Skeleton loader for list items
 * 
 * Usage:
 * ```tsx
 * {isLoading && (
 *   <>
 *     <SkeletonListItem variant="letter" />
 *     <SkeletonListItem variant="letter" />
 *     <SkeletonListItem variant="letter" />
 *   </>
 * )}
 * ```
 */
export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  variant = 'default',
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderDefault = () => (
    <View style={styles.card}>
      <Animated.View style={[styles.iconCircle, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.titleBar, { opacity }]} />
        <Animated.View style={[styles.subtitleBar, { opacity }]} />
      </View>
    </View>
  );

  const renderLetter = () => (
    <View style={[styles.card, styles.letterCard]}>
      <Animated.View style={[styles.letterIcon, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.titleBar, { opacity }]} />
        <Animated.View style={[styles.smallBar, { opacity }]} />
        <Animated.View style={[styles.subtitleBar, { opacity }]} />
      </View>
    </View>
  );

  const renderPost = () => (
    <View style={[styles.card, styles.postCard]}>
      <View style={styles.postHeader}>
        <Animated.View style={[styles.avatar, { opacity }]} />
        <View style={styles.postHeaderText}>
          <Animated.View style={[styles.smallBar, { opacity }]} />
          <Animated.View style={[styles.tinyBar, { opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.postContent, { opacity }]} />
      <Animated.View style={[styles.postContentShort, { opacity }]} />
    </View>
  );

  const renderMeditation = () => (
    <View style={[styles.card, styles.meditationCard]}>
      <Animated.View style={[styles.meditationIcon, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.titleBar, { opacity }]} />
        <Animated.View style={[styles.subtitleBar, { opacity }]} />
        <Animated.View style={[styles.smallBar, { opacity }]} />
      </View>
      <Animated.View style={[styles.playButton, { opacity }]} />
    </View>
  );

  switch (variant) {
    case 'letter':
      return renderLetter();
    case 'post':
      return renderPost();
    case 'meditation':
      return renderMeditation();
    default:
      return renderDefault();
  }
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  letterCard: {
    paddingVertical: theme.spacing.lg,
  },
  postCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  meditationCard: {
    paddingHorizontal: theme.spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundGray,
    marginRight: theme.spacing.md,
  },
  letterIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundGray,
    marginRight: theme.spacing.md,
  },
  meditationIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundGray,
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  titleBar: {
    height: 16,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
    width: '70%',
  },
  subtitleBar: {
    height: 14,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.sm,
    width: '90%',
  },
  smallBar: {
    height: 12,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 6,
    width: '50%',
  },
  tinyBar: {
    height: 10,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.sm,
    width: '30%',
  },
  // Post-specific
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundGray,
    marginRight: theme.spacing.sm,
  },
  postHeaderText: {
    flex: 1,
  },
  postContent: {
    height: 16,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
    width: '100%',
  },
  postContentShort: {
    height: 16,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.sm,
    width: '80%',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundGray,
    marginLeft: theme.spacing.sm,
  },
});

export default SkeletonListItem;
