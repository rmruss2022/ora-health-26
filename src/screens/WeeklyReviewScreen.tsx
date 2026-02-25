import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { exerciseService } from '../services/exercise.service';
import { WeeklyPlan } from '../types/exercise';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  {
    title: 'Review Your Intentions',
    prompt: 'How did each intention go this week? Rate them honestly.',
    key: 'intentionRatings',
    isRating: true,
  },
  {
    title: 'Celebrate Your Wins',
    prompt: 'What went well? Even small victories matter.',
    placeholder: 'e.g., "Meditated 5 days this week"...',
    key: 'wins',
    isList: true,
  },
  {
    title: 'Acknowledge Challenges',
    prompt: 'What was difficult? It is okay to struggle.',
    placeholder: 'e.g., "Hard to stay consistent"...',
    key: 'challenges',
    isList: true,
  },
  {
    title: 'What Did You Learn?',
    prompt: 'Every week teaches us something.',
    placeholder: 'Insights, realizations, lessons...',
    key: 'learnings',
    isList: true,
  },
  {
    title: 'Gratitude',
    prompt: 'What are you grateful for from this week?',
    placeholder: 'Big or small, what fills your heart...',
    key: 'gratitude',
  },
];

export function WeeklyReviewScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<any>({
    intentionRatings: {},
    wins: [''],
    challenges: [''],
    learnings: [''],
    gratitude: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  useEffect(() => {
    loadWeeklyPlan();
  }, []);

  useEffect(() => {
    if (!loading) {
      animateIn();
    }
  }, [currentStep, loading]);

  const loadWeeklyPlan = async () => {
    try {
      const result = await exerciseService.getCurrentWeekPlan();
      setWeeklyPlan(result.plan);
      
      // Initialize intention ratings
      if (result.plan) {
        const ratings: any = {};
        result.plan.intentions.forEach((intention) => {
          ratings[intention] = 0;
        });
        setReviewData((prev: any) => ({ ...prev, intentionRatings: ratings }));
      }
    } catch (error) {
      console.error('Error loading weekly plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!weeklyPlan) return;

    try {
      setSubmitting(true);

      // Filter out empty entries
      const wins = reviewData.wins.filter((w: string) => w.trim());
      const challenges = reviewData.challenges.filter((c: string) => c.trim());
      const learnings = reviewData.learnings.filter((l: string) => l.trim());

      await exerciseService.createWeeklyReview({
        weeklyPlanId: weeklyPlan.id,
        weekStartDate: weeklyPlan.week_start_date,
        weekEndDate: weeklyPlan.week_end_date,
        intentionRatings: reviewData.intentionRatings,
        wins,
        challenges,
        learnings,
        gratitude: reviewData.gratitude.trim() || undefined,
        sharedToCommunity: false,
      });

      navigation.replace('WeeklyReviewComplete');
    } catch (error) {
      console.error('Error saving weekly review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const canProgress = () => {
    if (step.key === 'intentionRatings') {
      const allRated = Object.values(reviewData.intentionRatings).every((rating: any) => rating > 0);
      return allRated;
    }
    if (step.isList) {
      const validItems = reviewData[step.key].filter((item: string) => item.trim());
      return validItems.length > 0;
    }
    if (step.key === 'gratitude') {
      return reviewData.gratitude.trim().length > 0;
    }
    return true;
  };

  const handleTextChange = (text: string) => {
    setReviewData({ ...reviewData, [step.key]: text });
  };

  const handleListItemChange = (index: number, text: string) => {
    const newList = [...reviewData[step.key]];
    newList[index] = text;
    setReviewData({ ...reviewData, [step.key]: newList });
  };

  const handleAddListItem = () => {
    setReviewData({ ...reviewData, [step.key]: [...reviewData[step.key], ''] });
  };

  const handleRemoveListItem = (index: number) => {
    const newList = reviewData[step.key].filter((_: any, i: number) => i !== index);
    setReviewData({ ...reviewData, [step.key]: newList });
  };

  const handleRateIntention = (intention: string, rating: number) => {
    setReviewData({
      ...reviewData,
      intentionRatings: {
        ...reviewData.intentionRatings,
        [intention]: rating,
      },
    });
  };

  const renderStepContent = () => {
    if (step.isRating && weeklyPlan) {
      return (
        <View style={styles.ratingsContainer}>
          {weeklyPlan.intentions.map((intention) => (
            <View key={intention} style={styles.ratingItem}>
              <Text style={styles.intentionText}>{intention}</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRateIntention(intention, star)}
                    style={styles.starButton}
                  >
                    <Text style={styles.star}>
                      {star <= (reviewData.intentionRatings[intention] || 0) ? '⭐' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (step.isList) {
      return (
        <View style={styles.listContainer}>
          {reviewData[step.key].map((item: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <TextInput
                style={styles.listInput}
                placeholder={step.placeholder}
                placeholderTextColor="#A8A59A"
                value={item}
                onChangeText={(text) => handleListItemChange(index, text)}
                multiline
              />
              {reviewData[step.key].length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveListItem(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddListItem}
          >
            <Text style={styles.addButtonText}>+ Add Another</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TextInput
        style={styles.textInput}
        placeholder={step.placeholder}
        placeholderTextColor="#A8A59A"
        value={reviewData[step.key]}
        onChangeText={handleTextChange}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!weeklyPlan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#FCE4EC', '#F8BBD0']} style={styles.gradient}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Plan to Review</Text>
            <Text style={styles.emptyMessage}>
              Create a weekly plan first to track your progress.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('WeeklyPlanning')}
            >
              <LinearGradient
                colors={['#526253', '#3D4A3E']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Create Weekly Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FCE4EC', '#F8BBD0', '#FCE4EC']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Review</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStep + 1} of {STEPS.length}</Text>
        </View>

        <Animated.View
          style={[
            styles.stepContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepPrompt}>{step.prompt}</Text>

            {renderStepContent()}
          </ScrollView>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.nextButton, !canProgress() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProgress() || submitting}
          >
            <LinearGradient
              colors={canProgress() ? ['#526253', '#3D4A3E'] : ['#CCC', '#AAA']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {submitting ? 'Saving...' : isLastStep ? 'Complete' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCE4EC',
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
  },
  backButtonText: {
    fontSize: 28,
    color: '#526253',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2E',
    fontFamily: theme.typography.h2.fontFamily,
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#526253',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7268',
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3A2E',
    marginBottom: 12,
    fontFamily: theme.typography.h1.fontFamily,
  },
  stepPrompt: {
    fontSize: 16,
    color: '#6B7268',
    lineHeight: 24,
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2D3A2E',
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#E5E1D8',
    textAlignVertical: 'top',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  listInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2D3A2E',
    borderWidth: 1,
    borderColor: '#E5E1D8',
    minHeight: 48,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    fontSize: 16,
    color: '#EF5350',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E1D8',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    color: '#6B7268',
    fontWeight: '500',
  },
  ratingsContainer: {
    gap: 24,
  },
  ratingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },
  intentionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3A2E',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3A2E',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: theme.typography.h1.fontFamily,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7268',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  button: {
    width: 250,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
