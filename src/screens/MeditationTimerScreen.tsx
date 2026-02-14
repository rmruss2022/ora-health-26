import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { CircularTimer } from '../components/meditation/CircularTimer';
import { DurationPicker } from '../components/meditation/DurationPicker';
import { meditationApi } from '../services/meditation';

const DURATIONS = [5, 10, 15, 20, 30];

interface MeditationTimerScreenProps {
  navigation?: any;
  route?: any;
}

type TimerState = 'idle' | 'running' | 'paused' | 'complete';

export const MeditationTimerScreen: React.FC<MeditationTimerScreenProps> = ({
  navigation,
  route,
}) => {
  const meditation = route?.params?.meditation;
  const [duration, setDuration] = useState(meditation?.duration || 10);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [state, setState] = useState<TimerState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const completeAnim = useRef(new Animated.Value(0)).current;

  // Calculate progress
  const totalSeconds = duration * 60;
  const progress = 1 - timeRemaining / totalSeconds;

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Ambient background gradient animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Timer logic
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  // Reset timer when duration changes
  useEffect(() => {
    if (state === 'idle') {
      setTimeRemaining(duration * 60);
    }
  }, [duration]);

  const startSession = async () => {
    try {
      if (meditation?.id) {
        const session = await meditationApi.startSession(meditation.id);
        setSessionId(session.id);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const completeSession = async () => {
    try {
      if (sessionId) {
        const durationCompleted = Math.floor((totalSeconds - timeRemaining) / 60);
        await meditationApi.completeSession(sessionId, durationCompleted);
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButton();
    setState('running');
    if (state === 'idle') {
      await startSession();
    }
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateButton();
    setState('paused');
  };

  const handleStop = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setState('idle');
    setTimeRemaining(duration * 60);
    await completeSession();
    setSessionId(null);
  };

  const handleComplete = async () => {
    setState('complete');
    await completeSession();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Celebration animation
    Animated.sequence([
      Animated.timing(completeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('idle');
    setTimeRemaining(duration * 60);
    setSessionId(null);
    completeAnim.setValue(0);
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Gradient colors that shift during session
  const gradientColor1 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primaryLightest, theme.colors.secondaryLightest],
  });

  const gradientColor2 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.backgroundLight, theme.colors.accentLightest],
  });

  const isTimerActive = state === 'running' || state === 'paused';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Animated.View style={styles.gradientContainer}>
        <LinearGradient
          colors={[gradientColor1 as any, gradientColor2 as any]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {meditation?.title || 'Meditation'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Main timer area */}
        <View style={styles.timerContainer}>
          {state === 'complete' ? (
            <Animated.View
              style={[
                styles.completeContainer,
                {
                  opacity: completeAnim,
                  transform: [
                    {
                      scale: completeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.completeEmoji}>✨</Text>
              <Text style={styles.completeTitle}>Well Done!</Text>
              <Text style={styles.completeMessage}>
                You completed {duration} minutes of meditation
              </Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{duration}</Text>
                  <Text style={styles.statLabel}>minutes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.statLabel}>today</Text>
                </View>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.circularTimerWrapper}>
              <CircularTimer
                progress={progress}
                isComplete={state === 'complete'}
              />
              <View style={styles.timerTextContainer}>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                {state === 'running' && (
                  <Text style={styles.timerSubtext}>Breathe deeply</Text>
                )}
                {state === 'paused' && (
                  <Text style={styles.timerSubtext}>Paused</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Duration picker (only show when idle) */}
        {state === 'idle' && (
          <DurationPicker
            durations={DURATIONS}
            selectedDuration={duration}
            onSelect={setDuration}
            disabled={isTimerActive}
          />
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {state === 'complete' ? (
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.primaryButton, styles.resetButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Start New Session</Text>
            </TouchableOpacity>
          ) : (
            <>
              {(state === 'idle' || state === 'paused') && (
                <Animated.View
                  style={[
                    styles.buttonWrapper,
                    { transform: [{ scale: buttonScaleAnim }] },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleStart}
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonIcon}>▶</Text>
                    <Text style={styles.primaryButtonText}>
                      {state === 'idle' ? 'Begin' : 'Resume'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {state === 'running' && (
                <Animated.View
                  style={[
                    styles.buttonWrapper,
                    { transform: [{ scale: buttonScaleAnim }] },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handlePause}
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonIcon}>⏸</Text>
                    <Text style={styles.primaryButtonText}>Pause</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {isTimerActive && (
                <TouchableOpacity
                  onPress={handleStop}
                  style={styles.secondaryButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>End Early</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  circularTimerWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
  },
  timerSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  completeContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  completeEmoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  completeTitle: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  completeMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
  controls: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  buttonWrapper: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadows.lg,
    gap: theme.spacing.sm,
  },
  primaryButtonIcon: {
    fontSize: 20,
    color: theme.colors.textLight,
  },
  primaryButtonText: {
    ...theme.typography.h4,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: theme.colors.charcoal,
  },
});
