import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTTS } from '../hooks/useTTS';
import { VOICE_AGENT_ENABLED } from '../services/ElevenLabsService';
import { theme } from '../theme';

type AuraContext = 'home' | 'community';

interface FloatingAuraAgentProps {
  context?: AuraContext;
  onDismiss?: () => void;
}

const getContextualMessage = (context: AuraContext): string => {
  const hour = new Date().getHours();
  const day = new Date().getDay(); // 0=Sun

  if (context === 'community') {
    return 'You have new activity in your letters and community today. Want to check your inbox first or write something?';
  }

  // Home context — time-aware
  if (hour >= 5 && hour < 12) {
    return "Good morning. Your affirmation today is: 'I am kind to myself.' Want to start with a short meditation or a quick journal check-in?";
  }
  if (day === 0 && hour >= 18) {
    return 'Welcome back. This is a great time to review your week or plan the next one. Want a 2-minute reflection to get started?';
  }
  if (hour >= 18 || hour < 5) {
    return "Welcome back. This is a great time to review your week or plan the next one. Want a 2-minute reflection to get started?";
  }
  return "Great to see you. Would you like to ease back in with a gentle 5-minute session or write a quick note?";
};

export const FloatingAuraAgent: React.FC<FloatingAuraAgentProps> = ({
  context = 'home',
  onDismiss,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [visible, setVisible] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  const message = getContextualMessage(context);
  const { speak, stop, isSpeaking } = useTTS('aura');

  // Auto-speak on first open
  useEffect(() => {
    const timer = setTimeout(() => speak(message), 800);
    return () => clearTimeout(timer);
  }, []);

  // Subtle pulse on the orb
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Expand/collapse bubble
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  }, [expanded]);

  const handleDismiss = () => {
    stop();
    setVisible(false);
    onDismiss?.();
  };

  const handleListen = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(message);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Expanded message bubble */}
      {expanded && (
        <Pressable style={styles.backdrop} onPress={() => setExpanded(false)} />
      )}

      <Animated.View
        style={[
          styles.bubbleContainer,
          {
            opacity: expandAnim,
            transform: [
              {
                scale: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
              {
                translateY: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{message}</Text>
          <TouchableOpacity
            style={styles.dismissBubble}
            onPress={handleDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dismissIcon}>×</Text>
          </TouchableOpacity>
          {VOICE_AGENT_ENABLED && (
            <TouchableOpacity
              style={[styles.listenButton, isSpeaking && styles.listenButtonActive]}
              onPress={handleListen}
              activeOpacity={0.7}
            >
              <Text style={[styles.listenIcon, isSpeaking && styles.listenIconActive]}>
                {isSpeaking ? '■' : '▷'}
              </Text>
              <Text style={[styles.listenLabel, isSpeaking && styles.listenLabelActive]}>
                {isSpeaking ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Tail */}
        <View style={styles.tail} />
      </Animated.View>

      {/* Orb */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#D4B8E8', '#F8C8DC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orb}
          >
            <Text style={styles.orbIcon}>✦</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const ORB_SIZE = 52;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 84, // just above 76px tab bar
    left: 20,
    alignItems: 'flex-start',
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    right: -9999,
    bottom: -9999,
  },
  bubbleContainer: {
    marginBottom: 8,
    maxWidth: 280,
  },
  bubble: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,184,232,0.4)',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.charcoal,
    fontFamily: 'System',
    paddingRight: 20,
  },
  dismissBubble: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
  dismissIcon: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '300',
    lineHeight: 20,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(212,184,232,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212,184,232,0.4)',
    gap: 5,
  },
  listenButtonActive: {
    backgroundColor: 'rgba(212,184,232,0.38)',
    borderColor: 'rgba(155,138,180,0.6)',
  },
  listenIcon: {
    fontSize: 8,
    color: '#9B8AB4',
  },
  listenIconActive: {
    color: '#7B5EA7',
  },
  listenLabel: {
    fontSize: 11,
    color: '#9B8AB4',
    fontWeight: '500',
  },
  listenLabelActive: {
    color: '#7B5EA7',
  },
  tail: {
    width: 12,
    height: 8,
    marginLeft: 20,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.white,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4B8E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  orbIcon: {
    fontSize: 22,
    color: '#3d2060',
  },
});
