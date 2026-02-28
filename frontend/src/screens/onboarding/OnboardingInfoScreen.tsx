/**
 * OnboardingInfoScreen
 * 3 slides with animated Ora logo (in footer) that speaks each slide.
 * Emoji + typewriter title + typewriter body. Logo floats/glows while TTS plays.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useTTS } from '../../hooks/useTTS';
import { backgroundMusicService } from '../../services/BackgroundMusicService';

type Nav = StackNavigationProp<OnboardingStackParamList, 'OnboardingInfo'>;
type Route = RouteProp<OnboardingStackParamList, 'OnboardingInfo'>;

const SLIDES = [
  {
    emoji: '🧘',
    title: 'Meditate Every Day',
    body: 'Build a sustainable daily practice with a community that keeps you grounded. Even five minutes reshapes your nervous system.',
  },
  {
    emoji: '🌿',
    title: 'Better Together',
    body: 'Group meditation compounds the benefits. When we sit together — even virtually — our nervous systems regulate each other.',
  },
  {
    emoji: '✦',
    title: 'Your Wellness Guide',
    body: "Ora isn't just a timer. She tracks your journey, adapts to your needs, and grows alongside you.",
  },
];

const TOTAL_SLIDES = SLIDES.length;

export function OnboardingInfoScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const slideIndex = route.params?.slideIndex ?? 0;
  const slide = SLIDES[slideIndex];

  const { speak, stop, isSpeaking } = useTTS('persona-ora');

  // Typewriter state
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayBody, setDisplayBody] = useState('');
  const titleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bodyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slide content animation
  const translateX = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Logo animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.65)).current;
  const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Reset and animate on slide change
  useEffect(() => {
    stop();

    if (titleTimerRef.current) clearInterval(titleTimerRef.current);
    if (bodyTimerRef.current) clearInterval(bodyTimerRef.current);
    setDisplayTitle('');
    setDisplayBody('');

    translateX.setValue(40);
    contentOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // Typewriter: title first, then body
    let titleIdx = 0;
    titleTimerRef.current = setInterval(() => {
      titleIdx++;
      setDisplayTitle(slide.title.slice(0, titleIdx));
      if (titleIdx >= slide.title.length) {
        clearInterval(titleTimerRef.current!);
        let bodyIdx = 0;
        bodyTimerRef.current = setInterval(() => {
          bodyIdx++;
          setDisplayBody(slide.body.slice(0, bodyIdx));
          if (bodyIdx >= slide.body.length) {
            clearInterval(bodyTimerRef.current!);
          }
        }, 18);
      }
    }, 45);

    const ttsTimer = setTimeout(() => {
      speak(`${slide.title}. ${slide.body}`);
    }, 300);

    return () => {
      clearTimeout(ttsTimer);
      if (titleTimerRef.current) clearInterval(titleTimerRef.current);
      if (bodyTimerRef.current) clearInterval(bodyTimerRef.current);
      stop();
    };
  }, [slideIndex]);

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

  const handleNext = () => {
    stop();
    if (slideIndex < TOTAL_SLIDES - 1) {
      navigation.navigate('OnboardingInfo', { slideIndex: (slideIndex + 1) as 0 | 1 | 2 });
    } else {
      navigation.navigate('OnboardingChat');
    }
  };

  const isLast = slideIndex === TOTAL_SLIDES - 1;

  return (
    <LinearGradient colors={['#D4B8E8', '#F8C8DC']} style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= slideIndex ? styles.dotFilled : styles.dotEmpty]} />
        ))}
      </View>

      {/* Slide content */}
      <Animated.View style={[styles.slideContent, { opacity: contentOpacity, transform: [{ translateX }] }]}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{displayTitle || '\u00A0'}</Text>
        <Text style={styles.body}>{displayBody || '\u00A0'}</Text>
      </Animated.View>

      {/* Footer: Ora logo + button */}
      <View style={styles.footer}>
        <Animated.Image
          source={require('../../../assets/images/Ora-Logomark-Green.png')}
          style={[
            styles.logo,
            { opacity: glowAnim, transform: [{ translateY: floatAnim }] },
          ]}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>{isLast ? 'Begin' : 'Next →'}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 52,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 36,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotFilled: {
    backgroundColor: 'rgba(60,20,80,0.7)',
  },
  dotEmpty: {
    backgroundColor: 'rgba(60,20,80,0.2)',
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 52,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: 'rgba(60,20,80,0.9)',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: -0.3,
    minHeight: 34,
  },
  body: {
    fontSize: 17,
    lineHeight: 28,
    color: 'rgba(60,20,80,0.65)',
    textAlign: 'center',
    maxWidth: 300,
    minHeight: 84,
  },
  footer: {
    alignItems: 'center',
    gap: 20,
  },
  logo: {
    width: 52,
    height: 52,
  },
  nextButton: {
    backgroundColor: 'rgba(60,20,80,0.75)',
    paddingVertical: 15,
    paddingHorizontal: 56,
    borderRadius: 32,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 1,
  },
});
