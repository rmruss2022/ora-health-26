import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTTS } from '../hooks/useTTS';
import { useAgentContext } from '../hooks/useAgentContext';
import { VOICE_AGENT_ENABLED } from '../services/ElevenLabsService';
import { backgroundMusicService } from '../services/BackgroundMusicService';
import { MeditationSoundControl } from './MeditationSoundControl';

const GRADIENT = ['#D4B8E8', '#F8C8DC'] as const;
const OraLogomarkGreen = require('../../assets/images/Ora-Logomark-Green.png');

interface AuraIntroOverlayProps {
  visible: boolean;
  canDismiss: boolean;
  onDismiss: () => void;
}

export const AuraIntroOverlay: React.FC<AuraIntroOverlayProps> = ({
  visible,
  canDismiss,
  onDismiss,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0.6)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Always-current refs so stale closures (cap timer) get live values
  const canDismissRef = useRef(canDismiss);
  useEffect(() => { canDismissRef.current = canDismiss; }, [canDismiss]);
  const isSpeakingRef = useRef(false);

  const isDismissingRef = useRef(false);
  const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const { message, loading: messageLoading } = useAgentContext('home');
  const { speak, stop, isSpeaking } = useTTS('aura');

  // Fade in + start loops on show
  useEffect(() => {
    if (!visible) return;
    isDismissingRef.current = false;
    setDisplayedText('');
    setTypewriterDone(false);

    Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.timing(contentOpacity, { toValue: 1, duration: 300, delay: 350, useNativeDriver: true }).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 8,  duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoopRef.current = floatLoop;
    floatLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
      ])
    );
    glowLoopRef.current = glowLoop;
    glowLoop.start();

    return () => {
      floatLoopRef.current?.stop();
      glowLoopRef.current?.stop();
    };
  }, [visible]);

  // Typewriter
  useEffect(() => {
    if (!visible || !message) return;
    let i = 0;
    setDisplayedText('');
    setTypewriterDone(false);
    const iv = setInterval(() => {
      setDisplayedText(message.slice(0, ++i));
      if (i >= message.length) { clearInterval(iv); setTypewriterDone(true); }
    }, 32);
    return () => clearInterval(iv);
  }, [visible, message]);

  // TTS
  useEffect(() => {
    if (visible && message && VOICE_AGENT_ENABLED) speak(message);
  }, [visible, message]);

  // Keep isSpeakingRef current so the cap timer closure can read it
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  // Duck music while TTS is active
  useEffect(() => {
    if (isSpeaking) backgroundMusicService.duckForTTS();
    else backgroundMusicService.restoreFromDuck();
  }, [isSpeaking]);

  const runDismissAnimation = useCallback(() => {
    stop();
    floatLoopRef.current?.stop();
    glowLoopRef.current?.stop();
    Animated.timing(overlayOpacity, { toValue: 0, duration: 350, useNativeDriver: true })
      .start(() => onDismiss());
  }, [onDismiss, overlayOpacity, stop]);

  // Auto-dismiss guard (used by timers / onIdle)
  const triggerDismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    runDismissAnimation();
  }, [runDismissAnimation]);

  // X button — bypasses the isDismissingRef guard so it always works
  const handleXPress = useCallback(() => {
    isDismissingRef.current = true;
    runDismissAnimation();
  }, [runDismissAnimation]);

  // Hard cap (30s fallback) — only fires if TTS has also finished
  useEffect(() => {
    if (!visible) return;
    const cap = setTimeout(() => {
      if (canDismissRef.current && !isSpeakingRef.current) triggerDismiss();
    }, 30000);
    return () => clearTimeout(cap);
  }, [visible, triggerDismiss]);

  // Auto-dismiss once typewriter done + TTS quiet + canDismiss
  useEffect(() => {
    if (canDismiss && typewriterDone && !isSpeaking) triggerDismiss();
  }, [canDismiss, typewriterDone, isSpeaking, triggerDismiss]);

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.container, { opacity: overlayOpacity }]}>
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { opacity: canDismiss ? 1 : 0.3 }]}
            onPress={canDismiss ? handleXPress : undefined}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.centerContent}>
          <Animated.Image
            source={OraLogomarkGreen}
            style={[styles.logo, { opacity: logoGlow, transform: [{ translateY: logoFloat }] }]}
            resizeMode="contain"
          />
          <Text style={styles.oraTitle}>ORA</Text>

          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={styles.messageText}>{displayedText}</Text>
          </Animated.View>

          {messageLoading && !message && (
            <ActivityIndicator color="rgba(100,40,140,0.5)" style={styles.spinner} />
          )}

          <MeditationSoundControl style={styles.soundControl} />
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 18,
    color: 'rgba(80,20,120,0.7)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -60,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  oraTitle: {
    fontSize: 11,
    letterSpacing: 6,
    color: 'rgba(80,20,120,0.6)',
    marginBottom: 32,
  },
  messageText: {
    fontSize: 16,
    color: 'rgba(60,20,80,0.85)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  spinner: {
    marginTop: 24,
  },
  soundControl: {
    marginTop: 32,
    backgroundColor: 'rgba(80,20,120,0.12)',
    minWidth: 220,
  },
});
