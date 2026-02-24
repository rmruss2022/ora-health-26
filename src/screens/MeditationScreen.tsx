import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { meditationApi, Meditation } from '../services/meditation';
import { collectiveSessionService } from '../services/collective-session.service';

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
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredMeditation, setFeaturedMeditation] = useState<Meditation | null>(null);
  const [upcomingSession, setUpcomingSession] = useState<any>(null);

  useEffect(() => {
    loadMeditations();
    loadUpcomingSession();
  }, []);

  const loadUpcomingSession = async () => {
    try {
      const session = await collectiveSessionService.getUpcomingSession();
      setUpcomingSession(session);
    } catch (error) {
      console.error('Failed to load upcoming session:', error);
    }
  };

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

  const getTimeUntil = (scheduledTime: string): string => {
    const now = new Date();
    const sessionTime = new Date(scheduledTime);
    const diffMs = sessionTime.getTime() - now.getTime();

    if (diffMs < 0) return 'now';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.pageContent, { paddingBottom: insets.bottom + 88 }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Find Calm</Text>
          <Text style={styles.headerSubtitle}>
            Practices for peace and presence
          </Text>
        </View>

        {/* Collective Session Card */}
        {upcomingSession && (
          <TouchableOpacity
            style={styles.collectiveCard}
            onPress={() => navigation?.navigate('CollectiveSession', { sessionId: upcomingSession.id })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.forestGreen, theme.colors.lavender]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.collectiveGradient}
            >
              <View style={styles.collectiveContent}>
                <Text style={styles.collectiveIcon}>🌅</Text>
                <View style={styles.collectiveInfo}>
                  <Text style={styles.collectiveTitle}>Next Collective Session</Text>
                  <Text style={styles.collectiveTime}>
                    Starts in {getTimeUntil(upcomingSession.scheduledTime)}
                  </Text>
                  <Text style={styles.collectiveParticipants}>
                    {upcomingSession.participantCount || 0} people joining
                  </Text>
                </View>
              </View>
              <View style={styles.collectiveButton}>
                <Text style={styles.collectiveButtonText}>Join →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

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
    backgroundColor: '#ECECEC',
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
    backgroundColor: '#D2CCAB',
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  collectiveCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  collectiveGradient: {
    padding: theme.spacing.lg,
  },
  collectiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  collectiveIcon: {
    fontSize: 40,
    marginRight: theme.spacing.md,
  },
  collectiveInfo: {
    flex: 1,
  },
  collectiveTitle: {
    ...theme.typography.h3,
    color: theme.colors.cream,
    marginBottom: 4,
  },
  collectiveTime: {
    ...theme.typography.body,
    color: theme.colors.cream,
    opacity: 0.9,
    marginBottom: 2,
  },
  collectiveParticipants: {
    ...theme.typography.small,
    color: theme.colors.cream,
    opacity: 0.8,
  },
  collectiveButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
  },
  collectiveButtonText: {
    ...theme.typography.body,
    color: theme.colors.cream,
    fontWeight: '600',
  },
  featuredCard: {
    backgroundColor: '#F6F5F1',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: '#D5D1C6',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D8CE9C',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  featuredBadgeText: {
    ...theme.typography.tiny,
    color: '#565129',
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
    backgroundColor: '#5C6C57',
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
    backgroundColor: '#F6F5F1',
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#D6D1C5',
  },
  categoryContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FAF8F3',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#D8D3C8',
    alignSelf: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#7B845F',
    borderColor: '#7B845F',
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
  pageContent: {
    paddingBottom: theme.spacing.lg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  meditationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5EE',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: '#D8D3C8',
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
    backgroundColor: '#66734E',
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
