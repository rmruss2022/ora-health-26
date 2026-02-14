/**
 * Theme Toggle Component
 * Allows users to manually toggle between light/dark/auto modes
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { colorScheme, setColorScheme, theme } = useTheme();

  const options: Array<{ value: 'light' | 'dark' | 'auto'; icon: string; label: string }> = [
    { value: 'light', icon: 'sunny', label: 'Light' },
    { value: 'dark', icon: 'moon', label: 'Dark' },
    { value: 'auto', icon: 'contrast', label: 'Auto' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        Theme
      </Text>
      <View style={styles.optionsContainer}>
        {options.map(option => {
          const isSelected = colorScheme === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { borderColor: theme.colors.border },
                isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => setColorScheme(option.value)}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={isSelected ? theme.colors.textLight : theme.colors.text}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? theme.colors.textLight : theme.colors.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
