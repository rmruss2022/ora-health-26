import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Comment } from '../../types';
import { theme } from '../../theme';
import { ReactionBar } from './ReactionBar';

interface CommentCardProps {
  comment: Comment;
  userId: string;
}

export const CommentCard: React.FC<CommentCardProps> = ({ comment, userId }) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{comment.author.avatar}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.authorName}>
            {comment.author.isAnonymous ? 'Anonymous' : comment.author.name}
          </Text>
          <Text style={styles.timestamp}>{comment.timestamp}</Text>
        </View>

        <Text style={styles.commentText}>{comment.content}</Text>

        {/* Reactions */}
        <ReactionBar
          targetId={comment.id}
          targetType="comment"
          userId={userId}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.xs,
  },
  timestamp: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
  },
  commentText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
