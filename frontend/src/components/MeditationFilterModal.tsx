import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { theme } from '../theme';

const { height } = Dimensions.get('window');

export interface MeditationFilters {
  duration?: number[];
  category?: string[];
  mood?: string[];
  difficulty?: string;
}

interface MeditationFilterModalProps {
  visible: boolean;
  currentFilters: MeditationFilters;
  onClose: () => void;
  onApply: (filters: MeditationFilters) => void;
}

const DURATION_OPTIONS = [5, 10, 15, 20];
const CATEGORY_OPTIONS = ['breathwork', 'body-scan', 'loving-kindness', 'sleep', 'anxiety'];
const MOOD_OPTIONS = ['calm', 'energize', 'focus', 'ground', 'restore'];
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];

export const MeditationFilterModal: React.FC<MeditationFilterModalProps> = ({
  visible,
  currentFilters,
  onClose,
  onApply,
}) => {
  const [filters, setFilters] = useState<MeditationFilters>(currentFilters);

  const toggleDuration = (duration: number) => {
    const current = filters.duration || [];
    const updated = current.includes(duration)
      ? current.filter((d) => d !== duration)
      : [...current, duration];
    setFilters({ ...filters, duration: updated.length > 0 ? updated : undefined });
  };

  const toggleCategory = (category: string) => {
    const current = filters.category || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setFilters({ ...filters, category: updated.length > 0 ? updated : undefined });
  };

  const toggleMood = (mood: string) => {
    const current = filters.mood || [];
    const updated = current.includes(mood)
      ? current.filter((m) => m !== mood)
      : [...current, mood];
    setFilters({ ...filters, mood: updated.length > 0 ? updated : undefined });
  };

  const setDifficulty = (difficulty: string) => {
    setFilters({
      ...filters,
      difficulty: filters.difficulty === difficulty ? undefined : difficulty,
    });
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.duration && filters.duration.length > 0) count++;
    if (filters.category && filters.category.length > 0) count++;
    if (filters.mood && filters.mood.length > 0) count++;
    if (filters.difficulty) count++;
    return count;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Filter Meditations</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Duration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.chipContainer}>
                {DURATION_OPTIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.chip,
                      filters.duration?.includes(duration) && styles.chipActive,
                    ]}
                    onPress={() => toggleDuration(duration)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.duration?.includes(duration) && styles.chipTextActive,
                      ]}
                    >
                      {duration} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.chipContainer}>
                {CATEGORY_OPTIONS.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      filters.category?.includes(category) && styles.chipActive,
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.category?.includes(category) && styles.chipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mood */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mood</Text>
              <View style={styles.chipContainer}>
                {MOOD_OPTIONS.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.chip,
                      filters.mood?.includes(mood) && styles.chipActive,
                    ]}
                    onPress={() => toggleMood(mood)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.mood?.includes(mood) && styles.chipTextActive,
                      ]}
                    >
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Difficulty</Text>
              <View style={styles.chipContainer}>
                {DIFFICULTY_OPTIONS.map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.chip,
                      filters.difficulty === difficulty && styles.chipActive,
                    ]}
                    onPress={() => setDifficulty(difficulty)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.difficulty === difficulty && styles.chipTextActive,
                      ]}
                    >
                      {difficulty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                Apply {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.forestGreen,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.charcoal,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundLight,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.forestGreen,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.forestGreen,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
