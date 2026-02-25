import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../theme';

interface DailyQuizCardProps {
  hasCompletedToday: boolean;
  currentStreak: number;
  onPress: () => void;
}

export const DailyQuizCard: React.FC<DailyQuizCardProps> = ({
  hasCompletedToday,
  currentStreak,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        hasCompletedToday && styles.containerCompleted,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            {hasCompletedToday ? '✅' : '📝'}
          </Text>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {hasCompletedToday ? 'Quiz Complete!' : 'Daily Check-in'}
          </Text>
          <Text style={styles.subtitle}>
            {hasCompletedToday
              ? `Great work! ${currentStreak} day streak 🔥`
              : 'How are you feeling today?'}
          </Text>
        </View>

        {!hasCompletedToday && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>New</Text>
          </View>
        )}
      </View>

      {currentStreak > 0 && !hasCompletedToday && (
        <View style={styles.streakIndicator}>
          <Text style={styles.streakText}>
            🔥 {currentStreak} day streak - keep it going!
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: theme.colors.forestGreen,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  badge: {
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
  streakIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  streakText: {
    fontSize: 13,
    color: theme.colors.forestGreen,
    fontWeight: '500',
    textAlign: 'center',
  },
});
