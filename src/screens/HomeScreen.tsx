import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { meditationApi, Meditation, MeditationStats } from '../services/meditation';
import { theme } from '../theme';

const weekDays = [
  { day: 'Mon', value: 0, isActive: true },
  { day: 'Tue', value: 0, isActive: true },
  { day: 'Wed', value: 0, isActive: true },
  { day: 'Thu', value: 15, isActive: false },
  { day: 'Fri', value: 16, isActive: false },
  { day: 'Sat', value: 17, isActive: false },
  { day: 'Sun', value: 18, isActive: false, isMuted: true },
];

const HOME_CACHE_KEY = 'home-dashboard-cache-v1';
const REQUEST_TIMEOUT_MS = 2500;

const HERO_IMAGE_URI =
  'https://images.pexels.com/photos/1054655/pexels-photo-1054655.jpeg?auto=compress&cs=tinysrgb&w=900&q=70';
const FEATURED_IMAGE_URI =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=640&q=65';
const QUICK_PLAN_IMAGE_URI =
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=520&q=60';
const QUICK_WORKSHOP_IMAGE_URI =
  'https://images.unsplash.com/photo-1616628182509-6f27f72f0d69?auto=format&fit=crop&w=520&q=60';

const FALLBACK_STATS: MeditationStats = {
  totalSessions: 20,
  totalMinutes: 0,
  currentStreak: 7,
  completedThisWeek: 7,
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [featuredMeditation, setFeaturedMeditation] = useState<Meditation | null>(null);
  const [stats, setStats] = useState<MeditationStats | null>(FALLBACK_STATS);
  const [isLoadingHomeData, setIsLoadingHomeData] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadFromCache = async () => {
      try {
        const cachedRaw = await AsyncStorage.getItem(HOME_CACHE_KEY);
        if (!cachedRaw || !mounted) return;

        const cached = JSON.parse(cachedRaw) as {
          featuredMeditation?: Meditation | null;
          stats?: MeditationStats | null;
        };

        if (cached.featuredMeditation) {
          setFeaturedMeditation(cached.featuredMeditation);
        }
        if (cached.stats) {
          setStats(cached.stats);
        }
      } catch (error) {
        console.warn('Failed to parse home cache:', error);
      }
    };

    const loadHomeData = async () => {
      setIsLoadingHomeData(true);
      try {
        const statsPromise = withTimeout(meditationApi.getUserStats(user?.id), REQUEST_TIMEOUT_MS);
        const featuredPromise = withTimeout(
          meditationApi.getMeditationsByCategory('breathwork'),
          REQUEST_TIMEOUT_MS
        ).catch(async () => {
          return withTimeout(meditationApi.getAllMeditations(), REQUEST_TIMEOUT_MS);
        });

        const [meditationsResult, statsResult] = await Promise.allSettled([featuredPromise, statsPromise]);

        if (!mounted) return;

        const allMeditations =
          meditationsResult.status === 'fulfilled' ? meditationsResult.value : [];
        const meditationStats = statsResult.status === 'fulfilled' ? statsResult.value : FALLBACK_STATS;

        const preferredMeditation =
          allMeditations.find((entry) => entry.category === 'breathwork') ?? allMeditations[0] ?? null;
        setFeaturedMeditation(preferredMeditation);
        setStats(meditationStats);

        await AsyncStorage.setItem(
          HOME_CACHE_KEY,
          JSON.stringify({
            featuredMeditation: preferredMeditation,
            stats: meditationStats,
          })
        );
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        if (mounted) {
          setIsLoadingHomeData(false);
        }
      }
    };

    loadFromCache().finally(loadHomeData);

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const greetingName = useMemo(() => user?.name?.split(' ')[0] || 'Matt', [user?.name]);
  const streakDays = stats?.currentStreak ?? 7;
  const totalSessions = stats?.totalSessions ?? 20;
  const completedThisWeek = stats?.completedThisWeek ?? 7;
  const featuredDuration = featuredMeditation?.duration ?? 10;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={{ uri: HERO_IMAGE_URI }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
          imageStyle={styles.heroImage}
        >
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>09:41</Text>
          </View>
          <View style={styles.heroHeader}>
            <Text style={styles.greeting}>Hi {greetingName}</Text>
            <View style={styles.statPills}>
              <View style={styles.pill}>
                <Text style={styles.pillIcon}>⌂</Text>
                <Text style={styles.pillValue}>{completedThisWeek}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillIcon}>🏆</Text>
                <Text style={styles.pillValue}>{totalSessions}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.affirmationCard}>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>Week 5</Text>
          </View>
          <View style={styles.cardHeader}>
            <View style={styles.coin}>
              <Text style={styles.coinText}>ORA</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Self Compassion</Text>
              <Text style={styles.cardSubTitle}>Day {Math.min(completedThisWeek, 7)}/7</Text>
            </View>
          </View>

          <View style={styles.affirmationInner}>
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>Today&apos;s Affirmation</Text>
            </View>
            <Text style={styles.affirmationTitle}>I am kind to myself</Text>
            <Text style={styles.affirmationBody}>
              I embrace my journey with compassion, knowing I am enough as I am.
            </Text>
          </View>
          <Text style={styles.dots}>•◦◦</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHero}>
            <Image
              source={{ uri: FEATURED_IMAGE_URI }}
              style={styles.sectionHeroImage}
            />
          </View>
          <View style={styles.sectionMeta}>
            <Text style={styles.sectionTitle}>{featuredMeditation?.title || 'Meditation for today'}</Text>
            <Text style={styles.sectionCaption}>
              {featuredMeditation?.description || 'Take a moment to center yourself.'}
            </Text>
            <View style={styles.xpPill}>
              <Text style={styles.xpPillText}>XP {featuredDuration * 10}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Chat', { conversationMode: 'planning' })}
          >
            <Image
              source={{ uri: QUICK_PLAN_IMAGE_URI }}
              style={styles.quickImage}
            />
            <View style={styles.quickFooter}>
              <Text style={styles.quickLabel}>Plan your week</Text>
              <Text style={styles.quickArrow}>›</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Meditate')}
          >
            <Image
              source={{ uri: QUICK_WORKSHOP_IMAGE_URI }}
              style={styles.quickImage}
            />
            <View style={styles.quickFooter}>
              <Text style={styles.quickLabel}>Workshops</Text>
              <Text style={styles.quickArrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakTitle}>{streakDays} days streak</Text>
          <Text style={styles.streakSubTitle}>Way to go {greetingName}</Text>
          <View style={styles.streakMeta}>
            <Text style={styles.streakDate}>Jan 25</Text>
            <Text style={styles.history}>View history</Text>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((entry) => (
              <View key={entry.day} style={[styles.dayItem, entry.isMuted && styles.dayItemMuted]}>
                <Text style={styles.dayLabel}>{entry.day}</Text>
                <View style={[styles.dayBubble, entry.isActive ? styles.dayBubbleActive : styles.dayBubbleNeutral]}>
                  <Text style={[styles.dayValue, entry.isActive && styles.dayValueActive]}>
                    {entry.isActive ? '◉' : entry.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        {isLoadingHomeData && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#66734E" />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  hero: {
    height: 370,
    paddingHorizontal: 26,
    justifyContent: 'space-between',
    paddingBottom: 44,
  },
  heroImage: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  timeRow: {
    paddingTop: 4,
  },
  timeText: {
    color: '#F7F7F4',
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 21,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: '#FAFBF8',
    fontFamily: theme.typography.h3.fontFamily,
    fontSize: 38,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statPills: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillIcon: {
    fontSize: 14,
    color: '#3F4A3F',
  },
  pillValue: {
    fontFamily: theme.typography.button.fontFamily,
    color: '#2E3C31',
    fontSize: 14,
  },
  affirmationCard: {
    marginHorizontal: 22,
    marginTop: -52,
    borderRadius: 24,
    backgroundColor: '#F6F5F2',
    borderWidth: 1,
    borderColor: '#D5D1C6',
    padding: 16,
    shadowColor: '#2A2A2A',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  weekBadge: {
    position: 'absolute',
    right: 16,
    top: -12,
    backgroundColor: '#C8BB6D',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 2,
  },
  weekBadgeText: {
    fontFamily: theme.typography.labelSmall.fontFamily,
    color: '#4F4A2A',
    fontSize: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  coin: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#C0BAA7',
    borderWidth: 2,
    borderColor: '#9C9688',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: '#504D44',
  },
  cardTitle: {
    fontFamily: theme.typography.h4.fontFamily,
    color: '#3A3934',
    fontSize: 22,
  },
  cardSubTitle: {
    fontFamily: theme.typography.label.fontFamily,
    color: '#6F8168',
    fontSize: 12,
    marginTop: 2,
  },
  affirmationInner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5C78D',
    backgroundColor: '#F8F6EF',
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  todayPill: {
    marginTop: -28,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#C5C98F',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  todayPillText: {
    fontFamily: theme.typography.labelSmall.fontFamily,
    fontSize: 12,
    color: '#4A5034',
  },
  affirmationTitle: {
    fontFamily: theme.typography.h3.fontFamily,
    color: '#6A7347',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 4,
  },
  affirmationBody: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: '#6A6A64',
    textAlign: 'center',
    lineHeight: 20,
  },
  dots: {
    textAlign: 'center',
    color: '#7D8B62',
    marginTop: 10,
    letterSpacing: 2,
  },
  sectionCard: {
    marginTop: 20,
    marginHorizontal: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D5D1C6',
    backgroundColor: '#F7F5EE',
    overflow: 'hidden',
  },
  sectionHero: {
    height: 218,
    backgroundColor: '#DBD2A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.88,
  },
  sectionMeta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  sectionTitle: {
    fontFamily: theme.typography.h4.fontFamily,
    fontSize: 18,
    color: '#575545',
  },
  sectionCaption: {
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: '#8A8778',
    fontSize: 14,
  },
  xpPill: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#D4C57D',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  xpPillText: {
    fontFamily: theme.typography.labelSmall.fontFamily,
    color: '#5A522B',
    fontSize: 11,
  },
  quickGrid: {
    marginTop: 10,
    marginHorizontal: 22,
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5D1C6',
    backgroundColor: '#F4F2EB',
    overflow: 'hidden',
  },
  quickImage: {
    width: '100%',
    height: 90,
  },
  quickFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  quickLabel: {
    fontFamily: theme.typography.body.fontFamily,
    color: '#5B5952',
    fontSize: 16,
  },
  quickArrow: {
    color: '#7A7A66',
    fontSize: 20,
  },
  streakCard: {
    marginTop: 12,
    marginHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7D3C8',
    backgroundColor: '#F6F4EE',
    padding: 14,
  },
  streakTitle: {
    fontFamily: theme.typography.h4.fontFamily,
    fontSize: 32,
    color: '#555249',
  },
  streakSubTitle: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 15,
    color: '#657C69',
  },
  streakMeta: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakDate: {
    fontFamily: theme.typography.label.fontFamily,
    color: '#C6C1B4',
    fontSize: 16,
  },
  history: {
    fontFamily: theme.typography.label.fontFamily,
    color: '#6E7C74',
    fontSize: 16,
  },
  weekRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    width: 38,
  },
  dayItemMuted: {
    opacity: 0.7,
  },
  dayLabel: {
    fontFamily: theme.typography.labelSmall.fontFamily,
    color: '#8B8B82',
    fontSize: 12,
    marginBottom: 6,
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleActive: {
    backgroundColor: '#6125B3',
  },
  dayBubbleNeutral: {
    backgroundColor: '#E6E4E5',
  },
  dayValue: {
    fontFamily: theme.typography.label.fontFamily,
    color: '#6A6A6A',
    fontSize: 13,
  },
  dayValueActive: {
    color: '#F3ECFF',
    fontSize: 12,
  },
  loadingOverlay: {
    marginTop: 10,
    alignItems: 'center',
  },
});

export default HomeScreen;
