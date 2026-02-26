import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThreadedCommentList } from '../components/community/ThreadedCommentList';
import { useNavigation, useRoute } from '@react-navigation/native';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: string;
  created_at: string;
  reactions_count: number;
  comments_count: number;
}

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

const CATEGORY_COLORS: Record<string, string> = {
  Reflection: '#9B7EBD',
  Growth: '#8B9D83',
  Wellness: '#6B9C9E',
  Gratitude: '#7B9FD3',
  Support: '#D395B7',
  Question: '#D89E5F',
};

export const FullPostScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const postId = route.params?.postId;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}`);
      // const data = await response.json();
      
      // Mock data for now
      setPost({
        id: postId,
        title: 'Finding peace in uncertain times',
        content: 'I\'ve been struggling with anxiety lately, especially with all the changes happening. How do you all find peace when things feel out of control? Looking for practical strategies.',
        author: {
          id: 'user-123',
          name: 'Sarah Mitchell',
          bio: 'Wellness journey seeker',
        },
        category: 'Reflection',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        reactions_count: 24,
        comments_count: 12,
      });

      // Mock comments
      setComments([
        {
          id: 'c1',
          author: { id: 'u1', name: 'Alex Chen' },
          content: 'Breathing exercises have been a game changer for me. Try the 4-7-8 technique.',
          created_at: new Date(Date.now() - 3000000).toISOString(),
          depth: 0,
          reactions: [{ emoji: '❤️', count: 5 }],
          replies: [
            {
              id: 'c1-1',
              author: { id: 'u2', name: 'Emma Davis' },
              content: 'What\'s the 4-7-8 technique?',
              created_at: new Date(Date.now() - 2700000).toISOString(),
              depth: 1,
              parent_comment_id: 'c1',
            },
          ],
        },
      ]);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    // TODO: Implement reply submission
    console.log('Reply to', parentId, ':', content);
  };

  const handleReact = (commentId: string, emoji: string) => {
    // TODO: Implement reaction
    console.log('React to', commentId, 'with', emoji);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // TODO: Submit top-level comment
      console.log('New comment:', commentText);
      setCommentText('');
      setShowCommentInput(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B9D83" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Post content */}
        <View style={styles.postContainer}>
          {/* Author card */}
          <View style={styles.authorCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.author.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.author.name}</Text>
              {post.author.bio && (
                <Text style={styles.authorBio}>{post.author.bio}</Text>
              )}
            </View>
          </View>

          {/* Category and timestamp */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: CATEGORY_COLORS[post.category] || '#999' },
              ]}
            >
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(post.created_at)}</Text>
          </View>

          {/* Post title and content */}
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.content}>{post.content}</Text>

          {/* Reactions */}
          <View style={styles.reactionsRow}>
            <TouchableOpacity style={styles.reactionButton}>
              <Ionicons name="heart-outline" size={20} color="#666" />
              <Text style={styles.reactionCount}>{post.reactions_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.reactionCount}>{post.comments_count}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Comments section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            {comments.length === 0
              ? 'No comments yet'
              : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
          </Text>

          <ThreadedCommentList
            comments={comments}
            onReply={handleReply}
            onReact={handleReact}
          />
        </View>
      </ScrollView>

      {/* Floating compose button */}
      {!showCommentInput && (
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setShowCommentInput(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Comment input */}
      {showCommentInput && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your thoughts..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
            autoFocus
          />
          <View style={styles.commentActions}>
            <TouchableOpacity
              onPress={() => {
                setShowCommentInput(false);
                setCommentText('');
              }}
            >
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!commentText.trim() || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleCommentSubmit}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  postContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B9D83',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E2E',
  },
  authorBio: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E2E',
    marginBottom: 12,
    lineHeight: 30,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 8,
    backgroundColor: '#F0F0E8',
  },
  commentsSection: {
    backgroundColor: '#fff',
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E2E',
    marginBottom: 16,
  },
  composeButton: {
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
  commentInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  commentInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    maxHeight: 150,
    color: '#333',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    fontSize: 15,
    color: '#666',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  submitButton: {
    backgroundColor: '#8B9D83',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
