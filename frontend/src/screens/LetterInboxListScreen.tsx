import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { inboxAPI } from '../services/api/inboxAPI';
import { InboxMessage } from '../types';

const AUTHOR_LABELS: Record<string, string> = {
  community_highlight: 'From the circle',
  insight: 'A member',
  encouragement: 'From the circle',
  prompt: 'A member',
  activity_suggestion: 'From the circle',
};

export const LetterInboxListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [letters, setLetters] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLetters = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const result = await inboxAPI.getDailyLetters();
      setLetters(result.messages);
    } catch (error) {
      console.error('Error loading letters:', error);
      try {
        const fallback = await inboxAPI.getMessages(false, 20, 0);
        setLetters(fallback.messages);
      } catch {
        setLetters([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLetters();
    }, [loadLetters])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadLetters(true);
  };

  const handleLetterPress = async (letter: InboxMessage) => {
    if (letter.isDailyLetter && !letter.isRead) {
      try {
        await inboxAPI.markDailyLetterAsRead(letter.id);
        setLetters((prev) =>
          prev.map((l) => (l.id === letter.id ? { ...l, isRead: true } : l))
        );
      } catch {
        // Ignore
      }
    }
    const letterParam: InboxMessage = {
      ...letter,
      createdAt: typeof letter.createdAt === 'string' ? letter.createdAt : (letter.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    };
    navigation.push('LetterDetail', { letter: letterParam });
  };

  const renderLetter = ({ item }: { item: InboxMessage }) => {
    const authorLabel = item.authorName || AUTHOR_LABELS[item.messageType] || 'From the circle';
    return (
      <TouchableOpacity
        style={styles.letterCard}
        onPress={() => handleLetterPress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          <View style={styles.authorRow}>
            <View style={[styles.authorPill, !item.isRead && styles.authorPillUnread]}>
              <Text style={[styles.authorLabel, !item.isRead && styles.authorLabelUnread]}>
                {authorLabel}
              </Text>
            </View>
            <View style={styles.rightMeta}>
              {!item.isRead && <View style={styles.unreadDot} />}
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
          <Text
            style={[styles.subject, !item.isRead && styles.subjectUnread]}
            numberOfLines={1}
          >
            {item.subject || 'Letter'}
          </Text>
          <Text style={styles.preview} numberOfLines={2}>
            {item.content}
          </Text>
        </View>
        <View style={styles.chevronWrap}>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && letters.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Letters</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading letters...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Letters</Text>
        </TouchableOpacity>
      </View>

      {letters.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>✉</Text>
          </View>
          <Text style={styles.emptyTitle}>No letters yet</Text>
          <Text style={styles.emptyText}>
            Letters from the circle will appear here. Check back soon.
          </Text>
        </View>
      ) : (
        <FlatList
          data={letters}
          keyExtractor={(item) => item.id}
          renderItem={renderLetter}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FAF8F3',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180,170,155,0.3)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontFamily: 'Switzer-Regular',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.xs,
  },
  backText: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Switzer-Regular',
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  letterCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.35)',
  },
  cardInner: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorPill: {
    backgroundColor: 'rgba(212,184,232,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,184,232,0.4)',
  },
  authorPillUnread: {
    backgroundColor: 'rgba(212,184,232,0.28)',
    borderColor: 'rgba(212,184,232,0.6)',
  },
  authorLabel: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 11,
    color: '#6B5B95',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  authorLabelUnread: {
    color: '#5B4A85',
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  timestamp: {
    fontFamily: 'Switzer-Regular',
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  subject: {
    fontFamily: 'Sentient-Light',
    fontSize: 17,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  subjectUnread: {
    fontFamily: 'Sentient-Medium',
    color: theme.colors.textPrimary,
  },
  preview: {
    fontFamily: 'Switzer-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textTertiary,
  },
  chevronWrap: {
    justifyContent: 'center',
    paddingRight: theme.spacing.md,
  },
  chevron: {
    fontSize: 22,
    color: 'rgba(163,163,163,0.6)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212,184,232,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212,184,232,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 30,
    color: theme.colors.primary,
  },
  emptyTitle: {
    fontFamily: 'Sentient-Light',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontFamily: 'Switzer-Regular',
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
