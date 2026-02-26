import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Message } from '../../hooks/useChat';

interface ChatMessageProps {
  message: Message;
  /** Called when user taps the speak / stop button on an assistant message */
  onSpeak?: () => void;
  /** True when this specific message is currently being spoken */
  isSpeaking?: boolean;
}

/**
 * A blinking | cursor appended to the end of a streaming assistant message.
 */
const StreamingCursor: React.FC = () => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 530, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 530, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.Text style={[styles.streamingCursor, { opacity }]}>|</Animated.Text>;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSpeak, isSpeaking }) => {
  const isUser = message.role === 'user';
  const isStreaming = !isUser && !!message.isStreaming;

  const displayContent = isUser
    ? message.content
    : message.content.replace(/\*[^*]+\*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && (
        <LinearGradient
          colors={['#D4B8E8', '#F8C8DC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>O</Text>
        </LinearGradient>
      )}
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
          {displayContent}
          {isStreaming && <StreamingCursor />}
        </Text>
        {/* Footer (timestamp + speak button) only shown once streaming is complete */}
        {!isStreaming && (
          <View style={styles.bubbleFooter}>
            <Text
              style={[
                styles.timestamp,
                isUser ? styles.userTimestamp : styles.assistantTimestamp,
              ]}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {!isUser && onSpeak && (
              <TouchableOpacity
                onPress={onSpeak}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.speakButton, isSpeaking && styles.speakButtonActive]}
              >
                <Text style={[styles.speakIcon, isSpeaking && styles.speakIconActive]}>
                  {isSpeaking ? '■' : '▷'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1d473e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'System',
    fontSize: 11,
    color: '#D4B8E8',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#40916C',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(180,170,155,0.4)',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: 'System',
    fontSize: 15,
    lineHeight: 24,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#2D2D2D',
  },
  streamingCursor: {
    fontFamily: 'System',
    fontSize: 15,
    lineHeight: 24,
    color: '#9B8AB4',
    fontWeight: '300',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timestamp: {
    fontFamily: 'System',
    fontSize: 11,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.55)',
  },
  assistantTimestamp: {
    color: '#A8A49C',
  },
  speakButton: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,184,232,0.18)',
  },
  speakButtonActive: {
    backgroundColor: 'rgba(212,184,232,0.45)',
  },
  speakIcon: {
    fontSize: 9,
    color: '#9B8AB4',
  },
  speakIconActive: {
    color: '#7B5EA7',
  },
});
