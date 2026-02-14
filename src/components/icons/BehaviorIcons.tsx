/**
 * Behavior Card Icon Set
 * Custom icons for each behavior type matching design system
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export type BehaviorIconType = 
  | 'chat'
  | 'journal'
  | 'exercise'
  | 'progress'
  | 'planning'
  | 'meditation'
  | 'community';

interface BehaviorIconProps {
  type: BehaviorIconType;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const BehaviorIcon: React.FC<BehaviorIconProps> = ({
  type,
  size = 40,
  color = '#FFFFFF',
  backgroundColor = '#E8EAF0',
}) => {
  const iconSize = size * 0.5; // Icon is 50% of container size
  
  const renderIcon = () => {
    switch (type) {
      case 'chat':
        return <Ionicons name="chatbubble" size={iconSize} color={color} />;
      
      case 'journal':
        return <Ionicons name="book" size={iconSize} color={color} />;
      
      case 'exercise':
        return <MaterialCommunityIcons name="yoga" size={iconSize} color={color} />;
      
      case 'progress':
        return <Ionicons name="bar-chart" size={iconSize} color={color} />;
      
      case 'planning':
        return <Ionicons name="calendar" size={iconSize} color={color} />;
      
      case 'meditation':
        return <MaterialCommunityIcons name="meditation" size={iconSize} color={color} />;
      
      case 'community':
        return <Ionicons name="people" size={iconSize} color={color} />;
      
      default:
        return <Ionicons name="help-circle" size={iconSize} color={color} />;
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor,
        }
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Icon configuration for each behavior type
 */
export const BehaviorIconConfig: Record<BehaviorIconType, {
  backgroundColor: string;
  iconColor: string;
  description: string;
}> = {
  chat: {
    backgroundColor: '#4A90E2',
    iconColor: '#FFFFFF',
    description: 'Speech bubble icon for free-form conversation',
  },
  journal: {
    backgroundColor: '#6B7A5D',
    iconColor: '#FFFFFF',
    description: 'Book icon for journaling and prompts',
  },
  exercise: {
    backgroundColor: '#9B59B6',
    iconColor: '#FFFFFF',
    description: 'Yoga figure icon for guided exercises',
  },
  progress: {
    backgroundColor: '#E67E22',
    iconColor: '#FFFFFF',
    description: 'Bar chart icon for progress analysis',
  },
  planning: {
    backgroundColor: '#3498DB',
    iconColor: '#FFFFFF',
    description: 'Calendar icon for weekly planning',
  },
  meditation: {
    backgroundColor: '#8E44AD',
    iconColor: '#FFFFFF',
    description: 'Meditation figure icon',
  },
  community: {
    backgroundColor: '#16A085',
    iconColor: '#FFFFFF',
    description: 'People icon for community features',
  },
};

/**
 * Get icon configuration for a behavior type
 */
export const getIconConfig = (type: BehaviorIconType) => {
  return BehaviorIconConfig[type] || {
    backgroundColor: '#95A5A6',
    iconColor: '#FFFFFF',
    description: 'Default icon',
  };
};
