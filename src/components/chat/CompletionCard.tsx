import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { theme } from '../../theme';

interface CompletionCardProps {
  behaviorName: string;
  summary: string;
  actionItems?: string[];
  savedEntry?: {
    type: 'journal' | 'activity' | 'plan';
    title: string;
  };
  onStartNew?: () => void;
  onGoHome?: () => void;
}

const { width } = Dimensions.get('window');

export const CompletionCard: React.FC<CompletionCardProps> = ({
  behaviorName,
  summary,
  actionItems = [],
  savedEntry,
  onStartNew,
  onGoHome,
}) => {
  const [slideAnim] = useState(new Animated.Value(width));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [celebrationOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Celebration animation sequence
    Animated.sequence([
      // Fade in celebration particles
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Slide up card
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const getBehaviorEmoji = (name: string): string => {
    const emojis: { [key: string]: string } = {
      'journal-prompt': '📝',
      'guided-exercise': '🌱',
      'progress-analysis': '📊',
      'weekly-planning': '🗓️',
      'free-form-chat': '✨',
    };
    return emojis[name] || '✅';
  };

  const getBehaviorColor = (name: string): string => {
    const colors: { [key: string]: string } = {
      'journal-prompt': theme.colors.terracotta,
      'guided-exercise': theme.colors.olive,
      'progress-analysis': theme.colors.mustard,
      'weekly-planning': theme.colors.purple,
      'free-form-chat': theme.colors.sage,
    };
    return colors[name] || theme.colors.sage;
  };

  return (
    <View style={styles.overlay}>
      {/* Celebration particles */}
      <Animated.View style={[styles.celebration, { opacity: celebrationOpacity }]}>
        <Text style={[styles.particle, { top: 100, left: 50 }]}>✨</Text>
        <Text style={[styles.particle, { top: 120, right: 60 }]}>⭐</Text>
        <Text style={[styles.particle, { top: 200, left: 100 }]}>💫</Text>
        <Text style={[styles.particle, { top: 180, right: 80 }]}>🌟</Text>
      </Animated.View>

      {/* Completion Card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getBehaviorColor(behaviorName) + '20' },
            ]}
          >
            <Text style={styles.emoji}>{getBehaviorEmoji(behaviorName)}</Text>
          </View>
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.subtitle}>Nice work. You showed up for yourself today.</Text>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>What we accomplished:</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>

        {/* Saved Entry */}
        {savedEntry && (
          <View style={styles.savedSection}>
            <View style={styles.savedIcon}>
              <Text style={styles.savedIconText}>
                {savedEntry.type === 'journal' ? '📖' : savedEntry.type === 'plan' ? '📋' : '✅'}
              </Text>
            </View>
            <View style={styles.savedContent}>
              <Text style={styles.savedLabel}>Saved to your {savedEntry.type}</Text>
              <Text style={styles.savedTitle}>{savedEntry.title}</Text>
            </View>
          </View>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <View style={styles.actionsSection}>
            <Text style={styles.actionsLabel}>Your next steps:</Text>
            {actionItems.map((item, index) => (
              <View key={index} style={styles.actionItem}>
                <View style={styles.actionBullet} />
                <Text style={styles.actionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {onStartNew && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onStartNew}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Start Another Session</Text>
            </TouchableOpacity>
          )}
          {onGoHome && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebration: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    fontSize: 32,
  },
  card: {
    width: width * 0.9,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  savedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.sage + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.sage + '30',
  },
  savedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  savedIconText: {
    fontSize: 20,
  },
  savedContent: {
    flex: 1,
  },
  savedLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  savedTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: theme.spacing.lg,
  },
  actionsLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  actionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.sage,
    marginTop: 7,
    marginRight: theme.spacing.sm,
  },
  actionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  buttonsContainer: {
    gap: theme.spacing.sm,
  },
  button: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.sage,
  },
  primaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
