import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

interface CollectiveSessionScreenProps {
  route: {
    params: {
      sessionId: string;
    };
  };
}

export const CollectiveSessionScreen: React.FC<CollectiveSessionScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { sessionId } = route?.params || { sessionId: 'demo' };

  // Session state
  const [participantCount, setParticipantCount] = useState(1);
  const [sessionActive, setSessionActive] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  // Simple breathing animation (web-compatible)
  const breathScale = new Animated.Value(1);

  useEffect(() => {
    // Start simple breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(breathScale, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!sessionActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowCheckIn(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleComplete = () => {
    console.log('Session complete:', { emoji: selectedEmoji, shareToCommunity });
    setShowCheckIn(false);
    navigation.goBack();
  };

  const emojis = ['😌', '🙏', '✨', '🌟', '💫'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.forestGreen, theme.colors.lavender]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.participantCount}>
            {participantCount} {participantCount === 1 ? 'person' : 'people'} meditating
          </Text>
        </View>

        {/* Breathing Circle */}
        <View style={styles.breathingContainer}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: breathScale }],
              },
            ]}
          >
            <View style={styles.breathingInner}>
              <Text style={styles.breathingText}>Breathe</Text>
            </View>
          </Animated.View>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.timerLabel}>remaining</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Follow the rhythm of the circle
          </Text>
          <Text style={styles.instructionsSubtext}>
            Inhale as it expands • Exhale as it contracts
          </Text>
        </View>
      </LinearGradient>

      {/* Check-in Modal */}
      <Modal
        visible={showCheckIn}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckIn(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>How do you feel?</Text>
              <Text style={styles.modalSubtitle}>
                Select an emoji to check in
              </Text>

              <View style={styles.emojiGrid}>
                {emojis.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === emoji && styles.emojiButtonSelected,
                    ]}
                    onPress={() => handleEmojiSelect(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.shareContainer}>
                <View style={styles.shareTextContainer}>
                  <Text style={styles.shareTitle}>Share to Community</Text>
                  <Text style={styles.shareSubtitle}>
                    Post your meditation to the community feed
                  </Text>
                </View>
                <Switch
                  value={shareToCommunity}
                  onValueChange={setShareToCommunity}
                  trackColor={{
                    false: '#D1D5DB',
                    true: theme.colors.forestGreen,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.completeButton,
                  !selectedEmoji && styles.completeButtonDisabled,
                ]}
                onPress={handleComplete}
                disabled={!selectedEmoji}
              >
                <Text style={styles.completeButtonText}>Complete Session</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  setShowCheckIn(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  participantCount: {
    color: theme.colors.white,
    fontSize: 14,
    opacity: 0.9,
  },
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingInner: {
    width: '80%',
    height: '80%',
    borderRadius: (width * 0.6 * 0.8) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    color: theme.colors.white,
    fontSize: 48,
    fontWeight: 'bold',
  },
  timerLabel: {
    color: theme.colors.white,
    fontSize: 16,
    opacity: 0.8,
    marginTop: 4,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  instructionsText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionsSubtext: {
    color: theme.colors.white,
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emojiButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  emojiButtonSelected: {
    backgroundColor: theme.colors.forestGreen,
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 32,
  },
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  shareTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  shareSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  completeButton: {
    backgroundColor: theme.colors.forestGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
});
