import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';
import { theme } from '../theme';

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();

  const modeFromRoute: string | undefined = route?.params?.conversationMode;
  const behaviorIdMap: Record<string, string> = {
    'free-form': 'free-form-chat',
    journal: 'weekly-review',
    exercise: 'self-compassion-exercise',
    analysis: 'weekly-review',
    planning: 'weekly-planning',
    review: 'weekly-review',
  };
  const selectedBehaviorId = behaviorIdMap[modeFromRoute ?? ''] || 'free-form-chat';

  const { messages, isLoading, sendMessage } = useChat(selectedBehaviorId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header with gradient - matching home-screen.png design */}
      <LinearGradient
        colors={['#8B9070', '#5A634A']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Conversation</Text>
        <Text style={styles.headerSubtitle}>A calm space for reflection and support</Text>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessage message={item} />}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        placeholder="Type a message..."
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECECEC',
  },
  header: {
    paddingBottom: 18,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontFamily: theme.typography.h2.fontFamily,
    fontSize: 32,
    color: '#FAFBF7',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: theme.typography.bodySmall.fontFamily,
    fontSize: 14,
    color: 'rgba(247, 248, 240, 0.9)',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
});

export default ChatScreen;
