import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  created_at: string;
  depth: number;
  parent_comment_id?: string;
  replies?: Comment[];
  reactions?: { emoji: string; count: number }[];
}

interface ThreadedCommentListProps {
  comments: Comment[];
  onReply: (parentId: string, content: string) => Promise<void>;
  onReact: (commentId: string, emoji: string) => void;
  maxDepth?: number;
}

const MAX_DEPTH = 3;
const INDENT_WIDTH = 16;
const DEPTH_COLORS = ['#8B9D83', '#A8B89F', '#C5D3BB'];

const CommentItem: React.FC<{
  comment: Comment;
  onReply: (parentId: string, content: string) => Promise<void>;
  onReact: (commentId: string, emoji: string) => void;
  maxDepth: number;
}> = ({ comment, onReply, onReact, maxDepth }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const depth = Math.min(comment.depth, maxDepth);
  const borderColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  const handleReplySubmit = async () => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View
      style={[
        styles.commentContainer,
        { marginLeft: depth * INDENT_WIDTH },
      ]}
    >
      {depth > 0 && (
        <View
          style={[
            styles.depthBorder,
            { backgroundColor: borderColor },
          ]}
        />
      )}
      
      <View style={styles.commentContent}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {comment.author.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName}>{comment.author.name}</Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(comment.created_at)}
          </Text>
        </View>

        {/* Comment text */}
        <Text style={styles.commentText}>{comment.content}</Text>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowReplyInput(!showReplyInput)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>

          {comment.reactions && comment.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {comment.reactions.map((reaction, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.reactionBubble}
                  onPress={() => onReact(comment.id, reaction.emoji)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReact(comment.id, '❤️')}
          >
            <Ionicons name="heart-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Reply input */}
        {showReplyInput && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor="#999"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={500}
            />
            <View style={styles.replyActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowReplyInput(false);
                  setReplyText('');
                }}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!replyText.trim() || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleReplySubmit}
                disabled={!replyText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Reply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onReact={onReact}
              maxDepth={maxDepth}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const ThreadedCommentList: React.FC<ThreadedCommentListProps> = ({
  comments,
  onReply,
  onReact,
  maxDepth = MAX_DEPTH,
}) => {
  if (!comments || comments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No comments yet</Text>
        <Text style={styles.emptySubtext}>Be the first to share your thoughts</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onReact={onReact}
          maxDepth={maxDepth}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  depthBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  commentContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B9D83',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E2E',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#333',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  replyInputContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  replyInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    maxHeight: 120,
    color: '#333',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  submitButton: {
    backgroundColor: '#8B9D83',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
});
