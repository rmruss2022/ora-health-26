import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../types/exercise';
import { exerciseService } from '../services/exercise.service';
import { theme } from '../theme';

export function ExerciseDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { exerciseId } = route.params;
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      const data = await exerciseService.getExerciseById(exerciseId);
      setExercise(data);
    } catch (error) {
      console.error('Error loading exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!exercise) return;
    
    try {
      const result = await exerciseService.toggleFavorite(exerciseId);
      setExercise({ ...exercise, is_favorited: result.isFavorited });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleStart = () => {
    if (!exercise) return;
    navigation.navigate('GuidedExercise', { exercise });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading || !exercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const totalDuration = exercise.content.steps.reduce((sum, step) => sum + (step.duration || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#F8F7F3', '#FFF9F0']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.favoriteButton}
          >
            <Text style={styles.favoriteButtonText}>
              {exercise.is_favorited ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{exercise.type_icon || '✨'}</Text>
          </View>

          <Text style={styles.title}>{exercise.title}</Text>
          <Text style={styles.description}>{exercise.description}</Text>

          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Duration</Text>
              <Text style={styles.metadataValue}>{exercise.duration_minutes} min</Text>
            </View>
            <View style={styles.metadataItem}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                  {exercise.difficulty}
                </Text>
              </View>
            </View>
            {(exercise.completion_count || 0) > 0 && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Completed</Text>
                <Text style={styles.metadataValue}>{exercise.completion_count}x</Text>
              </View>
            )}
          </View>

          {exercise.tags && exercise.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {exercise.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.stepsContainer}>
            <Text style={styles.sectionTitle}>What You'll Do</Text>
            {exercise.content.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepPrompt}>{step.prompt}</Text>
                  {step.duration && (
                    <Text style={styles.stepDuration}>
                      ~{Math.floor(step.duration / 60)}:{(step.duration % 60).toString().padStart(2, '0')} min
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <LinearGradient
              colors={['#526253', '#3D4A3E']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Start Exercise</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F3',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: '#526253',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
  },
  favoriteButtonText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3A2E',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: theme.typography.h1.fontFamily,
  },
  description: {
    fontSize: 16,
    color: '#6B7268',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#8B9186',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2E',
  },
  difficultyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  tagText: {
    fontSize: 12,
    color: '#6B7268',
  },
  stepsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3A2E',
    marginBottom: 16,
    fontFamily: theme.typography.h2.fontFamily,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#526253',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A2E',
    marginBottom: 4,
  },
  stepPrompt: {
    fontSize: 14,
    color: '#6B7268',
    lineHeight: 20,
    marginBottom: 4,
  },
  stepDuration: {
    fontSize: 12,
    color: '#8B9186',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F8F7F3',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
