import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { ambientSoundService, AMBIENT_SOUNDS } from '../../services/AmbientSoundService';
import { theme } from '../../theme';

interface AmbientSoundSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (soundId: string | null) => void;
}

export const AmbientSoundSelector: React.FC<AmbientSoundSelectorProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const currentId = ambientSoundService.getCurrentSoundId();
    setSelectedSound(currentId);
    setIsPlaying(ambientSoundService.getIsPlaying());
  }, [visible]);

  const handleSoundSelect = async (soundId: string) => {
    if (selectedSound === soundId) {
      // Toggle off
      await ambientSoundService.stop();
      setSelectedSound(null);
      setIsPlaying(false);
      onSelect?.(null);
    } else {
      // Play new sound
      await ambientSoundService.play(soundId);
      setSelectedSound(soundId);
      setIsPlaying(true);
      onSelect?.(soundId);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ambient Sounds</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sound Grid */}
          <ScrollView
            style={styles.soundList}
            contentContainerStyle={styles.soundListContent}
          >
            {AMBIENT_SOUNDS.map((sound) => {
              const isSelected = selectedSound === sound.id;
              return (
                <TouchableOpacity
                  key={sound.id}
                  style={[
                    styles.soundCard,
                    isSelected && styles.soundCardSelected,
                  ]}
                  onPress={() => handleSoundSelect(sound.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.soundIcon}>{sound.icon}</Text>
                  <Text style={[
                    styles.soundName,
                    isSelected && styles.soundNameSelected,
                  ]}>
                    {sound.displayName}
                  </Text>
                  <Text style={styles.soundDescription}>
                    {sound.description}
                  </Text>
                  {isSelected && isPlaying && (
                    <View style={styles.playingIndicator}>
                      <Text style={styles.playingText}>Playing</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Tap a sound to play/stop
            </Text>
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
  container: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '80%',
    ...theme.shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  soundList: {
    flex: 1,
  },
  soundListContent: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  soundCard: {
    width: '47%',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  soundCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.secondaryLight,
  },
  soundIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  soundNameSelected: {
    color: theme.colors.primary,
  },
  soundDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  playingIndicator: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  playingText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default AmbientSoundSelector;
