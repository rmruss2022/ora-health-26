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
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';
import { theme } from '../theme';

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { messages, isLoading, sendMessage } = useChat('free-form-chat');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header with gradient - matching home-screen.png design */}
      <LinearGradient
        colors={['#4A90E2', '#2E5C8A']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Shadow AI</Text>
        <Text style={styles.headerSubtitle}>Your personal companion for growth and reflection</Text>
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
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
});

export default ChatScreen;
