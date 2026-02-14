import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { meditationApi, Meditation } from '../services/meditation';

interface Category {
  id: string;
  label: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'breathwork', label: 'Breathe', icon: '🫁' },
  { id: 'loving-kindness', label: 'Kindness', icon: '💚' },
  { id: 'anxiety', label: 'Calm', icon: '🌊' },
  { id: 'sleep', label: 'Sleep', icon: '🌙' },
];

interface MeditationScreenProps {
  navigation?: any;
}

export const MeditationScreen: React.FC<MeditationScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredMeditation, setFeaturedMeditation] = useState<Meditation | null>(null);

  useEffect(() => {
    loadMeditations();
  }, []);

  const loadMeditations = async () => {
    try {
      setLoading(true);
      const data = await meditationApi.getAllMeditations();
      
      // Ensure data is an array - defensive check
      if (!data) {
        console.warn('Meditations API returned undefined');
        setMeditations([]);
        setFeaturedMeditation(null);
        return;
      }
      
      if (!Array.isArray(data)) {
        console.warn('Meditations API returned non-array:', typeof data, data);
        setMeditations([]);
        setFeaturedMeditation(null);
        return;
      }
      
      if (data.length === 0) {
        console.warn('Meditations API returned empty array');
        setMeditations([]);
        setFeaturedMeditation(null);
        return;
      }
      
      // Data is valid array with items
      setMeditations(data);

      // Set featured meditation (first breathwork meditation)
      const breathwork = data.find(m => m.category === 'breathwork');
      setFeaturedMeditation(breathwork || data[0] || null);
    } catch (error) {
      console.error('Error loading meditations:', error);
      setMeditations([]);
      setFeaturedMeditation(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeditations =
    selectedCategory === 'all'
      ? meditations
      : meditations.filter((m) => m.category === selectedCategory);

  const handleStartMeditation = (meditation: Meditation) => {
    // Navigate to the meditation timer screen with the selected meditation
    navigation?.navigate('MeditationTimer', { meditation });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading meditations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Calm</Text>
        <Text style={styles.headerSubtitle}>
          Practices for peace and presence
        </Text>
      </View>

      {/* Today's Practice */}
      {featuredMeditation && (
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredIcon}>{featuredMeditation.icon}</Text>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredTitle}>{featuredMeditation.title}</Text>
              <Text style={styles.featuredDescription}>
                {featuredMeditation.description}
              </Text>
              <Text style={styles.featuredDuration}>{featuredMeditation.duration} minutes</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.featuredButton}
            onPress={() => handleStartMeditation(featuredMeditation)}
            activeOpacity={0.7}
          >
            <Text style={styles.featuredButtonText}>Begin →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && styles.categoryLabelActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meditations List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMeditations.map((meditation) => (
          <TouchableOpacity
            key={meditation.id}
            style={styles.meditationCard}
            onPress={() => handleStartMeditation(meditation)}
            activeOpacity={0.7}
          >
            <View style={styles.meditationIcon}>
              <Text style={styles.meditationIconText}>{meditation.icon}</Text>
            </View>
            <View style={styles.meditationInfo}>
              <Text style={styles.meditationTitle}>{meditation.title}</Text>
              <Text style={styles.meditationDescription}>
                {meditation.description}
              </Text>
              <Text style={styles.meditationDuration}>
                {meditation.duration} minutes
              </Text>
            </View>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredMeditations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              No practices in this category yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  header: {
    backgroundColor: theme.colors.cream,
    paddingTop: 60,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  featuredCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.goldenLightest,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  featuredBadgeText: {
    ...theme.typography.tiny,
    color: theme.colors.golden,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featuredIcon: {
    fontSize: 48,
    marginRight: theme.spacing.md,
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  featuredDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  featuredDuration: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  featuredButton: {
    backgroundColor: theme.colors.charcoal,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  categoryScroll: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginTop: theme.spacing.lg,
  },
  categoryContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    marginRight: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  categoryLabelActive: {
    color: theme.colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  meditationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  meditationIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  meditationIconText: {
    fontSize: 28,
  },
  meditationInfo: {
    flex: 1,
  },
  meditationTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  meditationDescription: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  meditationDuration: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  playIcon: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginLeft: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
