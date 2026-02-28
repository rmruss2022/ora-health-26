/**
 * OnboardingWelcomeScreen
 * TTS starts immediately on mount (parallel with typewriter).
 * Ora logo animates while speaking, settles when done.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useTTS } from '../../hooks/useTTS';
import { backgroundMusicService } from '../../services/BackgroundMusicService';

type Nav = StackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'>;

const WELCOME_TEXT =
  "Welcome to Ora. I'm here to walk with you on your wellness journey — not as a tool, but as a presence. Let's begin.";

const TYPEWRITER_DELAY_MS = 40;

export function OnboardingWelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const [displayedText, setDisplayedText] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);

  const { speak, isSpeaking } = useTTS('persona-ora');

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.65)).current;
  const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(10)).current;

  // Start music on mount
  useEffect(() => {
    backgroundMusicService.play('cascade').catch(() => {});
  }, []);

  // Start TTS immediately — don't wait for typewriter
  useEffect(() => {
    speak(WELCOME_TEXT);
  }, []);

  // Duck music while speaking
  useEffect(() => {
    if (isSpeaking) backgroundMusicService.duckForTTS();
    else backgroundMusicService.restoreFromDuck();
  }, [isSpeaking]);

  // Animate logo based on speaking state
  useEffect(() => {
    if (isSpeaking) {
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -8, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 8, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      floatLoopRef.current = floatLoop;
      floatLoop.start();

      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ])
      );
      glowLoopRef.current = glowLoop;
      glowLoop.start();
    } else {
      floatLoopRef.current?.stop();
      glowLoopRef.current?.stop();
      Animated.parallel([
        Animated.timing(floatAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.65, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [isSpeaking]);

  // Typewriter effect (runs in parallel with TTS)
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setTypewriterDone(false);

    const interval = setInterval(() => {
      index++;
      setDisplayedText(WELCOME_TEXT.slice(0, index));
      if (index >= WELCOME_TEXT.length) {
        clearInterval(interval);
        setTypewriterDone(true);
      }
    }, TYPEWRITER_DELAY_MS);

    return () => clearInterval(interval);
  }, []);

  // Fade in button once typewriter finishes
  useEffect(() => {
    if (!typewriterDone) return;
    Animated.parallel([
      Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(buttonTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [typewriterDone]);

  return (
    <LinearGradient colors={['#D4B8E8', '#F8C8DC']} style={styles.container}>
      <Animated.Image
        source={require('../../../assets/images/Ora-Logomark-Green.png')}
        style={[
          styles.logo,
          { opacity: glowAnim, transform: [{ translateY: floatAnim }] },
        ]}
        resizeMode="contain"
      />

      <Text style={styles.oraTitle}>ORA</Text>

      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>{displayedText}</Text>
      </View>

      <Animated.View
        style={[
          styles.buttonContainer,
          { opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] },
        ]}
        pointerEvents={typewriterDone ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('OnboardingInfo', { slideIndex: 0 })}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Begin</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 40,
  },
  textContainer: {
    minHeight: 120,
    alignItems: 'center',
    marginBottom: 52,
  },
  welcomeText: {
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(60,20,80,0.85)',
    textAlign: 'center',
    maxWidth: 280,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: 'rgba(60,20,80,0.75)',
    paddingVertical: 15,
    paddingHorizontal: 56,
    borderRadius: 32,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 1,
  },
});
