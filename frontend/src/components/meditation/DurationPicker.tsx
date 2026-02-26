import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { theme } from '../../theme';

interface DurationPickerProps {
  durations: number[];
  selectedDuration: number;
  onSelect: (duration: number) => void;
  disabled?: boolean;
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  durations,
  selectedDuration,
  onSelect,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Duration</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {durations.map((duration) => {
          const isSelected = duration === selectedDuration;
          return (
            <DurationPill
              key={duration}
              duration={duration}
              isSelected={isSelected}
              onPress={() => !disabled && onSelect(duration)}
              disabled={disabled}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

interface DurationPillProps {
  duration: number;
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
}

const DurationPill: React.FC<DurationPillProps> = ({
  duration,
  isSelected,
  onPress,
  disabled,
}) => {
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0.95)).current;
  const opacityAnim = useRef(new Animated.Value(isSelected ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1 : 0.95,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isSelected ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={styles.pillTouchable}
    >
      <Animated.View
        style={[
          styles.pill,
          isSelected && styles.pillSelected,
          disabled && styles.pillDisabled,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
          {duration}
        </Text>
        <Text style={[styles.pillUnit, isSelected && styles.pillUnitSelected]}>min</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xl,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.md,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  pillTouchable: {
    marginRight: theme.spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minWidth: 80,
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillDisabled: {
    opacity: 0.4,
  },
  pillText: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: theme.colors.textLight,
  },
  pillUnit: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  pillUnitSelected: {
    color: theme.colors.textLight,
    opacity: 0.8,
  },
});
