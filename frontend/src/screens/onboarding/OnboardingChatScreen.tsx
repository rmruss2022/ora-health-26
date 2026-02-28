/**
 * OnboardingChatScreen
 * AI intake chat — Ora asks 5 questions one at a time.
 * Mirrors ChatScreen layout (gradient orb header, PTT, same message components).
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useChat } from '../../hooks/useChat';
import { useTTS } from '../../hooks/useTTS';
import { usePTT } from '../../hooks/usePTT';
import { VOICE_AGENT_ENABLED } from '../../services/ElevenLabsService';
import { backgroundMusicService } from '../../services/BackgroundMusicService';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { onboardingAPI } from '../../services/api/onboardingAPI';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatInput } from '../../components/chat/ChatInput';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Nav = StackNavigationProp<OnboardingStackParamList, 'OnboardingChat'>;

const TOTAL_QUESTIONS = 5;

export function OnboardingChatScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboarding();

  const { speak, stop, isSpeaking, queueSpeak } = useTTS('persona-ora');

  const spokenIdsRef = useRef(new Set<string>());
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const { messages, isLoading, sendMessage } = useChat(
    'onboarding-intake',
    'persona-ora',
    {
      onSegment: (text, messageId) => {
        if (!VOICE_AGENT_ENABLED) return;
        spokenIdsRef.current.add(messageId);
        setSpeakingMessageId(messageId);
        queueSpeak(text);
      },
    }
  );

  // Clear speaking state when playback finishes
  useEffect(() => {
    if (!isSpeaking) setSpeakingMessageId(null);
  }, [isSpeaking]);

  // Duck music while TTS is active
  useEffect(() => {
    if (isSpeaking) backgroundMusicService.duckForTTS();
    else backgroundMusicService.restoreFromDuck();
  }, [isSpeaking]);

  // Auto-speak completed assistant messages
  useEffect(() => {
    if (!VOICE_AGENT_ENABLED) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.isStreaming) return;
    if (spokenIdsRef.current.has(last.id)) return;
    spokenIdsRef.current.add(last.id);
    setSpeakingMessageId(last.id);
    speak(last.content);
  }, [messages]);

  const [userMessageCount, setUserMessageCount] = useState(0);
  const [pendingInput, setPendingInput] = useState('');
  const continueOpacity = useRef(new Animated.Value(0)).current;
  const continueTranslateY = useRef(new Animated.Value(8)).current;
  const scrollRef = useRef<ScrollView>(null);

  // PTT support
  const { isRecording, isTranscribing, startListening, stopListening } = usePTT({
    onTranscript: (text) => setPendingInput(text),
  });

  // Spring in the Continue button after 5 user messages
  useEffect(() => {
    if (userMessageCount >= TOTAL_QUESTIONS) {
      Animated.parallel([
        Animated.spring(continueOpacity, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.spring(continueTranslateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      ]).start();
    }
  }, [userMessageCount]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length, messages[messages.length - 1]?.content?.length]);

  const handleSend = useCallback(
    (text: string) => {
      stop();
      setPendingInput('');
      setUserMessageCount((prev) => prev + 1);
      sendMessage(text);
    },
    [sendMessage, stop]
  );

  const handleContinue = useCallback(async () => {
    if (user?.id) {
      onboardingAPI.submitChatTranscript(user.id, messages).catch((err) => {
        console.warn('[OnboardingChat] Transcript submission failed:', err);
      });
    }
    await completeOnboarding();
    navigation.navigate('OnboardingSubscription');
  }, [user, messages, completeOnboarding, navigation]);

  const questionsAnswered = Math.min(userMessageCount, TOTAL_QUESTIONS);
  const done = userMessageCount >= TOTAL_QUESTIONS;

  return (
    <KeyboardAvoidingView
      style={[styles.container, Platform.OS === 'web' && { height: '100vh' as any }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header — mirrors ChatScreen header style */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <LinearGradient
            colors={['#D4B8E8', '#F8C8DC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerOrb}
          />
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Getting to know you</Text>
            <Text style={styles.headerSubtitle}>
              {questionsAnswered < TOTAL_QUESTIONS
                ? `${questionsAnswered} of ${TOTAL_QUESTIONS} questions`
                : 'All done ✓'}
            </Text>
          </View>
        </View>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < questionsAnswered ? styles.progressDotFilled : styles.progressDotEmpty,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesSection}>
        <View style={styles.chatHeaderRow}>
          <Text style={styles.sectionLabel}>Intake</Text>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSpeak={
                  VOICE_AGENT_ENABLED && msg.role === 'assistant'
                    ? () => {
                        if (speakingMessageId === msg.id && isSpeaking) stop();
                        else { setSpeakingMessageId(msg.id); speak(msg.content); }
                      }
                    : undefined
                }
                isSpeaking={speakingMessageId === msg.id && isSpeaking}
              />
            ))}
        </ScrollView>
      </View>

      {/* Continue button — appears after 5 answers */}
      {done && (
        <Animated.View
          style={[
            styles.continueWrapper,
            { opacity: continueOpacity, transform: [{ translateY: continueTranslateY }] },
          ]}
        >
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Input — hidden after 5 messages */}
      {!done && (
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          placeholder="Type a message..."
          voiceAvailable={VOICE_AGENT_ENABLED}
          onStartListening={startListening}
          onStopListening={stopListening}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          pendingText={pendingInput}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
  },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FAF8F3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.3,
    color: '#2D2D2D',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotFilled: {
    backgroundColor: 'rgba(60,20,80,0.7)',
  },
  progressDotEmpty: {
    backgroundColor: 'rgba(60,20,80,0.2)',
  },
  messagesSection: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  continueWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(180,150,200,0.2)',
    backgroundColor: '#FAF8F3',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: 'rgba(60,20,80,0.75)',
    paddingVertical: 15,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 1,
  },
});
