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
          placeholderTextColor="#999"
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2d5e52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
