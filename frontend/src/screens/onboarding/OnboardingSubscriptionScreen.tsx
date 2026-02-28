/**
 * OnboardingSubscriptionScreen
 * Typewriter headline/subheadline. Animated Ora logo above CTA speaks intro on mount.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../context/OnboardingContext';
import { subscriptionService } from '../../services/SubscriptionService';
import { useTTS } from '../../hooks/useTTS';
import { backgroundMusicService } from '../../services/BackgroundMusicService';

const SPEAK_TEXT =
  "Your wellness journey starts here. Less than a coffee a week — and more impactful than you'd expect. Let Ora walk with you.";

const HEADLINE = 'Your wellness journey\nstarts here.';
const SUBHEADLINE = "Less than a coffee a week.\nMore impactful than you'd expect.";

const CARDS = [
  { emoji: '☕', label: 'Weekly Starbucks',       price: '$7/week',  highlight: false, badge: null },
  { emoji: '💬', label: 'Single Therapy Session', price: '$150–200', highlight: false, badge: null },
  { emoji: '✦',  label: 'Ora',                    price: '$9.99/mo', highlight: true,  badge: 'Best Value' },
];

export function OnboardingSubscriptionScreen() {
  const { grantSubscription } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const { speak, stop, isSpeaking } = useTTS('persona-ora');

  // Typewriter state
  const [displayHeadline, setDisplayHeadline] = useState('');
  const [displaySubheadline, setDisplaySubheadline] = useState('');
  const headlineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.65)).current;
  const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Typewriter on mount (parallel with TTS)
  useEffect(() => {
    let hIdx = 0;
    headlineTimerRef.current = setInterval(() => {
      hIdx++;
      setDisplayHeadline(HEADLINE.slice(0, hIdx));
      if (hIdx >= HEADLINE.length) {
        clearInterval(headlineTimerRef.current!);
        let sIdx = 0;
        subTimerRef.current = setInterval(() => {
          sIdx++;
          setDisplaySubheadline(SUBHEADLINE.slice(0, sIdx));
          if (sIdx >= SUBHEADLINE.length) {
            clearInterval(subTimerRef.current!);
          }
        }, 20);
      }
    }, 45);

    return () => {
      if (headlineTimerRef.current) clearInterval(headlineTimerRef.current);
      if (subTimerRef.current) clearInterval(subTimerRef.current);
    };
  }, []);

  // Speak intro on mount
  useEffect(() => {
    speak(SPEAK_TEXT);
    return () => { stop(); };
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

  const handleSubscribe = async () => {
    stop();
    try {
      setIsLoading(true);
      if (Platform.OS === 'web') {
        await grantSubscription();
        return;
      }
      const success = await subscriptionService.purchaseMonthly();
      if (success) await grantSubscription();
    } catch (error: any) {
      Alert.alert('Subscription Error', error?.message ?? 'Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#D4B8E8', '#F8C8DC']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.headline}>{displayHeadline || '\u00A0'}</Text>
        <Text style={styles.subheadline}>{displaySubheadline || '\u00A0'}</Text>

        {/* Comparison cards */}
        <View style={styles.cardsContainer}>
          {CARDS.map((card, index) => (
            <View key={index} style={[styles.card, card.highlight && styles.cardHighlighted]}>
              {card.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{card.badge}</Text>
                </View>
              )}
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={[styles.cardLabel, card.highlight && styles.cardLabelHighlighted]}>
                {card.label}
              </Text>
              <Text style={[styles.cardPrice, card.highlight && styles.cardPriceHighlighted]}>
                {card.price}
              </Text>
            </View>
          ))}
        </View>

        {/* Animated Ora logo above CTA */}
        <Animated.Image
          source={require('../../../assets/images/Ora-Logomark-Green.png')}
          style={[
            styles.logo,
            { opacity: glowAnim, transform: [{ translateY: floatAnim }] },
          ]}
          resizeMode="contain"
        />

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, isLoading && { opacity: 0.7 }]}
          onPress={handleSubscribe}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="rgba(255,255,255,0.95)" />
          ) : (
            <Text style={styles.ctaButtonText}>Start My Journey</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>Billed monthly. Cancel anytime.</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: 'rgba(60,20,80,0.9)',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
    letterSpacing: -0.5,
    minHeight: 76,
  },
  subheadline: {
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(60,20,80,0.6)',
    textAlign: 'center',
    marginBottom: 36,
    minHeight: 52,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
    alignItems: 'flex-start',
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardHighlighted: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderColor: 'rgba(60,20,80,0.35)',
    borderWidth: 2,
  },
  badge: {
    backgroundColor: 'rgba(60,20,80,0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(60,20,80,0.55)',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 16,
  },
  cardLabelHighlighted: {
    color: 'rgba(60,20,80,0.85)',
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(60,20,80,0.7)',
    textAlign: 'center',
  },
  cardPriceHighlighted: {
    fontSize: 15,
    color: 'rgba(60,20,80,0.9)',
  },
  logo: {
    width: 52,
    height: 52,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: 'rgba(60,20,80,0.75)',
    paddingVertical: 17,
    paddingHorizontal: 48,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.5,
  },
  legal: {
    fontSize: 13,
    color: 'rgba(60,20,80,0.45)',
    textAlign: 'center',
  },
});
