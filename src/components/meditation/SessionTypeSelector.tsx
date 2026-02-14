import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SessionType = 'timed' | 'guided' | 'breathing';

interface SessionOption {
  type: SessionType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

interface SessionTypeSelectorProps {
  selectedType: SessionType;
  onTypeChange: (type: SessionType) => void;
}

const SESSION_OPTIONS: SessionOption[] = [
  {
    type: 'timed',
    label: 'Timed',
    icon: 'timer-outline',
    description: 'Custom meditation timer',
  },
  {
    type: 'guided',
    label: 'Guided',
    icon: 'headset-outline',
    description: 'AI-narrated meditation',
  },
  {
    type: 'breathing',
    label: 'Breathing',
    icon: 'pulse-outline',
    description: 'Guided breathing exercise',
  },
];

export const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const [animation] = useState(new Animated.Value(
    SESSION_OPTIONS.findIndex(opt => opt.type === selectedType)
  ));

  const handlePress = (type: SessionType) => {
    const index = SESSION_OPTIONS.findIndex(opt => opt.type === type);
    
    Animated.spring(animation, {
      toValue: index,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();

    onTypeChange(type);
  };

  const selectedIndex = SESSION_OPTIONS.findIndex(opt => opt.type === selectedType);
  const selectedOption = SESSION_OPTIONS[selectedIndex];

  const indicatorLeft = animation.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.33%', '66.66%'],
  });

  return (
    <View style={styles.container}>
      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <Animated.View
          style={[
            styles.indicator,
            {
              left: indicatorLeft,
            },
          ]}
        />
        {SESSION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={styles.tab}
            onPress={() => handlePress(option.type)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={selectedType === option.type ? '#2C3E2E' : '#999'}
            />
            <Text
              style={[
                styles.tabLabel,
                selectedType === option.type && styles.tabLabelActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>{selectedOption.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  tabLabelActive: {
    color: '#2C3E2E',
  },
  descriptionContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
