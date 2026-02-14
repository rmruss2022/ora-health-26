import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { quizAPI } from '../../services/api';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'single-choice' | 'slider' | 'text';
  question: string;
  options?: string[];
  min?: number;
  max?: number;
  optional?: boolean;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    type: 'multiple-choice',
    question: 'What brings you to Ora?',
    options: ['Manage stress', 'Personal growth', 'Build better habits', 'Improve relationships', 'Self-discovery', 'Other'],
  },
  {
    id: 2,
    type: 'single-choice',
    question: 'What area of your life needs most attention right now?',
    options: ['Work', 'Relationships', 'Health', 'Personal growth', 'Emotional wellness'],
  },
  {
    id: 3,
    type: 'single-choice',
    question: 'How do you prefer to reflect?',
    options: ['Writing', 'Talking', 'Guided exercises', 'Meditation'],
  },
  {
    id: 4,
    type: 'text',
    question: 'What's your biggest challenge right now?',
  },
  {
    id: 5,
    type: 'single-choice',
    question: 'How often do you want to check in?',
    options: ['Daily', 'A few times a week', 'Weekly', 'As needed'],
  },
  {
    id: 6,
    type: 'single-choice',
    question: 'What time works best for you?',
    options: ['Morning (6-10am)', 'Afternoon (12-4pm)', 'Evening (6-10pm)', 'Varies'],
  },
  {
    id: 7,
    type: 'single-choice',
    question: 'Have you tried therapy or counseling?',
    options: ['Yes, currently', 'Yes, in the past', 'No', 'Prefer not to say'],
  },
  {
    id: 8,
    type: 'slider',
    question: 'How would you describe your current stress level?',
    min: 1,
    max: 10,
  },
  {
    id: 9,
    type: 'multiple-choice',
    question: 'What motivates you most?',
    options: ['Accountability', 'Encouragement', 'Insights', 'Structure', 'Freedom'],
  },
  {
    id: 10,
    type: 'text',
    question: 'Anything else you'd like me to know?',
    optional: true,
  },
];

export const IntakeQuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: any}>({});
  const [submitting, setSubmitting] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = (currentQuestion + 1) / QUIZ_QUESTIONS.length;

  const animateTransition = useCallback((direction: 'next' | 'prev') => {
    const toValue = direction === 'next' ? -width : width;
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(direction === 'next' ? width : -width);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [slideAnim, fadeAnim]);

  const handleAnswer = useCallback((answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [question.id]: answer,
    }));
  }, [question]);

  const handleNext = useCallback(() => {
    const answer = answers[question.id];
    
    if (!question.optional && !answer) {
      Alert.alert('Required', 'Please answer this question before continuing');
      return;
    }

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      animateTransition('next');
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentQuestion, answers, question, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentQuestion > 0) {
      animateTransition('prev');
      setCurrentQuestion(prev => prev - 1);
    }
  }, [currentQuestion, animateTransition]);

  const handleSkip = useCallback(() => {
    if (question.optional) {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        animateTransition('next');
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  }, [currentQuestion, question, animateTransition]);

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      
      // Transform answers into API format
      const quizResponses = QUIZ_QUESTIONS.map(q => ({
        question_id: q.id,
        question: q.question,
        answer: answers[q.id] || null,
      }));

      await quizAPI.submitQuiz({ responses: quizResponses });

      // Navigate to home
      navigation.navigate('Main' as never);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  }, [answers, navigation]);

  const renderQuestionContent = () => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <View style={styles.optionsContainer}>
            {question.options?.map((option, index) => {
              const isSelected = Array.isArray(answer) && answer.includes(option);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => {
                    const currentAnswers = answer || [];
                    const newAnswers = isSelected
                      ? currentAnswers.filter((a: string) => a !== option)
                      : [...currentAnswers, option];
                    handleAnswer(newAnswers);
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'single-choice':
        return (
          <View style={styles.optionsContainer}>
            {question.options?.map((option, index) => {
              const isSelected = answer === option;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => handleAnswer(option)}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'slider':
        return (
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Low</Text>
              <Text style={styles.sliderLabel}>High</Text>
            </View>
            <View style={styles.sliderValues}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(value => {
                const isSelected = answer === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.sliderValue, isSelected && styles.sliderValueSelected]}
                    onPress={() => handleAnswer(value)}
                  >
                    <Text style={[styles.sliderValueText, isSelected && styles.sliderValueTextSelected]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="Type your answer here..."
            value={answer || ''}
            onChangeText={handleAnswer}
            multiline
            textAlignVertical="top"
            placeholderTextColor={theme.colors.textSecondary}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
        </Text>
      </View>

      {/* Question Card */}
      <Animated.View
        style={[
          styles.questionCard,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.questionText}>{question.question}</Text>
          {renderQuestionContent()}
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentQuestion > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        {question.optional && !answers[question.id] && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!answers[question.id] && !question.optional) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={submitting || (!answers[question.id] && !question.optional)}
        >
          <Text style={styles.nextButtonText}>
            {submitting
              ? 'Submitting...'
              : currentQuestion === QUIZ_QUESTIONS.length - 1
              ? 'Finish'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E8D8C8',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  questionCard: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily.heading,
    color: theme.colors.text,
    lineHeight: 32,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sliderContainer: {
    marginTop: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  sliderValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sliderValue: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  sliderValueSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sliderValueText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text,
  },
  sliderValueTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    minHeight: 120,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text,
    lineHeight: 24,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.body,
    color: '#FFFFFF',
  },
});
