import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SessionType } from './SessionTypeSelector';

interface CompletionSummaryProps {
  duration: number; // Duration in seconds
  sessionType: SessionType;
  streakCount: number;
  onShare?: () => void;
  onDone: () => void;
}

const ENCOURAGING_MESSAGES = [
  'Beautiful practice',
  'Well done',
  'You did it',
  'Wonderful session',
  'Mindfully present',
  'Peaceful work',
  'Keep it up',
];

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  timed: 'Timed Meditation',
  guided: 'Guided Meditation',
  breathing: 'Breathing Exercise',
};

export const CompletionSummary: React.FC<CompletionSummaryProps> = ({
  duration,
  sessionType,
  streakCount,
  onShare,
  onDone,
}) => {
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Celebration glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scale in animation
    Animated.spring(scaleAnimation, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const glowScale = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const randomMessage =
    ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Checkmark icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#8B9D83" />
        </View>

        {/* Encouraging message */}
        <Text style={styles.message}>{randomMessage}</Text>

        {/* Session details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Session Type</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {SESSION_TYPE_LABELS[sessionType]}
            </Text>
          </View>
        </View>

        {/* Streak */}
        {streakCount > 0 && (
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={24} color="#FF6B35" />
            <Text style={styles.streakText}>
              {streakCount} day streak
              {streakCount > 1 && '!'}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {onShare && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color="#8B9D83" />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onDone}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F0',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  glow: {
    position: 'absolute',
    top: 20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8B9D83',
  },
  iconContainer: {
    marginBottom: 24,
    zIndex: 1,
  },
  message: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E2E',
    marginBottom: 32,
    textAlign: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E2E',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 32,
    gap: 8,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#8B9D83',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B9D83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B9D83',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#8B9D83',
    fontSize: 16,
    fontWeight: '600',
  },
});
