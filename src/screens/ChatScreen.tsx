import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';
import { useTTS } from '../hooks/useTTS';
import { usePTT } from '../hooks/usePTT';
import { VOICE_AGENT_ENABLED } from '../services/ElevenLabsService';
import { theme } from '../theme';

type PersonaId = 'persona-ora' | 'persona-genz' | 'persona-psychotherapist';

const PERSONAS: { id: PersonaId; name: string; tagline: string; colors: [string, string] }[] = [
  { id: 'persona-ora', name: 'Ora', tagline: 'your mindful companion', colors: ['#6366F1', '#8B5CF6'] },
  { id: 'persona-genz', name: 'Sage', tagline: 'no cap, i get you', colors: ['#06B6D4', '#7C3AED'] },
  { id: 'persona-psychotherapist', name: 'Dr. Avery', tagline: 'roots & growth', colors: ['#F59E0B', '#EC4899'] },
];

const MODES = [
  { id: 'free-form', label: 'Free Flow' },
  { id: 'journal', label: 'Journal' },
  { id: 'exercise', label: 'Breathwork' },
  { id: 'analysis', label: 'Reflect' },
  { id: 'planning', label: 'Plan' },
];

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();

  const modeFromRoute: string | undefined = route?.params?.conversationMode;
  const [selectedMode, setSelectedMode] = useState(modeFromRoute || 'free-form');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('persona-ora');

  // Animated values for each persona card
  const animValues = useRef(
    PERSONAS.reduce((acc, p) => {
      acc[p.id] = new Animated.Value(p.id === 'persona-ora' ? 1 : 0);
      return acc;
    }, {} as Record<PersonaId, Animated.Value>)
  ).current;

  useEffect(() => {
    PERSONAS.forEach((p) => {
      Animated.spring(animValues[p.id], {
        toValue: p.id === selectedPersona ? 1 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    });
  }, [selectedPersona]);

  const behaviorIdMap: Record<string, string> = {
    'free-form': 'free-form-chat',
    journal: 'weekly-review',
    exercise: 'self-compassion-exercise',
    analysis: 'weekly-review',
    planning: 'weekly-planning',
    review: 'weekly-review',
  };
  const selectedBehaviorId = behaviorIdMap[selectedMode] || 'free-form-chat';
  const selectedModeLabel = MODES.find((mode) => mode.id === selectedMode)?.label || 'Free Flow';

  const { messages, isLoading, sendMessage } = useChat(selectedBehaviorId, selectedPersona);

  const { speak, stop, isSpeaking } = useTTS(selectedPersona);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Clear speaking state when playback finishes
  useEffect(() => {
    if (!isSpeaking) setSpeakingMessageId(null);
  }, [isSpeaking]);

  // Reset speaking when persona changes
  useEffect(() => {
    stop();
  }, [selectedPersona]);

  const handleSpeak = useCallback(
    (id: string, content: string) => {
      if (speakingMessageId === id && isSpeaking) {
        stop();
      } else {
        setSpeakingMessageId(id);
        speak(content);
      }
    },
    [speak, stop, isSpeaking, speakingMessageId]
  );

  // Voice mode: auto-play assistant responses after PTT is used
  const [voiceMode, setVoiceMode] = useState(false);
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const count = messages.length;
    if (voiceMode && count > prevMsgCountRef.current) {
      const last = messages[count - 1];
      if (last?.role === 'assistant') {
        setSpeakingMessageId(last.id);
        speak(last.content);
      }
    }
    prevMsgCountRef.current = count;
  }, [messages]);

  const { isRecording, isTranscribing, startListening, stopListening } = usePTT({
    onTranscript: (text) => {
      setVoiceMode(true);
      sendMessage(text);
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <LinearGradient
            colors={['#D4B8E8', '#F8C8DC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerOrb}
          />
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Ora Club</Text>
            <Text style={styles.headerSubtitle}>A space for honest conversation</Text>
          </View>
        </View>
      </View>

      {/* Persona Selector */}
      <View style={styles.personaRow}>
        {PERSONAS.map((persona) => {
          const isActive = selectedPersona === persona.id;
          const anim = animValues[persona.id];
          const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
          const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

          return (
            <TouchableOpacity
              key={persona.id}
              activeOpacity={0.8}
              onPress={() => setSelectedPersona(persona.id)}
              style={styles.personaCardWrapper}
            >
              <Animated.View style={{ transform: [{ scale }], opacity }}>
                <LinearGradient
                  colors={persona.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.personaCard,
                    isActive && styles.personaCardActive,
                  ]}
                >
                  <Text style={styles.personaName}>{persona.name}</Text>
                  <Text style={styles.personaTagline}>{persona.tagline}</Text>
                  {isActive && <View style={styles.personaIndicator} />}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Messages */}
      <View style={styles.messagesSection}>
        <View style={styles.chatHeaderRow}>
          <Text style={styles.circleTitle}>Chat</Text>
          <TouchableOpacity
            style={styles.modeStackButton}
            onPress={() => setShowModeMenu((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.modeStackIcon}>≡</Text>
            <Text style={styles.modeStackLabel}>{selectedModeLabel}</Text>
          </TouchableOpacity>
        </View>
        {showModeMenu && (
          <View style={styles.modeContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modeScrollContent}
            >
              {MODES.map((mode) => {
                const isActive = selectedMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.modeChip,
                      isActive ? styles.modeChipActive : styles.modeChipInactive,
                    ]}
                    onPress={() => {
                      setSelectedMode(mode.id);
                      setShowModeMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        isActive ? styles.modeChipTextActive : styles.modeChipTextInactive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        <View style={styles.messagesPanel}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage
                message={item}
                onSpeak={
                  VOICE_AGENT_ENABLED && item.role === 'assistant'
                    ? () => handleSpeak(item.id, item.content)
                    : undefined
                }
                isSpeaking={speakingMessageId === item.id && isSpeaking}
              />
            )}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        placeholder="Type a message..."
        voiceAvailable={VOICE_AGENT_ENABLED}
        onStartListening={startListening}
        onStopListening={stopListening}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
      />
    </KeyboardAvoidingView>
  );
};

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
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 0.5,
    color: '#2D2D2D',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#8A8A8A',
  },
  circleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.lavender,
    marginBottom: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modeStackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.45)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'transparent',
  },
  modeStackIcon: {
    fontSize: 14,
    color: '#5A5A5A',
    marginRight: 6,
  },
  modeStackLabel: {
    fontSize: 12,
    color: '#5A5A5A',
    fontFamily: 'System',
    fontWeight: '600',
  },
  modeContainer: {
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.35)',
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  modeScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  modeChipActive: {
    backgroundColor: '#1d473e',
    borderWidth: 0,
  },
  modeChipInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.45)',
  },
  modeChipText: {
    fontSize: 13,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  modeChipTextInactive: {
    color: '#5A5A5A',
    fontFamily: 'System',
  },
  personaRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  personaCardWrapper: {
    flex: 1,
  },
  personaCard: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaCardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  personaName: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  personaTagline: {
    fontFamily: 'System',
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
  personaIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginTop: 5,
  },
  messagesSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  messagesPanel: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesList: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
});

export default ChatScreen;
