import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, placeholder = "Type a message..." }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e: any) => {
    // On web, allow Enter to send message (Shift+Enter for new line)
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#A8A49C"
          multiline
          maxLength={1000}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          onKeyPress={handleKeyPress}
          returnKeyType="send"
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
          accessibilityRole="none"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || isLoading}
          accessibilityLabel={isLoading ? "Sending message" : "Send message"}
          accessibilityRole="button"
          accessibilityHint="Double tap to send your message"
          accessibilityState={{ disabled: !text.trim() || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.sendIcon}>
              <View style={styles.sendArrow} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF8F3',
    borderTopWidth: 1,
    borderTopColor: 'rgba(180,170,155,0.3)',
    paddingVertical: 12,
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
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d473e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
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
});
