/**
 * Optimized Chat Message Component
 * Memoized to prevent unnecessary re-renders in chat lists
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Memoized chat message component
 * Only re-renders when props actually change
 */
export const OptimizedChatMessage = memo<ChatMessageProps>(
  ({ id, role, content, timestamp }) => {
    const isUser = role === 'user';

    return (
      <View
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.assistantContainer,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.text,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {content}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(timestamp)}
          </Text>
        </View>
      </View>
    );
  },
  // Custom comparison function for memo
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.id === nextProps.id &&
      prevProps.content === nextProps.content &&
      prevProps.role === nextProps.role &&
      prevProps.timestamp.getTime() === nextProps.timestamp.getTime()
    );
  }
);

/**
 * Format timestamp efficiently
 */
function formatTimestamp(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    backgroundColor: '#E9ECEF',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
});

OptimizedChatMessage.displayName = 'OptimizedChatMessage';

export default OptimizedChatMessage;
