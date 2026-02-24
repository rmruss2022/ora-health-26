import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { InboxMessage } from '../../types';
import { theme } from '../../theme';
import { inboxAPI } from '../../services/api/inboxAPI';
import { MessageResponseModal } from './MessageResponseModal';

const MESSAGE_TYPE_ICONS: Record<string, string> = {
  prompt: '💭',
  encouragement: '🌟',
  activity_suggestion: '💡',
  insight: '✨',
  community_highlight: '🎉',
};

interface InboxTabContentProps {
  onUnreadCountChange?: (count: number) => void;
}

export const InboxTabContent: React.FC<InboxTabContentProps> = ({
  onUnreadCountChange,
}) => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await inboxAPI.getMessages(false, 50, 0);
      setMessages(result.messages);
      onUnreadCountChange?.(result.unreadCount);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMessagePress = async (message: InboxMessage) => {
    // Mark as read if unread
    if (!message.isRead) {
      try {
        await inboxAPI.markAsRead(message.id);

        // Update local state
        setMessages(messages.map(m =>
          m.id === message.id ? { ...m, isRead: true } : m
        ));

        // Update unread count
        const unreadCount = messages.filter(m => !m.isRead).length - 1;
        onUnreadCountChange?.(unreadCount);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }

    // Open response modal
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const handleArchive = async (messageId: string) => {
    try {
      await inboxAPI.archiveMessage(messageId);

      // Remove from local state
      setMessages(messages.filter(m => m.id !== messageId));

      // Update unread count
      const message = messages.find(m => m.id === messageId);
      if (message && !message.isRead) {
        const unreadCount = messages.filter(m => !m.isRead && m.id !== messageId).length;
        onUnreadCountChange?.(unreadCount);
      }
    } catch (error) {
      console.error('Error archiving message:', error);
    }
  };

  const handleSubmitResponse = async (
    responseText: string,
    createPost: boolean,
    isAnonymous: boolean
  ) => {
    if (!selectedMessage) return;

    try {
      await inboxAPI.respondToMessage(
        selectedMessage.id,
        responseText,
        createPost,
        isAnonymous
      );

      // Optionally show success message
      // You could also navigate to the post if created
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  };

  const groupMessagesByDate = (messages: InboxMessage[]) => {
    const groups: { title: string; data: InboxMessage[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const todayMessages: InboxMessage[] = [];
    const yesterdayMessages: InboxMessage[] = [];
    const thisWeekMessages: InboxMessage[] = [];
    const olderMessages: InboxMessage[] = [];

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt);
      messageDate.setHours(0, 0, 0, 0);

      if (messageDate.getTime() === today.getTime()) {
        todayMessages.push(message);
      } else if (messageDate.getTime() === yesterday.getTime()) {
        yesterdayMessages.push(message);
      } else if (messageDate >= thisWeek) {
        thisWeekMessages.push(message);
      } else {
        olderMessages.push(message);
      }
    });

    if (todayMessages.length > 0) {
      groups.push({ title: 'Today', data: todayMessages });
    }
    if (yesterdayMessages.length > 0) {
      groups.push({ title: 'Yesterday', data: yesterdayMessages });
    }
    if (thisWeekMessages.length > 0) {
      groups.push({ title: 'This Week', data: thisWeekMessages });
    }
    if (olderMessages.length > 0) {
      groups.push({ title: 'Older', data: olderMessages });
    }

    return groups;
  };

  const renderMessage = ({ item }: { item: InboxMessage }) => {
    const icon = MESSAGE_TYPE_ICONS[item.messageType] || '📬';

    return (
      <TouchableOpacity
        style={[styles.messageCard, !item.isRead && styles.messageCardUnread]}
        onPress={() => handleMessagePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.messageIconContainer}>
          <Text style={styles.messageIcon}>{icon}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.messageContent}>
          {item.subject && (
            <Text style={[styles.messageSubject, !item.isRead && styles.messageSubjectUnread]}>
              {item.subject}
            </Text>
          )}
          <Text
            style={[styles.messageText, !item.isRead && styles.messageTextUnread]}
            numberOfLines={2}
          >
            {item.content}
          </Text>
          <Text style={styles.messageTime}>{item.timestamp}</Text>
        </View>

        <TouchableOpacity
          style={styles.archiveButton}
          onPress={(e) => {
            e.stopPropagation();
            handleArchive(item.id);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.archiveIcon}>📥</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const flatData = groupedMessages.flatMap(group => [
    { type: 'header', title: group.title },
    ...group.data.map(msg => ({ type: 'message', message: msg })),
  ]);

  return (
    <View style={styles.container}>
      <FlatList
        data={flatData}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `header-${item.title}` : `message-${item.message.id}`
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader({ title: item.title });
          }
          return renderMessage({ item: item.message });
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Check back soon for personalized prompts and insights
            </Text>
          </View>
        }
      />

      <MessageResponseModal
        visible={modalVisible}
        message={selectedMessage}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitResponse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.tiny,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  messageCardUnread: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  messageIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    position: 'relative',
  },
  messageIcon: {
    fontSize: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  messageContent: {
    flex: 1,
  },
  messageSubject: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  messageSubjectUnread: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  messageText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextUnread: {
    color: theme.colors.textPrimary,
  },
  messageTime: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
  },
  archiveButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  archiveIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
