import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

interface Letter {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  subject: string;
  body: string;
  sent_at: string;
  is_from_current_user: boolean;
}

interface ThreadLetter extends Letter {
  show_date_header?: boolean;
  date_header?: string;
}

export const LetterThreadScreen: React.FC = () => {
  const route = useRoute();
  const threadId = route.params?.threadId;
  const otherUserId = route.params?.otherUserId;
  const otherUserName = route.params?.otherUserName;

  const [letters, setLetters] = useState<ThreadLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/letters/threads/${threadId}`);
      // const data = await response.json();

      // Mock data
      const mockLetters: Letter[] = [
        {
          id: '1',
          sender_id: 'current',
          recipient_id: 'other',
          sender_name: 'You',
          subject: 'Thank you for your support',
          body: 'Hi! I wanted to reach out and thank you for your thoughtful comment on my post. It really helped me see things from a different perspective.',
          sent_at: new Date(Date.now() - 259200000).toISOString(),
          is_from_current_user: true,
        },
        {
          id: '2',
          sender_id: 'other',
          recipient_id: 'current',
          sender_name: otherUserName || 'Alex',
          subject: 'Re: Thank you for your support',
          body: "You're so welcome! I'm glad my words could help. Your journey is inspiring, and I'm here if you ever need someone to talk to.",
          sent_at: new Date(Date.now() - 172800000).toISOString(),
          is_from_current_user: false,
        },
        {
          id: '3',
          sender_id: 'current',
          recipient_id: 'other',
          sender_name: 'You',
          subject: 'Re: Thank you for your support',
          body: 'That means a lot to me. I\'ve been working on being more consistent with my mindfulness practice. How did you get started with yours?',
          sent_at: new Date(Date.now() - 86400000).toISOString(),
          is_from_current_user: true,
        },
      ];

      // Add date headers
      const lettersWithHeaders = addDateHeaders(mockLetters);
      setLetters(lettersWithHeaders);
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDateHeaders = (letters: Letter[]): ThreadLetter[] => {
    const result: ThreadLetter[] = [];
    let lastDate: string | null = null;

    letters.forEach((letter) => {
      const letterDate = formatDateHeader(letter.sent_at);
      
      const threadLetter: ThreadLetter = {
        ...letter,
        show_date_header: letterDate !== lastDate,
        date_header: letterDate,
      };
      
      result.push(threadLetter);
      lastDate = letterDate;
    });

    return result;
  };

  const formatDateHeader = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      // TODO: Send reply via API
      // await fetch('/api/letters', {
      //   method: 'POST',
      //   body: JSON.stringify({ 
      //     recipient_id: otherUserId,
      //     subject: `Re: ${letters[letters.length - 1].subject}`,
      //     body: replyText,
      //     thread_id: threadId,
      //   }),
      // });

      // Add new letter to list
      const newLetter: ThreadLetter = {
        id: Date.now().toString(),
        sender_id: 'current',
        recipient_id: otherUserId || 'other',
        sender_name: 'You',
        subject: `Re: ${letters[letters.length - 1]?.subject}`,
        body: replyText,
        sent_at: new Date().toISOString(),
        is_from_current_user: true,
        show_date_header: true,
        date_header: 'Today',
      };

      setLetters([...letters, newLetter]);
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderLetter = ({ item }: { item: ThreadLetter }) => (
    <>
      {item.show_date_header && (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{item.date_header}</Text>
        </View>
      )}
      
      <View
        style={[
          styles.letterBubble,
          item.is_from_current_user ? styles.letterSent : styles.letterReceived,
        ]}
      >
        <Text style={styles.letterBody}>{item.body}</Text>
        <Text style={styles.letterTime}>{formatTime(item.sent_at)}</Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B9D83" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={letters}
        keyExtractor={(item) => item.id}
        renderItem={renderLetter}
        contentContainerStyle={styles.listContent}
        inverted={false}
      />

      {/* Reply input */}
      <View style={styles.replyContainer}>
        <TextInput
          style={styles.replyInput}
          placeholder="Write your reply..."
          placeholderTextColor="#999"
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!replyText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendReply}
          disabled={!replyText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F0',
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  letterBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  letterSent: {
    backgroundColor: '#8B9D83',
    alignSelf: 'flex-end',
    marginLeft: '20%',
    borderBottomRightRadius: 4,
  },
  letterReceived: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginRight: '20%',
    borderBottomLeftRadius: 4,
  },
  letterBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2C3E2E',
    marginBottom: 6,
  },
  letterTime: {
    fontSize: 11,
    color: '#666',
    alignSelf: 'flex-end',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 12,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B9D83',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
