import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface Letter {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  subject: string;
  body: string;
  sent_at: string;
  read_at?: string;
  replied_to_id?: string;
  thread_id?: string;
}

export const LetterReadScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const letterId = route.params?.letterId;

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadLetters, setThreadLetters] = useState<Letter[]>([]);

  useEffect(() => {
    loadLetter();
  }, [letterId]);

  const loadLetter = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/letters/${letterId}`);
      // const data = await response.json();
      
      // Mark as read
      // await fetch(`/api/letters/${letterId}/read`, { method: 'PATCH' });

      // Mock data
      const mockLetter: Letter = {
        id: letterId,
        sender: {
          id: 'ora',
          name: 'Ora AI',
        },
        subject: 'Your daily reflection',
        body: `Good morning! I hope this finds you well today.

I wanted to check in and see how you're feeling about the progress you've been making. I've noticed you've been consistent with your mindfulness practice this week, and that's something to celebrate.

Remember, growth isn't always linear. Some days will feel easier than others, and that's perfectly okay. What matters is that you're showing up for yourself, one day at a time.

Is there anything on your mind today that you'd like to explore together? I'm here to listen and support you however I can.

With warmth and encouragement,
Ora`,
        sent_at: new Date(Date.now() - 7200000).toISOString(),
      };

      setLetter(mockLetter);

      // Load thread if part of a conversation
      if (mockLetter.thread_id) {
        // TODO: Load thread
        setThreadLetters([]);
      }
    } catch (error) {
      console.error('Error loading letter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = () => {
    if (!letter) return;
    
    navigation.navigate('ComposeLetter', {
      replyTo: letter.id,
      recipientId: letter.sender.id,
      recipientName: letter.sender.name,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B9D83" />
      </View>
    );
  }

  if (!letter) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
        <Text style={styles.errorText}>Letter not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Thread indicator */}
        {threadLetters.length > 0 && (
          <View style={styles.threadIndicator}>
            <Ionicons name="repeat-outline" size={16} color="#666" />
            <Text style={styles.threadText}>
              Part of a conversation ({threadLetters.length + 1} letters)
            </Text>
          </View>
        )}

        {/* Letter card */}
        <View style={styles.letterCard}>
          {/* Envelope header */}
          <View style={styles.envelopeHeader}>
            <View style={styles.senderInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {letter.sender.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.fromLabel}>From</Text>
                <Text style={styles.senderName}>{letter.sender.name}</Text>
              </View>
            </View>
            <Text style={styles.date}>{formatDate(letter.sent_at)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.headerDivider} />

          {/* Subject */}
          <Text style={styles.subject}>{letter.subject}</Text>

          {/* Body */}
          <Text style={styles.body}>{letter.body}</Text>

          {/* Decorative seal/stamp */}
          <View style={styles.seal}>
            <Ionicons name="heart" size={20} color="#D4C5B9" />
          </View>
        </View>

        {/* Previous letters in thread */}
        {threadLetters.map((threadLetter, index) => (
          <View key={threadLetter.id} style={[styles.letterCard, styles.threadLetter]}>
            <View style={styles.threadLetterHeader}>
              <Text style={styles.threadLetterLabel}>
                Previous letter ({threadLetters.length - index})
              </Text>
              <Text style={styles.threadLetterDate}>
                {formatDate(threadLetter.sent_at)}
              </Text>
            </View>
            <Text style={styles.threadLetterSubject}>{threadLetter.subject}</Text>
            <Text style={styles.threadLetterBody} numberOfLines={3}>
              {threadLetter.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Reply button bar */}
      <View style={styles.replyBar}>
        <TouchableOpacity
          style={styles.replyButton}
          onPress={handleReply}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-undo-outline" size={20} color="#fff" />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F0',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  threadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  threadText: {
    fontSize: 13,
    color: '#666',
  },
  letterCard: {
    backgroundColor: '#FFFEF9',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  envelopeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4C5B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fromLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  senderName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2C3E2E',
    marginTop: 2,
  },
  date: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E0D8CC',
    marginBottom: 20,
  },
  subject: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E2E',
    marginBottom: 20,
    lineHeight: 30,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    marginBottom: 32,
  },
  seal: {
    alignSelf: 'flex-end',
    opacity: 0.3,
  },
  threadLetter: {
    opacity: 0.8,
  },
  threadLetterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  threadLetterLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  threadLetterDate: {
    fontSize: 12,
    color: '#999',
  },
  threadLetterSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E2E',
    marginBottom: 8,
  },
  threadLetterBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  replyBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B9D83',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B9D83',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
