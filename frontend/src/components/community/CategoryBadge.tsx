/**
 * CategoryBadge Component
 * Visual badges for post categories with consistent design
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CategoryType = 'reflection' | 'growth' | 'wellness' | 'gratitude' | 'support' | 'question';

export interface CategoryConfig {
  id: CategoryType;
  name: string;
  color: string;
  backgroundColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  reflection: {
    id: 'reflection',
    name: 'Reflection',
    color: '#7C3AED',
    backgroundColor: '#F3E8FF',
    icon: 'bulb-outline',
    description: 'Thoughts and introspection',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    icon: 'trending-up-outline',
    description: 'Personal development and learning',
  },
  wellness: {
    id: 'wellness',
    name: 'Wellness',
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
    icon: 'heart-outline',
    description: 'Health and wellbeing',
  },
  gratitude: {
    id: 'gratitude',
    name: 'Gratitude',
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    icon: 'flower-outline',
    description: 'Appreciation and thankfulness',
  },
  support: {
    id: 'support',
    name: 'Support',
    color: '#DB2777',
    backgroundColor: '#FCE7F3',
    icon: 'hand-left-outline',
    description: 'Seeking or offering support',
  },
  question: {
    id: 'question',
    name: 'Question',
    color: '#EA580C',
    backgroundColor: '#FED7AA',
    icon: 'help-circle-outline',
    description: 'Questions and curiosity',
  },
};

interface CategoryBadgeProps {
  category: CategoryType | string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'medium',
  showIcon = false,
}) => {
  const config = CATEGORIES[category as CategoryType] || CATEGORIES.question;

  const sizeStyles = {
    small: {
      container: styles.badgeSmall,
      text: styles.textSmall,
      icon: 12,
    },
    medium: {
      container: styles.badgeMedium,
      text: styles.textMedium,
      icon: 14,
    },
    large: {
      container: styles.badgeLarge,
      text: styles.textLarge,
      icon: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        currentSize.container,
        { backgroundColor: config.backgroundColor },
      ]}
      accessibilityLabel={`Category: ${config.name}`}
      accessibilityRole="text"
    >
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={currentSize.icon}
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text style={[currentSize.text, { color: config.color }]}>
        {config.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 4,
  },
  textSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  textMedium: {
    fontSize: 12,
    fontWeight: '600',
  },
  textLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
});

/**
 * Get category configuration by ID
 */
export const getCategoryConfig = (categoryId: string): CategoryConfig => {
  return CATEGORIES[categoryId as CategoryType] || CATEGORIES.question;
};

/**
 * Get all categories as an array
 */
export const getAllCategories = (): CategoryConfig[] => {
  return Object.values(CATEGORIES);
};
