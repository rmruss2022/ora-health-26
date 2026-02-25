/**
 * CategoryFilter Component
 * Horizontal scrollable filter for post categories
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, CategoryType, getAllCategories } from './CategoryBadge';

interface CategoryFilterProps {
  selectedCategory: CategoryType | 'all' | null;
  onSelectCategory: (category: CategoryType | 'all') => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = getAllCategories();

  const isSelected = (id: CategoryType | 'all') => {
    return selectedCategory === id || (selectedCategory === null && id === 'all');
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {/* All Filter */}
      <TouchableOpacity
        style={[
          styles.filterChip,
          isSelected('all') && styles.filterChipActive,
          {
            borderColor: isSelected('all') ? 'rgba(212,184,232,0.6)' : 'rgba(163,163,163,0.45)',
            backgroundColor: isSelected('all') ? 'rgba(212,184,232,0.12)' : 'transparent',
          },
        ]}
        onPress={() => onSelectCategory('all')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Show all categories"
        accessibilityState={{ selected: isSelected('all') }}
      >
        <Ionicons
          name="apps-outline"
          size={16}
          color={isSelected('all') ? '#1d473e' : '#6B7280'}
        />
        <Text
          style={[
            styles.filterText,
            isSelected('all') && styles.filterTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {/* Category Filters */}
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.filterChip,
            isSelected(category.id) && styles.filterChipActive,
            {
              borderColor: isSelected(category.id)
                ? 'rgba(212,184,232,0.6)'
                : 'rgba(163,163,163,0.45)',
              backgroundColor: isSelected(category.id)
                ? 'rgba(212,184,232,0.12)'
                : 'transparent',
            },
          ]}
          onPress={() => onSelectCategory(category.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Filter by ${category.name}`}
          accessibilityState={{ selected: isSelected(category.id) }}
        >
          <Ionicons
            name={category.icon}
            size={16}
            color={isSelected(category.id) ? category.color : '#6B7280'}
          />
          <Text
            style={[
              styles.filterText,
              isSelected(category.id) && {
                color: category.color,
                fontWeight: '600',
              },
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
});
