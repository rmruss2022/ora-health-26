import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

interface BreathingExerciseProps {
  pattern?: 'box' | '4-7-8' | 'simple';
  onComplete?: () => void;
  rounds?: number;
}

/**
 * BreathingExercise - Animated breathing guide component
 * 
 * Patterns:
 * - box: 4-4-4-4 (inhale-hold-exhale-hold)
 * - 4-7-8: 4-7-8 (inhale-hold-exhale) for sleep
 * - simple: 4-6 (inhale-exhale) for stress relief
 * 
 * Usage:
 * ```tsx
 * <BreathingExercise 
 *   pattern="box" 
 *   rounds={5}
 *   onComplete={() => console.log('Done!')}
 * />
 * ```
 */
export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  pattern = 'simple',
  onComplete,
  rounds = 5,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [countdown, setCountdown] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  // Pattern configurations (all in seconds)
  const patterns = {
    box: { inhale: 4, hold: 4, exhale: 4, pause: 4 },
    '4-7-8': { inhale: 4, hold: 7, exhale: 8, pause: 0 },
    simple: { inhale: 4, hold: 0, exhale: 6, pause: 0 },
  };

  const currentPattern = patterns[pattern];

  useEffect(() => {
    if (!isActive) return;

    const phaseSequence: Array<keyof typeof currentPattern> = ['inhale', 'hold', 'exhale', 'pause'].filter(
      (p) => currentPattern[p as keyof typeof currentPattern] > 0
    ) as Array<keyof typeof currentPattern>;

    let phaseIndex = 0;
    let currentPhase = phaseSequence[phaseIndex];
    let secondsLeft = currentPattern[currentPhase];

    setPhase(currentPhase);
    setCountdown(secondsLeft);

    // Animate based on phase
    animatePhase(currentPhase, currentPattern[currentPhase]);

    const interval = setInterval(() => {
      secondsLeft--;
      setCountdown(secondsLeft);

      if (secondsLeft <= 0) {
        phaseIndex++;

        if (phaseIndex >= phaseSequence.length) {
          // Round complete
          const nextRound = currentRound + 1;
          setCurrentRound(nextRound);

          if (nextRound >= rounds) {
            // Exercise complete
            setIsActive(false);
            onComplete?.();
            return;
          }

          phaseIndex = 0;
        }

        currentPhase = phaseSequence[phaseIndex];
        secondsLeft = currentPattern[currentPhase];
        setPhase(currentPhase);
        setCountdown(secondsLeft);
        animatePhase(currentPhase, currentPattern[currentPhase]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentRound, rounds]);

  const animatePhase = (phaseName: string, duration: number) => {
    const durationMs = duration * 1000;

    switch (phaseName) {
      case 'inhale':
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: durationMs,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: durationMs,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'hold':
        // Stay at current size
        break;

      case 'exhale':
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.5,
            duration: durationMs,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: durationMs,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'pause':
        // Stay at current size
        break;
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setCurrentRound(0);
  };

  const handleStop = () => {
    setIsActive(false);
    setCurrentRound(0);
    scaleAnim.setValue(0.5);
    opacityAnim.setValue(0.3);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'pause':
        return 'Pause';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return theme.colors.primary;
      case 'hold':
        return theme.colors.secondary;
      case 'exhale':
        return theme.colors.accent;
      case 'pause':
        return theme.colors.mediumGrey;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Round {currentRound + 1} of {rounds}
        </Text>
      </View>

      {/* Animated circle */}
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: getPhaseColor(),
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.circleContent}>
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
            {isActive && <Text style={styles.countdownText}>{countdown}</Text>}
          </View>
        </Animated.View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        {!isActive ? (
          <Text style={styles.instructions}>
            {pattern === 'box' && 'Box breathing: 4 seconds each phase'}
            {pattern === '4-7-8' && '4-7-8 breathing: Great for sleep'}
            {pattern === 'simple' && 'Simple breathing: 4 in, 6 out'}
          </Text>
        ) : (
          <Text style={styles.instructions}>
            Follow the circle. {getPhaseText().toLowerCase()} as it {phase === 'inhale' ? 'expands' : phase === 'exhale' ? 'contracts' : 'holds'}.
          </Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isActive ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundLight,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  circleContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  circleContent: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  countdownText: {
    fontSize: 64,
    fontWeight: '700',
    color: theme.colors.white,
  },
  instructionsContainer: {
    marginTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  instructions: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  controls: {
    marginTop: theme.spacing.xxl,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
  },
  stopButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
  },
});

export default BreathingExercise;
