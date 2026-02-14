import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BreathingExercise } from '../components/breathing/BreathingExercise';
import { BreathingPatternSelector, BreathingPattern } from '../components/breathing/BreathingPatternSelector';
import { theme } from '../theme';

/**
 * BreathingScreen - Full breathing exercise screen with pattern selection
 * 
 * Flow:
 * 1. Select pattern (simple, box, 4-7-8)
 * 2. Choose rounds (3, 5, 10)
 * 3. Start exercise with animated guidance
 * 4. Complete and return to selection
 */
export const BreathingScreen: React.FC = () => {
  const [pattern, setPattern] = useState<BreathingPattern>('simple');
  const [rounds, setRounds] = useState(5);
  const [showExercise, setShowExercise] = useState(false);

  const handleComplete = () => {
    setShowExercise(false);
  };

  const handleStart = () => {
    setShowExercise(true);
  };

  if (showExercise) {
    return (
      <BreathingExercise
        pattern={pattern}
        rounds={rounds}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🌬️</Text>
          <Text style={styles.title}>Breathing Exercise</Text>
          <Text style={styles.subtitle}>
            Reduce stress and anxiety with guided breathing
          </Text>
        </View>

        {/* Pattern selector */}
        <BreathingPatternSelector
          selected={pattern}
          onSelect={setPattern}
        />

        {/* Rounds selector */}
        <View style={styles.roundsContainer}>
          <Text style={styles.sectionTitle}>Number of Rounds</Text>
          <View style={styles.roundsButtons}>
            {[3, 5, 10].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.roundButton,
                  rounds === count && styles.roundButtonSelected,
                ]}
                onPress={() => setRounds(count)}
              >
                <Text
                  style={[
                    styles.roundButtonText,
                    rounds === count && styles.roundButtonTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.durationHint}>
            {getDurationText(pattern, rounds)}
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for Success</Text>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Find a quiet, comfortable place</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Sit or lie down with your spine straight</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Breathe through your nose when possible</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Let your belly expand as you inhale</Text>
          </View>
        </View>
      </ScrollView>

      {/* Start button (fixed at bottom) */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Start Exercise</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function getDurationText(pattern: BreathingPattern, rounds: number): string {
  const durations = {
    simple: 10,  // 4+6 = 10 seconds per round
    box: 16,     // 4+4+4+4 = 16 seconds per round
    '4-7-8': 19, // 4+7+8 = 19 seconds per round
  };

  const totalSeconds = durations[pattern] * rounds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `~${seconds} seconds`;
  } else if (seconds === 0) {
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `~${minutes}m ${seconds}s`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  roundsContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  roundsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  roundButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  roundButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  roundButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  roundButtonTextSelected: {
    color: theme.colors.white,
  },
  durationHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  tipsContainer: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  tipBullet: {
    fontSize: 16,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
    lineHeight: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
  },
});

export default BreathingScreen;
