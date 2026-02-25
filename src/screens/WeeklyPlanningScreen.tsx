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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { exerciseService } from '../services/exercise.service';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  {
    title: 'Reflect on Last Week',
    prompt: 'Take a moment to look back. What stood out from your past week?',
    placeholder: 'Thoughts, feelings, moments that mattered...',
    key: 'reflections',
  },
  {
    title: 'Set Your Intentions',
    prompt: 'What energy do you want to bring to this week? Choose 3-5 intentions.',
    placeholder: 'e.g., "Be more present", "Practice patience"...',
    key: 'intentions',
    isList: true,
    min: 3,
    max: 5,
  },
  {
    title: 'Choose Focus Areas',
    prompt: 'What areas of your life need attention this week?',
    key: 'focusAreas',
    isSelection: true,
    options: [
      { value: 'meditation', label: 'Meditation', emoji: '🧘' },
      { value: 'community', label: 'Community', emoji: '🤝' },
      { value: 'self-compassion', label: 'Self-Compassion', emoji: '💚' },
      { value: 'mindfulness', label: 'Mindfulness', emoji: '✨' },
      { value: 'gratitude', label: 'Gratitude', emoji: '🙏' },
      { value: 'rest', label: 'Rest & Recovery', emoji: '😌' },
      { value: 'creativity', label: 'Creativity', emoji: '🎨' },
      { value: 'movement', label: 'Movement', emoji: '🏃' },
    ],
  },
  {
    title: 'Set Specific Goals',
    prompt: 'What specific actions will you take to honor your intentions?',
    placeholder: 'e.g., "Meditate 10 minutes daily", "Call a friend"...',
    key: 'goals',
    isList: true,
    max: 5,
  },
];

export function WeeklyPlanningScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [planData, setPlanData] = useState<any>({
    reflections: '',
    intentions: [''],
    focusAreas: [],
    goals: [''],
  });
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  useEffect(() => {
    animateIn();
  }, [currentStep]);

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
    try {
      setSubmitting(true);

      // Get current week dates
      const now = new Date();
      const dayOfWeek = now.getDay();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - dayOfWeek);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const weekStartDate = sunday.toISOString().split('T')[0];
      const weekEndDate = saturday.toISOString().split('T')[0];

      // Filter out empty entries
      const intentions = planData.intentions.filter((i: string) => i.trim());
      const goals = planData.goals.filter((g: string) => g.trim());

      await exerciseService.createWeeklyPlan({
        weekStartDate,
        weekEndDate,
        reflections: planData.reflections.trim() || null,
        intentions,
        focusAreas: planData.focusAreas,
        goals: goals.length > 0 ? goals : null,
      });

      navigation.replace('WeeklyPlanningComplete');
    } catch (error) {
      console.error('Error saving weekly plan:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const canProgress = () => {
    if (step.key === 'reflections') {
      return planData.reflections.trim().length > 0;
    }
    if (step.key === 'intentions') {
      const validIntentions = planData.intentions.filter((i: string) => i.trim());
      return validIntentions.length >= (step.min || 1);
    }
    if (step.key === 'focusAreas') {
      return planData.focusAreas.length > 0;
    }
    if (step.key === 'goals') {
      return true; // Goals are optional
    }
    return true;
  };

  const handleTextChange = (text: string) => {
    setPlanData({ ...planData, [step.key]: text });
  };

  const handleListItemChange = (index: number, text: string) => {
    const newList = [...planData[step.key]];
    newList[index] = text;
    setPlanData({ ...planData, [step.key]: newList });
  };

  const handleAddListItem = () => {
    const currentList = planData[step.key] || [];
    if (!step.max || currentList.length < step.max) {
      setPlanData({ ...planData, [step.key]: [...currentList, ''] });
    }
  };

  const handleRemoveListItem = (index: number) => {
    const newList = planData[step.key].filter((_: any, i: number) => i !== index);
    setPlanData({ ...planData, [step.key]: newList });
  };

  const toggleFocusArea = (value: string) => {
    const current = planData.focusAreas || [];
    if (current.includes(value)) {
      setPlanData({ ...planData, focusAreas: current.filter((v: string) => v !== value) });
    } else {
      setPlanData({ ...planData, focusAreas: [...current, value] });
    }
  };

  const renderStepContent = () => {
    if (step.isSelection) {
      return (
        <View style={styles.optionsContainer}>
          {step.options?.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                planData[step.key]?.includes(option.value) && styles.optionButtonSelected,
              ]}
              onPress={() => toggleFocusArea(option.value)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.optionLabel,
                planData[step.key]?.includes(option.value) && styles.optionLabelSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (step.isList) {
      return (
        <View style={styles.listContainer}>
          {planData[step.key].map((item: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <TextInput
                style={styles.listInput}
                placeholder={step.placeholder}
                placeholderTextColor="#A8A59A"
                value={item}
                onChangeText={(text) => handleListItemChange(index, text)}
                multiline
              />
              {planData[step.key].length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveListItem(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {(!step.max || planData[step.key].length < step.max) && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddListItem}
            >
              <Text style={styles.addButtonText}>+ Add Another</Text>
            </TouchableOpacity>
          )}

          {step.min && (
            <Text style={styles.hint}>
              Add at least {step.min}, up to {step.max || 'many'}
            </Text>
          )}
        </View>
      );
    }

    return (
      <TextInput
        style={styles.textInput}
        placeholder={step.placeholder}
        placeholderTextColor="#A8A59A"
        value={planData[step.key]}
        onChangeText={handleTextChange}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
    );
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FFF9E6', '#FFE4B5']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Planning</Text>
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
    backgroundColor: '#FFF9E6',
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
  hint: {
    fontSize: 12,
    color: '#8B9186',
    textAlign: 'center',
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    width: (SCREEN_WIDTH - 32 - 36) / 3,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E1D8',
    padding: 12,
  },
  optionButtonSelected: {
    borderColor: '#526253',
    backgroundColor: '#F3F1EC',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    color: '#6B7268',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#526253',
    fontWeight: '600',
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
});
