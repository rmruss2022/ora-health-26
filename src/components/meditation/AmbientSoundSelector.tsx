import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AMBIENT_SOUNDS } from '../../services/AmbientSoundService';
import { theme } from '../../theme';

interface AmbientSoundSelectorProps {
  selectedSound: string | null;
  onSelectSound: (soundId: string | null) => void;
}

export const AmbientSoundSelector: React.FC<AmbientSoundSelectorProps> = ({
  selectedSound,
  onSelectSound,
}) => {
  const handleToggleSound = (soundId: string) => {
    if (selectedSound === soundId) {
      onSelectSound(null);
    } else {
      onSelectSound(soundId);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ambient Sound</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.soundList}
      >
        {AMBIENT_SOUNDS.map((sound) => {
          const isSelected = selectedSound === sound.id;
          return (
            <TouchableOpacity
              key={sound.id}
              style={[
                styles.soundButton,
                isSelected && styles.soundButtonSelected,
              ]}
              onPress={() => handleToggleSound(sound.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.soundIcon}>{sound.icon}</Text>
              <Text style={[
                styles.soundName,
                isSelected && styles.soundNameSelected,
              ]}>
                {sound.displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginLeft: 4,
  },
  soundList: {
    paddingVertical: 4,
    gap: theme.spacing.sm,
  },
  soundButton: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  soundButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLightest,
  },
  soundIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  soundName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  soundNameSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
