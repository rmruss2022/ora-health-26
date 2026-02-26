import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { VoiceState } from '../../hooks/useVoiceConversation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceConversationModalProps {
  visible: boolean;
  voiceState: VoiceState;
  messages: Message[];
  onOrbPress: () => void;
  onExit: () => void;
}

const ORB_SIZE = 120;
const { width: SCREEN_W } = Dimensions.get('window');

// State-specific orb gradient colors
const ORB_COLORS: Record<VoiceState, [string, string]> = {
  idle:         ['#D4B8E8', '#F8C8DC'],
  listening:    ['#B8A8F8', '#D4B8E8'],
  transcribing: ['#C8C8DC', '#E8E0F0'],
  thinking:     ['#F0C890', '#F8C8DC'],
  speaking:     ['#D4B8E8', '#B8A0E0'],
};

const STATE_LABEL: Record<VoiceState, string> = {
  idle:         '',
  listening:    'Listening…',
  transcribing: 'Transcribing…',
  thinking:     'Thinking…',
  speaking:     'Speaking…',
};

const STATE_HINT: Record<VoiceState, string> = {
  idle:         '',
  listening:    'Tap orb to send',
  transcribing: '',
  thinking:     '',
  speaking:     'Tap orb to interrupt',
};

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  visible,
  voiceState,
  messages,
  onOrbPress,
  onExit,
}) => {
  const insets = useSafeAreaInsets();

  // ─── Animations ─────────────────────────────────────────────────────────────

  // Ripple rings (listening)
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const ripplesRef = useRef<Animated.CompositeAnimation | null>(null);

  // Orb pulse (speaking)
  const orbPulse = useRef(new Animated.Value(1)).current;
  const speakLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Thinking spin
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Fade-in for modal entry
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const stopAllAnims = () => {
    ripplesRef.current?.stop();
    speakLoopRef.current?.stop();
    spinLoopRef.current?.stop();
    ring1.setValue(0);
    ring2.setValue(0);
    ring3.setValue(0);
    orbPulse.setValue(1);
    spinAnim.setValue(0);
  };

  useEffect(() => {
    stopAllAnims();

    if (voiceState === 'listening') {
      const makeRipple = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
            ]),
            Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        );
      ripplesRef.current = Animated.parallel([
        makeRipple(ring1, 0),
        makeRipple(ring2, 600),
        makeRipple(ring3, 1200),
      ]);
      ripplesRef.current.start();
    }

    if (voiceState === 'speaking') {
      speakLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(orbPulse, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(orbPulse, { toValue: 0.96, duration: 500, useNativeDriver: true }),
        ])
      );
      speakLoopRef.current.start();
    }

    if (voiceState === 'thinking') {
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
      );
      spinLoopRef.current.start();
    }

    return stopAllAnims;
  }, [voiceState]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const makeRingStyle = (anim: Animated.Value, baseSize: number) => ({
    position: 'absolute' as const,
    width: baseSize,
    height: baseSize,
    borderRadius: baseSize / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(180,155,220,0.55)',
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
  });

  // Show last 4 messages as transcript
  const transcript = messages.slice(-4);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onExit}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Container blocks accidental background touches; exit via × only */}
        <Pressable style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerLabel}>Voice</Text>
            <TouchableOpacity onPress={onExit} style={styles.exitButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.exitIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Transcript rail */}
          <View style={styles.transcriptContainer}>
            <ScrollView
              style={styles.transcriptScroll}
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
            >
              {transcript.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.transcriptBubble,
                    msg.role === 'user' ? styles.transcriptUser : styles.transcriptAssistant,
                  ]}
                >
                  <Text
                    style={[
                      styles.transcriptText,
                      msg.role === 'user' ? styles.transcriptUserText : styles.transcriptAssistantText,
                    ]}
                    numberOfLines={3}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Orb + ripples */}
          <View style={styles.orbWrapper}>
            {/* Ripple rings */}
            <Animated.View style={makeRingStyle(ring1, ORB_SIZE + 30)} />
            <Animated.View style={makeRingStyle(ring2, ORB_SIZE + 60)} />
            <Animated.View style={makeRingStyle(ring3, ORB_SIZE + 90)} />

            {/* Orb itself */}
            <Pressable onPress={onOrbPress}>
              <Animated.View style={{ transform: [{ scale: orbPulse }, { rotate: voiceState === 'thinking' ? spinDeg : '0deg' }] }}>
                <LinearGradient
                  colors={ORB_COLORS[voiceState]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.orb}
                >
                  <Text style={styles.orbIcon}>✦</Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </View>

          {/* State label + hint */}
          <View style={styles.labelContainer}>
            <Text style={styles.stateLabel}>{STATE_LABEL[voiceState]}</Text>
            {STATE_HINT[voiceState] ? (
              <Text style={styles.stateHint}>{STATE_HINT[voiceState]}</Text>
            ) : null}
          </View>

        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 12, 30, 0.88)',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(212,184,232,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  exitButton: {
    position: 'absolute',
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 26,
    fontWeight: '300',
  },
  transcriptContainer: {
    width: '100%',
    maxHeight: 200,
  },
  transcriptScroll: {
    flexGrow: 0,
  },
  transcriptContent: {
    gap: 8,
    paddingVertical: 4,
  },
  transcriptBubble: {
    maxWidth: SCREEN_W * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  transcriptUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(100,80,160,0.45)',
  },
  transcriptAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,184,232,0.2)',
  },
  transcriptText: {
    fontSize: 13,
    lineHeight: 19,
  },
  transcriptUserText: {
    color: 'rgba(255,255,255,0.9)',
  },
  transcriptAssistantText: {
    color: 'rgba(240,232,255,0.85)',
  },
  orbWrapper: {
    width: ORB_SIZE + 120,
    height: ORB_SIZE + 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C4A0E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  orbIcon: {
    fontSize: 40,
    color: 'rgba(45,18,90,0.85)',
  },
  labelContainer: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    gap: 6,
  },
  stateLabel: {
    fontSize: 17,
    color: 'rgba(240,232,255,0.9)',
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  stateHint: {
    fontSize: 12,
    color: 'rgba(212,184,232,0.5)',
    letterSpacing: 0.2,
  },
});
