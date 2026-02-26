import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { quizService, DailyQuiz, QuizQuestion } from '../services/quiz.service';

const { width } = Dimensions.get('window');

export const DailyQuizScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [startTime] = useState(Date.now());

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTodaysQuiz();
  }, []);

  const loadTodaysQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizService.getTodaysQuiz();
      setQuiz(data);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions.questions[currentQuestionIndex];
    const hasAnswer = answers[currentQuestion.id] !== undefined;

    if (!hasAnswer && !currentQuestion.optional) {
      return; // Don't proceed if required question is unanswered
    }

    if (currentQuestionIndex < quiz.questions.questions.length - 1) {
      animateTransition(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      animateTransition(() => {
        setCurrentQuestionIndex((prev) => prev - 1);
      });
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    try {
      setSubmitting(true);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      // Mock user ID - replace with actual auth
      const userId = 'mock-user-id';

      const result = await quizService.submitQuizResponse(
        userId,
        quiz.id,
        answers,
        timeTaken
      );

      setInsights(result.insights);
      animateTransition(() => {
        setShowResults(true);
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderScaleQuestion = (question: QuizQuestion) => {
    const currentValue = answers[question.id];

    return (
      <View style={styles.questionContent}>
        <View style={styles.scaleContainer}>
          {Array.from({ length: question.scale!.max - question.scale!.min + 1 }).map(
            (_, index) => {
              const value = question.scale!.min + index;
              const isSelected = currentValue === value;

              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.scaleButton,
                    isSelected && styles.scaleButtonSelected,
                  ]}
                  onPress={() => handleAnswer(question.id, value)}
                >
                  {question.emoji && (
                    <Text style={styles.scaleEmoji}>{question.emoji[index]}</Text>
                  )}
                  <Text style={[styles.scaleLabel, isSelected && styles.scaleLabelSelected]}>
                    {question.scale!.labels[index]}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </View>
    );
  };

  const renderMultipleChoiceQuestion = (question: QuizQuestion) => {
    const currentValue = answers[question.id] || (question.multiple ? [] : null);

    const handleSelect = (value: string) => {
      if (question.multiple) {
        const current = currentValue as string[];
        if (current.includes(value)) {
          handleAnswer(
            question.id,
            current.filter((v) => v !== value)
          );
        } else {
          if (current.length < (question.maxSelections || Infinity)) {
            handleAnswer(question.id, [...current, value]);
          }
        }
      } else {
        handleAnswer(question.id, value);
      }
    };

    return (
      <View style={styles.questionContent}>
        <View style={styles.optionsContainer}>
          {question.options?.map((option) => {
            const isSelected = question.multiple
              ? (currentValue as string[]).includes(option.value)
              : currentValue === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                onPress={() => handleSelect(option.value)}
              >
                {option.emoji && <Text style={styles.optionEmoji}>{option.emoji}</Text>}
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        {question.multiple && question.maxSelections && (
          <Text style={styles.helperText}>
            Select up to {question.maxSelections} options
          </Text>
        )}
      </View>
    );
  };

  const renderTextQuestion = (question: QuizQuestion) => {
    const currentValue = answers[question.id] || '';

    return (
      <View style={styles.questionContent}>
        <TextInput
          style={styles.textInput}
          placeholder={question.placeholder || 'Type your answer...'}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={4}
          value={currentValue}
          onChangeText={(text) => handleAnswer(question.id, text)}
          textAlignVertical="top"
        />
      </View>
    );
  };

  const renderResults = () => {
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.celebrationEmoji}>🎉</Text>
        <Text style={styles.resultsTitle}>Quiz Complete!</Text>
        <Text style={styles.resultsSubtitle}>Here are your insights:</Text>

        <View style={styles.insightsContainer}>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <Text style={styles.insightType}>
                {insight.insight_type.toUpperCase()}
              </Text>
              <Text style={styles.insightText}>{insight.insight_text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load quiz</Text>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderResults()}
        </ScrollView>
      </View>
    );
  }

  const currentQuestion = quiz.questions.questions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / quiz.questions.questions.length;
  const hasAnswer = answers[currentQuestion.id] !== undefined;
  const canProceed = hasAnswer || currentQuestion.optional;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Check-in</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Question */}
      <Animated.View
        style={[
          styles.questionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {quiz.questions.questions.length}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {currentQuestion.type === 'scale' && renderScaleQuestion(currentQuestion)}
          {currentQuestion.type === 'multiple_choice' &&
            renderMultipleChoiceQuestion(currentQuestion)}
          {currentQuestion.type === 'text' && renderTextQuestion(currentQuestion)}
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + 20 }]}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
            currentQuestionIndex === 0 && styles.nextButtonFull,
          ]}
          onPress={handleNext}
          disabled={!canProceed || submitting}
        >
          <Text style={styles.nextButtonText}>
            {submitting
              ? 'Submitting...'
              : currentQuestionIndex === quiz.questions.questions.length - 1
              ? 'Submit'
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
    backgroundColor: theme.colors.backgroundLight,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error || '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.charcoal,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 2,
  },
  questionContainer: {
    flex: 1,
    marginTop: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    lineHeight: 32,
    marginBottom: 32,
  },
  questionContent: {
    marginBottom: 24,
  },
  scaleContainer: {
    gap: 12,
  },
  scaleButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scaleButtonSelected: {
    borderColor: theme.colors.forestGreen,
    backgroundColor: '#F0FDF4',
  },
  scaleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  scaleLabel: {
    fontSize: 16,
    color: theme.colors.charcoal,
    fontWeight: '500',
  },
  scaleLabelSelected: {
    color: theme.colors.forestGreen,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: theme.colors.forestGreen,
    backgroundColor: '#F0FDF4',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: theme.colors.charcoal,
    fontWeight: '500',
    flex: 1,
  },
  optionLabelSelected: {
    color: theme.colors.forestGreen,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: theme.colors.forestGreen,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.charcoal,
    minHeight: 120,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  nextButton: {
    flex: 2,
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  insightsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  insightCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.forestGreen,
  },
  insightType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.forestGreen,
    marginBottom: 8,
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 15,
    color: theme.colors.charcoal,
    lineHeight: 22,
  },
  doneButton: {
    width: '100%',
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
