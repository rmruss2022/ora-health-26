import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
}

const LetterCard: React.FC<{
  letter: Letter;
  onPress: () => void;
}> = ({ letter, onPress }) => {
  const isUnread = !letter.read_at;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.letterCard, isUnread && styles.letterCardUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isUnread && <View style={styles.unreadDot} />}

      <View style={styles.letterContent}>
        {/* Sender row */}
        <View style={styles.senderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {letter.sender.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.senderInfo}>
            <Text style={[styles.senderName, isUnread && styles.textBold]}>
              {letter.sender.name}
            </Text>
            <Text style={styles.timestamp}>{formatTimestamp(letter.sent_at)}</Text>
          </View>
        </View>

        {/* Subject */}
        <Text
          style={[styles.subject, isUnread && styles.textBold]}
          numberOfLines={1}
        >
          {letter.subject}
        </Text>

        {/* Body preview */}
        <Text style={styles.bodyPreview} numberOfLines={2}>
          {letter.body}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

export const LetterInboxScreen: React.FC = () => {
  const navigation = useNavigation();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/letters/inbox');
      // const data = await response.json();

      // Mock data
      const mockLetters: Letter[] = [
        {
          id: '1',
          sender: { id: 'ora', name: 'Ora AI' },
          subject: 'Your daily reflection',
          body: 'Good morning! I hope this finds you well today. I wanted to check in and see how you\'re feeling about the progress you\'ve been making...',
          sent_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '2',
          sender: { id: 'user2', name: 'Alex Chen' },
          subject: 'Re: Finding peace',
          body: 'Thank you so much for sharing that resource! I tried the breathing exercise you mentioned and it really helped...',
          sent_at: new Date(Date.now() - 86400000).toISOString(),
          read_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          sender: { id: 'ora', name: 'Ora AI' },
          subject: 'Weekly check-in',
          body: 'It\'s been a week since you started your mindfulness journey. I wanted to celebrate the small wins you\'ve achieved...',
          sent_at: new Date(Date.now() - 172800000).toISOString(),
          read_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setLetters(mockLetters);
    } catch (error) {
      console.error('Error loading letters:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLetters(true);
  };

  const handleLetterPress = (letter: Letter) => {
    // Navigate to letter read screen
    navigation.navigate('LetterRead', { letterId: letter.id });
  };

  const handleCompose = () => {
    navigation.navigate('ComposeLetter');
  };

  const unreadCount = letters.filter((l) => !l.read_at).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B9D83" />
      </View>
    );
  }

  if (letters.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.envelopeIcon}>
            <Ionicons name="mail-outline" size={64} color="#D4C5B9" />
          </View>
          <Text style={styles.emptyTitle}>No letters yet</Text>
          <Text style={styles.emptyText}>
            Letters are a meaningful way to connect with yourself and others.
          </Text>
          <TouchableOpacity style={styles.composeButton} onPress={handleCompose}>
            <Text style={styles.composeButtonText}>Write your first letter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with unread count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="mail-unread-outline" size={20} color="#2C3E2E" />
          <Text style={styles.unreadText}>
            {unreadCount} unread {unreadCount === 1 ? 'letter' : 'letters'}
          </Text>
        </View>
      )}

      {/* Letter list */}
      <FlatList
        data={letters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LetterCard letter={item} onPress={() => handleLetterPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B9D83"
          />
        }
      />

      {/* Floating compose button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCompose}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>
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
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFE5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E2E',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  letterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  letterCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#7B9FD3',
  },
  unreadDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B9FD3',
  },
  letterContent: {
    flex: 1,
    marginRight: 8,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4C5B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  senderInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 15,
    color: '#2C3E2E',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  subject: {
    fontSize: 16,
    color: '#2C3E2E',
    marginBottom: 4,
  },
  bodyPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  textBold: {
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B9D83',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  envelopeIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E2E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  composeButton: {
    backgroundColor: '#8B9D83',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  composeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
