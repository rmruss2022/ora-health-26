import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise, ExerciseStep, ExerciseCompletion } from '../types/exercise';
import { exerciseService } from '../services/exercise.service';
import { theme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function GuidedExerciseScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { exercise } = route.params as { exercise: Exercise };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stepElapsedTime, setStepElapsedTime] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps = exercise.content.steps;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    // Animate in the step
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setStepElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    // Auto-advance if step has a duration and we've reached it
    if (isPlaying && currentStepData && currentStepData.duration && stepElapsedTime >= currentStepData.duration) {
      handleNextStep();
    }
  }, [stepElapsedTime, isPlaying]);

  const handleStart = async () => {
    try {
      const completion = await exerciseService.startExercise(exercise.id);
      setCompletionId(completion.id);
      setIsPlaying(true);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error starting exercise:', error);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleResume = () => {
    setIsPlaying(true);
  };

  const handleNextStep = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        setStepElapsedTime(0);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.95);
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
        setStepElapsedTime(0);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.95);
      });
    }
  };

  const handleComplete = async () => {
    if (!completionId) return;

    try {
      await exerciseService.completeExercise(completionId, {
        durationSeconds: elapsedTime,
      });

      navigation.navigate('ExerciseComplete', {
        exercise,
        duration: elapsedTime,
        completionId,
      });
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get background gradient based on exercise type
  const getGradientColors = () => {
    const typeName = exercise.type_name || '';
    if (typeName.includes('morning')) return ['#FFF9E6', '#FFE4B5', '#FFF9E6'];
    if (typeName.includes('evening')) return ['#2D2A4A', '#3D3A5A', '#4D4A6A'];
    if (typeName.includes('breath')) return ['#E0F2FE', '#BAE6FD', '#7DD3FC'];
    if (typeName.includes('body')) return ['#FCE7F3', '#FBCFE8', '#F9A8D4'];
    if (typeName.includes('loving')) return ['#FEE2E2', '#FECACA', '#FCA5A5'];
    return ['#F8F7F3', '#FFF9F0', '#F8F7F3'];
  };

  if (!isPlaying && completionId === null) {
    // Pre-start screen
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={getGradientColors()} style={styles.gradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.preStartContent}>
            <Text style={styles.preStartIcon}>{exercise.type_icon || '✨'}</Text>
            <Text style={styles.preStartTitle}>{exercise.title}</Text>
            <Text style={styles.preStartDescription}>{exercise.description}</Text>

            <View style={styles.preStartDetails}>
              <View style={styles.preStartDetail}>
                <Text style={styles.preStartDetailLabel}>Duration</Text>
                <Text style={styles.preStartDetailValue}>{exercise.duration_minutes} min</Text>
              </View>
              <View style={styles.preStartDetail}>
                <Text style={styles.preStartDetailLabel}>Steps</Text>
                <Text style={styles.preStartDetailValue}>{steps.length}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <LinearGradient
                colors={['#526253', '#3D4A3E']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Begin</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={getGradientColors()} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTime}>{formatTime(elapsedTime)}</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.stepContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepPrompt}>{currentStepData.prompt}</Text>

          {currentStepData.duration && (
            <View style={styles.stepTimerContainer}>
              <View style={styles.breathingCircle}>
                <Text style={styles.breathingCircleText}>
                  {currentStepData.duration - stepElapsedTime > 0
                    ? currentStepData.duration - stepElapsedTime
                    : '✓'}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        <View style={styles.controls}>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
              onPress={handlePrevStep}
              disabled={currentStep === 0}
            >
              <Text style={styles.navButtonText}>←</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={isPlaying ? handlePause : handleResume}
            >
              <Text style={styles.playPauseButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextStep}
            >
              <Text style={styles.navButtonText}>{isLastStep ? '✓' : '→'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#2D3A2E',
  },
  headerTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2E',
    fontFamily: theme.typography.h3.fontFamily,
  },
  progressBarContainer: {
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
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3A2E',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: theme.typography.h1.fontFamily,
  },
  stepPrompt: {
    fontSize: 18,
    color: '#526253',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  stepTimerContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  breathingCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(82, 98, 83, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(82, 98, 83, 0.3)',
  },
  breathingCircleText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#526253',
  },
  controls: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 24,
    color: '#2D3A2E',
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#526253',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  playPauseButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  preStartContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  preStartIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  preStartTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3A2E',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: theme.typography.h1.fontFamily,
  },
  preStartDescription: {
    fontSize: 16,
    color: '#6B7268',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  preStartDetails: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 48,
  },
  preStartDetail: {
    alignItems: 'center',
  },
  preStartDetailLabel: {
    fontSize: 14,
    color: '#8B9186',
    marginBottom: 6,
  },
  preStartDetailValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3A2E',
  },
  startButton: {
    width: 200,
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
