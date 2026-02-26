import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MeditationSeriesCard, MeditationSeries } from '../components/meditation/MeditationSeriesCard';
import { theme } from '../theme';

// Mock data - replace with API calls
const MOCK_SERIES: MeditationSeries[] = [
  {
    id: 'mindfulness-basics',
    title: 'Mindfulness Basics',
    description: 'Learn the fundamentals of mindfulness meditation with guided practices',
    moduleCount: 7,
    completedModules: 3,
    duration: '7 days',
    category: 'Beginner',
    gradientColors: ['#667eea', '#764ba2'],
  },
  {
    id: 'sleep-deeply',
    title: 'Sleep Deeply',
    description: 'Evening meditations designed to help you fall asleep peacefully',
    moduleCount: 10,
    completedModules: 0,
    duration: '10 days',
    category: 'Sleep',
    gradientColors: ['#2C3E50', '#4A5F7F'],
  },
  {
    id: 'anxiety-relief',
    title: 'Anxiety Relief',
    description: 'Calm your mind and body with practices specifically for anxiety',
    moduleCount: 14,
    completedModules: 7,
    duration: '2 weeks',
    category: 'Wellness',
    gradientColors: ['#11998e', '#38ef7d'],
  },
  {
    id: 'loving-kindness',
    title: 'Cultivating Compassion',
    description: 'Develop loving-kindness for yourself and others through meditation',
    moduleCount: 21,
    completedModules: 0,
    duration: '3 weeks',
    category: 'Growth',
    gradientColors: ['#ee0979', '#ff6a00'],
  },
];

export const MeditationSeriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [series, setSeries] = useState<MeditationSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await meditationApi.getSeries();
      // setSeries(response);
      
      // Mock data for now
      setTimeout(() => {
        setSeries(MOCK_SERIES);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load meditation series:', error);
      setLoading(false);
    }
  };

  const handleSeriesPress = (seriesItem: MeditationSeries) => {
    navigation.navigate('SeriesDetail', { seriesId: seriesItem.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meditation Series</Text>
        <Text style={styles.headerSubtitle}>
          Multi-day guided meditation journeys
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {series.map((item) => (
            <MeditationSeriesCard
              key={item.id}
              series={item}
              onPress={() => handleSeriesPress(item)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
});
