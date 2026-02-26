import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../types/exercise';
import { exerciseService } from '../services/exercise.service';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ExerciseCompleteScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { exercise, duration, completionId } = route.params as {
    exercise: Exercise;
    duration: number;
    completionId: string;
  };

  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [moodAfter, setMoodAfter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const moods = [
    { emoji: '😌', label: 'Calm' },
    { emoji: '😊', label: 'Happy' },
    { emoji: '✨', label: 'Energized' },
    { emoji: '🙏', label: 'Grateful' },
    { emoji: '💪', label: 'Strong' },
  ];

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await exerciseService.completeExercise(completionId, {
        durationSeconds: duration,
        moodAfter,
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim() || undefined,
      });

      navigation.navigate('Home');
    } catch (error) {
      console.error('Error submitting completion:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#F8F7F3', '#FFF9F0']}
        style={styles.gradient}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.celebration}>
            <Text style={styles.celebrationIcon}>🎉</Text>
            <Text style={styles.celebrationTitle}>Well Done!</Text>
            <Text style={styles.celebrationSubtitle}>You completed</Text>
            <Text style={styles.exerciseTitle}>{exercise.title}</Text>
            <Text style={styles.durationText}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How do you feel?</Text>
            <View style={styles.moodsContainer}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodButton,
                    moodAfter === mood.label && styles.moodButtonSelected,
                  ]}
                  onPress={() => setMoodAfter(mood.label)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    moodAfter === mood.label && styles.moodLabelSelected,
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate this exercise</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Text style={styles.star}>
                    {star <= rating ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Any thoughts? (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="How was your experience..."
              placeholderTextColor="#A8A59A"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#526253', '#3D4A3E']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Saving...' : 'Finish'}
              </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  celebration: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  celebrationIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3A2E',
    marginBottom: 8,
    fontFamily: theme.typography.h1.fontFamily,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#8B9186',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#526253',
    marginBottom: 8,
    fontFamily: theme.typography.h2.fontFamily,
  },
  durationText: {
    fontSize: 18,
    color: '#6B7268',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2E',
    marginBottom: 16,
    fontFamily: theme.typography.h3.fontFamily,
  },
  moodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    width: (SCREEN_WIDTH - 32 - 48) / 5,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E1D8',
  },
  moodButtonSelected: {
    borderColor: '#526253',
    backgroundColor: '#F3F1EC',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: '#6B7268',
  },
  moodLabelSelected: {
    color: '#526253',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 40,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2D3A2E',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F8F7F3',
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
