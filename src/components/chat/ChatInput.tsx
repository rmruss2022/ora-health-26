import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Text,
} from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
  // Voice / PTT
  onStartListening?: () => void;
  onStopListening?: () => void;
  isRecording?: boolean;
  isTranscribing?: boolean;
  voiceAvailable?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = 'Type a message...',
  onStartListening,
  onStopListening,
  isRecording = false,
  isTranscribing = false,
  voiceAvailable = false,
}) => {
  const [text, setText] = useState('');

  // Pulse animation for the mic button while recording
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show mic button when: voice available, no text typed, not loading
  const showMic = voiceAvailable && !text.trim() && !isLoading;
  const inputBusy = isLoading || isRecording || isTranscribing;

  const inputPlaceholder = isRecording
    ? 'Listening...'
    : isTranscribing
    ? 'Transcribing...'
    : placeholder;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={inputPlaceholder}
          placeholderTextColor={isRecording ? '#E07070' : '#A8A49C'}
          multiline
          maxLength={1000}
          editable={!inputBusy}
          onSubmitEditing={handleSend}
          onKeyPress={handleKeyPress}
          returnKeyType="send"
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
          accessibilityRole="none"
        />

        {/* Send button — visible when there's text */}
        {!showMic && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.sendButton,
              (!text.trim() || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSend}
            disabled={!text.trim() || isLoading}
            accessibilityLabel={isLoading ? 'Sending message' : 'Send message'}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.sendIcon}>
                <View style={styles.sendArrow} />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Mic button — visible when no text typed and voice is available */}
        {showMic && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.micButton,
                isRecording && styles.micButtonRecording,
                isTranscribing && styles.micButtonTranscribing,
              ]}
              onPressIn={onStartListening}
              onPressOut={onStopListening}
              disabled={isTranscribing}
              accessibilityLabel={isRecording ? 'Recording — release to send' : 'Hold to speak'}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color="#9B8AB4" />
              ) : (
                <Text style={[styles.micIcon, isRecording && styles.micIconRecording]}>
                  {isRecording ? '■' : '⏺'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Hold-to-speak hint — shown only when not recording */}
      {showMic && !isRecording && !isTranscribing && (
        <Text style={styles.hint}>Hold to speak</Text>
      )}
      {isRecording && (
        <Text style={styles.hintRecording}>Release to send</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF8F3',
    borderTopWidth: 1,
    borderTopColor: 'rgba(180,170,155,0.3)',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(180,170,155,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'System',
    fontSize: 15,
    color: '#2D2D2D',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: '#1d473e',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: '#fff',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  micButton: {
    backgroundColor: 'rgba(212,184,232,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,184,232,0.6)',
  },
  micButtonRecording: {
    backgroundColor: 'rgba(220,80,80,0.15)',
    borderColor: 'rgba(200,70,70,0.6)',
  },
  micButtonTranscribing: {
    backgroundColor: 'rgba(212,184,232,0.12)',
    borderColor: 'rgba(155,138,180,0.4)',
  },
  micIcon: {
    fontSize: 16,
    color: '#9B8AB4',
  },
  micIconRecording: {
    fontSize: 14,
    color: '#C84646',
  },
  hint: {
    fontSize: 11,
    color: '#B0A8A0',
    textAlign: 'center',
    marginTop: 4,
  },
  hintRecording: {
    fontSize: 11,
    color: '#C84646',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
});
