import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

export interface MeditationSeries {
  id: string;
  title: string;
  description: string;
  moduleCount: number;
  completedModules: number;
  coverImage?: string;
  duration: string;
  category: string;
  gradientColors: [string, string];
}

interface MeditationSeriesCardProps {
  series: MeditationSeries;
  onPress: () => void;
}

export const MeditationSeriesCard: React.FC<MeditationSeriesCardProps> = ({
  series,
  onPress,
}) => {
  const progress = series.completedModules / series.moduleCount;
  const progressPercent = Math.round(progress * 100);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={series.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Cover Image Overlay */}
        {series.coverImage && (
          <Image
            source={{ uri: series.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{series.category}</Text>
            </View>
            <Text style={styles.duration}>{series.duration}</Text>
          </View>

          <Text style={styles.title}>{series.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {series.description}
          </Text>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {series.completedModules} of {series.moduleCount} modules
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  gradient: {
    minHeight: 200,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  content: {
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  duration: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.white,
    opacity: 0.9,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.white,
    opacity: 0.9,
  },
});
