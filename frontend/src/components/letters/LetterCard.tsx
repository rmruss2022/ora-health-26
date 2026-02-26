import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { theme } from '../../theme';

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
  is_read: boolean;
}

interface LetterCardProps {
  letter: Letter;
  onPress: () => void;
}

export const LetterCard: React.FC<LetterCardProps> = ({ letter, onPress }) => {
  const timeAgo = getTimeAgo(letter.sent_at);
  const preview = getBodyPreview(letter.body);

  return (
    <TouchableOpacity
      style={[styles.card, !letter.is_read && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {!letter.is_read && <View style={styles.unreadDot} />}
      
      <View style={styles.avatarContainer}>
        {letter.sender.avatar ? (
          <Image
            source={{ uri: letter.sender.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {letter.sender.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.senderName, !letter.is_read && styles.senderNameUnread]}
            numberOfLines={1}
          >
            {letter.sender.name}
          </Text>
          <Text style={styles.timestamp}>{timeAgo}</Text>
        </View>

        <Text
          style={[styles.subject, !letter.is_read && styles.subjectUnread]}
          numberOfLines={1}
        >
          {letter.subject}
        </Text>

        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      </View>

      <View style={styles.chevronContainer}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

function getBodyPreview(body: string, maxLength: number = 100): string {
  const stripped = body.replace(/<[^>]*>/g, '').trim();
  if (stripped.length <= maxLength) {
    return stripped;
  }
  return stripped.substring(0, maxLength) + '...';
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  // For older letters, show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: '#FFF9F5',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text,
    flex: 1,
  },
  senderNameUnread: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  subject: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subjectUnread: {
    fontWeight: '600',
  },
  preview: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  chevronContainer: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  chevron: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    opacity: 0.5,
  },
});
