import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { collectiveSessionService } from '../services/collective-session.service';
import { websocketService } from '../services/websocket.service';

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
  const { sessionId } = route.params;

  // Session state
  const [participantCount, setParticipantCount] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes default
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [shareToCommunity, setShareToCommunity] = useState(false);

  // Breathing animation
  const breatheScale = useSharedValue(1);
  const breatheOpacity = useSharedValue(0.6);

  useEffect(() => {
    // Start breathing animation
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(1, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    breatheOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(0.6, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    // Join session
    joinSession();

    // WebSocket listeners
    websocketService.on('collective:user-joined', handleUserJoined);
    websocketService.on('collective:user-left', handleUserLeft);
    websocketService.on('collective:session-ended', handleSessionEnded);

    return () => {
      websocketService.off('collective:user-joined', handleUserJoined);
      websocketService.off('collective:user-left', handleUserLeft);
      websocketService.off('collective:session-ended', handleSessionEnded);
      leaveSession();
    };
  }, [sessionId]);

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

  const joinSession = async () => {
    try {
      await collectiveSessionService.joinSession(sessionId);
      setSessionActive(true);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const leaveSession = async () => {
    try {
      await collectiveSessionService.leaveSession(sessionId);
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  };

  const handleUserJoined = (data: { participantCount: number }) => {
    setParticipantCount(data.participantCount);
  };

  const handleUserLeft = (data: { participantCount: number }) => {
    setParticipantCount(data.participantCount);
  };

  const handleSessionEnded = () => {
    setShowCheckIn(true);
  };

  const handleCheckInComplete = async (emoji: string) => {
    try {
      await collectiveSessionService.completeSession(sessionId, emoji, shareToCommunity);
      setShowCheckIn(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to complete check-in:', error);
    }
  };

  // Animated breathing circle
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
    opacity: breatheOpacity.value,
  }));

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[theme.colors.cream, theme.colors.lavender + '20', theme.colors.forestGreen + '10']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Participant count */}
      <View style={styles.header}>
        <Text style={styles.participantCount}>
          {participantCount} {participantCount === 1 ? 'person' : 'people'} meditating
        </Text>
      </View>

      {/* Breathing circle */}
      <View style={styles.breathingContainer}>
        <Animated.View style={[styles.breatheCircleOuter, breatheStyle]}>
          <LinearGradient
            colors={[theme.colors.forestGreen, theme.colors.lavender]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.breatheCircle}
          />
        </Animated.View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.timerLabel}>breathe</Text>
        </View>
      </View>

      {/* Breathing guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideText}>
          {breatheScale.value > 1.1 ? 'breathe in' : 'breathe out'}
        </Text>
      </View>

      {/* Exit button */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.exitText}>Leave quietly</Text>
      </TouchableOpacity>

      {/* Post-session check-in modal */}
      <Modal
        visible={showCheckIn}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckIn(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How do you feel?</Text>

            <View style={styles.emojiGrid}>
              {[
                { emoji: '🌊', label: 'calm' },
                { emoji: '✨', label: 'clear' },
                { emoji: '🙏', label: 'grateful' },
                { emoji: '🌅', label: 'renewed' },
                { emoji: '💚', label: 'grounded' },
                { emoji: '🌿', label: 'peaceful' },
              ].map(({ emoji, label }) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => handleCheckInComplete(emoji)}
                >
                  <Text style={styles.emojiIcon}>{emoji}</Text>
                  <Text style={styles.emojiLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.shareToggle}>
              <Text style={styles.shareToggleText}>Share to Community</Text>
              <Switch
                value={shareToCommunity}
                onValueChange={setShareToCommunity}
                trackColor={{
                  false: theme.colors.forestGreen + '30',
                  true: theme.colors.lavender,
                }}
                thumbColor={theme.colors.cream}
              />
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => handleCheckInComplete('')}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  participantCount: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.8,
  },
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breatheCircleOuter: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breatheCircle: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.3,
  },
  timerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontFamily: theme.fonts.medium,
    color: theme.colors.cream,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.cream,
    marginTop: 8,
    opacity: 0.9,
  },
  guideContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    fontSize: 18,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.7,
  },
  exitButton: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  exitText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.cream,
    borderRadius: 24,
    padding: 32,
    width: width * 0.85,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.medium,
    color: theme.colors.forestGreen,
    textAlign: 'center',
    marginBottom: 32,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: theme.colors.lavender + '20',
    borderRadius: 16,
  },
  emojiIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.8,
  },
  shareToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.lavender + '20',
    borderRadius: 16,
    marginTop: 16,
  },
  shareToggleText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.6,
  },
});
