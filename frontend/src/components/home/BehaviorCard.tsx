import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BehaviorIcon, BehaviorIconType } from '../icons/BehaviorIcons';

interface BehaviorCardProps {
  icon: string | BehaviorIconType;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  // Optional: use icon type instead of emoji
  iconType?: BehaviorIconType;
}

export const BehaviorCard: React.FC<BehaviorCardProps> = ({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  iconType,
}) => {
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}`}
      accessibilityHint="Double tap to open"
    >
      {iconType ? (
        <BehaviorIcon type={iconType} size={48} backgroundColor={iconBg} />
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    height: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7C7',
    marginLeft: 8,
  },
});
