import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../theme';
import { Letter } from './letters/LetterCard';

interface EnvelopeCardProps {
  letter: Letter;
  onPress: () => void;
  onAnimationComplete?: () => void;
}

/**
 * EnvelopeCard - Animated envelope component for letter reading
 * 
 * Features:
 * - 400ms flip/scale animation on tap
 * - Envelope open effect (sealed → open)
 * - Premium feel with haptic feedback potential
 * - Smooth transition to letter detail view
 * 
 * Animation sequence:
 * 1. Scale down slightly (0.95) - 100ms
 * 2. Flip and open envelope - 300ms
 * 3. Callback to navigate after animation completes
 */
export const EnvelopeCard: React.FC<EnvelopeCardProps> = ({
  letter,
  onPress,
  onAnimationComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);
  
  const isUnread = letter.state === 'unread';

  // Determine accent color based on letter type
  const getAccentColor = () => {
    switch (letter.from) {
      case 'agent':
        return theme.colors.primary; // Ora Green
      case 'user':
        return theme.colors.secondary; // Lavender
      case 'system':
        return theme.colors.golden;
      default:
        return theme.colors.primary;
    }
  };

  // Format timestamp as relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get sender display name
  const getSenderName = () => {
    if (letter.from === 'agent' && letter.agentName) {
      return `@${letter.agentName}`;
    }
    if (letter.from === 'user') {
      return 'You';
    }
    if (letter.from === 'system') {
      return 'Ora';
    }
    return 'Unknown';
  };

  // Envelope open animation sequence
  const handlePress = () => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;

    // Sequence: Scale down → Flip/open → Navigate
    Animated.sequence([
      // 1. Quick scale down (tactile feedback)
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      // 2. Flip and open animation (parallel)
      Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Animation complete - trigger navigation
      isAnimating.current = false;
      onAnimationComplete?.();
      onPress();
    });
  };

  // Interpolate flip rotation (0 → 180 degrees on Y axis)
  const flipInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const preview = letter.preview || letter.body.substring(0, 100);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { perspective: 1000 },
            { rotateY: flipInterpolate },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`${isUnread ? 'Unread letter' : 'Letter'} from ${getSenderName()}, subject: ${letter.subject}`}
        accessibilityHint="Tap to open and read the full letter"
        disabled={isAnimating.current}
      >
        <View style={styles.card}>
          {/* Left accent bar - color coded by type */}
          <View style={[styles.accentBar, { backgroundColor: getAccentColor() }]} />

          {/* Main content area */}
          <View style={styles.content}>
            {/* Header row: sender + envelope icon + unread badge */}
            <View style={styles.header}>
              <Text style={styles.sender}>{getSenderName()}</Text>
              
              {/* Envelope icon - changes based on read state */}
              <View style={styles.iconContainer}>
                <Text style={styles.envelopeIcon}>
                  {isUnread ? '✉️' : '📬'}
                </Text>
              </View>

              {/* Unread badge */}
              {isUnread && <View style={styles.unreadBadge} />}
            </View>

            {/* Letter title */}
            <Text
              style={[styles.title, isUnread && styles.titleUnread]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {letter.subject || '(No subject)'}
            </Text>

            {/* Preview text */}
            <Text
              style={styles.preview}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {preview}
            </Text>

            {/* Timestamp */}
            <Text style={styles.timestamp}>
              {getRelativeTime(letter.sentAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm, // 12px gap between cards
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md, // 12px
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  accentBar: {
    width: 4,
    // backgroundColor set dynamically
  },
  content: {
    flex: 1,
    padding: theme.spacing.md, // 16px
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xxs, // 4px
  },
  sender: {
    flex: 1,
    fontFamily: 'Switzer-Medium',
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  iconContainer: {
    marginLeft: theme.spacing.xs,
  },
  envelopeIcon: {
    fontSize: 20,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success, // Ora Green
    marginLeft: theme.spacing.xs,
  },
  title: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 17,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xxs, // 4px
  },
  titleUnread: {
    // Could add bolder weight if needed
    opacity: 1,
  },
  preview: {
    fontFamily: 'Switzer-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    opacity: 0.7,
    marginBottom: theme.spacing.xs, // 8px
  },
  timestamp: {
    fontFamily: 'Switzer-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textTertiary,
    opacity: 0.6,
    textAlign: 'right',
  },
});
