import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { MeditationFilters } from './MeditationFilterModal';

export interface Meditation {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  icon: string;
  mood?: string;
  difficulty?: string;
}

interface MeditationListProps {
  meditations: Meditation[];
  filters?: MeditationFilters;
  onMeditationPress: (meditation: Meditation) => void;
}

export const MeditationList: React.FC<MeditationListProps> = ({
  meditations,
  filters,
  onMeditationPress,
}) => {
  // Apply filters
  const filteredMeditations = meditations.filter((meditation) => {
    if (filters?.duration && filters.duration.length > 0) {
      if (!filters.duration.includes(meditation.duration)) return false;
    }

    if (filters?.category && filters.category.length > 0) {
      if (!filters.category.includes(meditation.category)) return false;
    }

    if (filters?.mood && filters.mood.length > 0) {
      if (!meditation.mood || !filters.mood.includes(meditation.mood)) return false;
    }

    if (filters?.difficulty) {
      if (meditation.difficulty !== filters.difficulty) return false;
    }

    return true;
  });

  if (filteredMeditations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No modules found</Text>
        <Text style={styles.emptySubtitle}>Try browsing another series</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {filteredMeditations.map((meditation, index) => (
        <TouchableOpacity
          key={meditation.id}
          style={styles.card}
          onPress={() => onMeditationPress(meditation)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#4A90E2', '#50E3C2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          />
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.moduleLabel}>Module {index + 1}</Text>
                <Text style={styles.title}>{meditation.title}</Text>
              </View>
              <Text style={styles.duration}>{meditation.duration} min</Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {meditation.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  moduleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.lavender,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.forestGreen,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
