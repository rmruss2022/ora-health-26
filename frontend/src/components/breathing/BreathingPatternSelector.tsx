import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

export type BreathingPattern = 'box' | '4-7-8' | 'simple';

interface BreathingPatternSelectorProps {
  selected: BreathingPattern;
  onSelect: (pattern: BreathingPattern) => void;
}

interface PatternInfo {
  id: BreathingPattern;
  name: string;
  description: string;
  icon: string;
  timing: string;
  bestFor: string;
}

const patterns: PatternInfo[] = [
  {
    id: 'simple',
    name: 'Simple Breathing',
    description: 'Gentle, calming breath',
    icon: '🌊',
    timing: '4 in, 6 out',
    bestFor: 'Stress relief, beginners',
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal parts, balanced',
    icon: '⬜',
    timing: '4-4-4-4',
    bestFor: 'Focus, anxiety, Navy SEAL technique',
  },
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    description: 'Sleep-inducing technique',
    icon: '😴',
    timing: '4 in, 7 hold, 8 out',
    bestFor: 'Sleep, deep relaxation',
  },
];

/**
 * BreathingPatternSelector - Choose breathing exercise pattern
 * 
 * Usage:
 * ```tsx
 * const [pattern, setPattern] = useState<BreathingPattern>('simple');
 * 
 * <BreathingPatternSelector 
 *   selected={pattern}
 *   onSelect={setPattern}
 * />
 * ```
 */
export const BreathingPatternSelector: React.FC<BreathingPatternSelectorProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Pattern</Text>
      
      {patterns.map((pattern) => {
        const isSelected = pattern.id === selected;
        
        return (
          <TouchableOpacity
            key={pattern.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(pattern.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.icon}>{pattern.icon}</Text>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.patternName, isSelected && styles.textSelected]}>
                  {pattern.name}
                </Text>
                <Text style={[styles.timing, isSelected && styles.textSelected]}>
                  {pattern.timing}
                </Text>
              </View>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.description, isSelected && styles.textSelected]}>
              {pattern.description}
            </Text>
            
            <View style={styles.bestForContainer}>
              <Text style={[styles.bestForLabel, isSelected && styles.textSelected]}>
                Best for:
              </Text>
              <Text style={[styles.bestForText, isSelected && styles.textSelected]}>
                {pattern.bestFor}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  icon: {
    fontSize: 36,
    marginRight: theme.spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  patternName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  timing: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  bestForContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  bestForLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  bestForText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  textSelected: {
    color: theme.colors.primary,
  },
});

export default BreathingPatternSelector;
