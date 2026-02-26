import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise, ExerciseType } from '../types/exercise';
import { exerciseService } from '../services/exercise.service';
import { theme } from '../theme';

export function ExerciseLibraryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [types, setTypes] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [exercisesData, typesData] = await Promise.all([
        exerciseService.getAllExercises(),
        exerciseService.getExerciseTypes(),
      ]);
      setExercises(exercisesData);
      setTypes(typesData);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favs = await exerciseService.getUserFavorites();
      setExercises(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'favorites') => {
    setFilter(newFilter);
    if (newFilter === 'favorites') {
      loadFavorites();
    } else {
      loadData();
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = 
      exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !selectedType || exercise.type_id === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleExercisePress = (exercise: Exercise) => {
    navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#F8F7F3', '#FFF9F0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guided Exercises</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#A8A59A"
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'favorites' && styles.filterChipActive]}
            onPress={() => handleFilterChange('favorites')}
          >
            <Text style={[styles.filterChipText, filter === 'favorites' && styles.filterChipTextActive]}>
              ⭐ Favorites
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typesScroll}
          contentContainerStyle={styles.typesScrollContent}
        >
          <TouchableOpacity
            style={[styles.typeChip, !selectedType && styles.typeChipActive]}
            onPress={() => setSelectedType(null)}
          >
            <Text style={[styles.typeChipText, !selectedType && styles.typeChipTextActive]}>
              All Types
            </Text>
          </TouchableOpacity>
          {types.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeChip, selectedType === type.id && styles.typeChipActive]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={styles.typeChipIcon}>{type.icon}</Text>
              <Text style={[styles.typeChipText, selectedType === type.id && styles.typeChipTextActive]}>
                {type.name.replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView style={styles.exerciseList} contentContainerStyle={styles.exerciseListContent}>
        {filteredExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No exercises found</Text>
          </View>
        ) : (
          filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => handleExercisePress(exercise)}
            >
              <View style={styles.exerciseCardHeader}>
                <Text style={styles.exerciseIcon}>{exercise.type_icon || '✨'}</Text>
                <View style={styles.exerciseCardHeaderRight}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                      {exercise.difficulty}
                    </Text>
                  </View>
                  {exercise.is_favorited && (
                    <Text style={styles.favoriteIcon}>⭐</Text>
                  )}
                </View>
              </View>

              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>

              <View style={styles.exerciseFooter}>
                <Text style={styles.exerciseDuration}>🕐 {exercise.duration_minutes} min</Text>
                {(exercise.completion_count || 0) > 0 && (
                  <Text style={styles.completionCount}>
                    ✓ {exercise.completion_count} {exercise.completion_count === 1 ? 'time' : 'times'}
                  </Text>
                )}
              </View>

              {exercise.tags && exercise.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {exercise.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F3',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#526253',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3A2E',
    fontFamily: theme.typography.h2.fontFamily,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2D3A2E',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  filterChipActive: {
    backgroundColor: '#526253',
    borderColor: '#526253',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7268',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  typesScroll: {
    marginHorizontal: -16,
  },
  typesScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  typeChipActive: {
    backgroundColor: '#A9C9A4',
    borderColor: '#A9C9A4',
  },
  typeChipIcon: {
    fontSize: 16,
  },
  typeChipText: {
    fontSize: 13,
    color: '#6B7268',
    textTransform: 'capitalize',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#A8A59A',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseIcon: {
    fontSize: 32,
  },
  exerciseCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  favoriteIcon: {
    fontSize: 18,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2E',
    marginBottom: 6,
    fontFamily: theme.typography.h3.fontFamily,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6B7268',
    lineHeight: 20,
    marginBottom: 12,
  },
  exerciseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseDuration: {
    fontSize: 13,
    color: '#8B9186',
  },
  completionCount: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#F3F1EC',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7268',
  },
});
