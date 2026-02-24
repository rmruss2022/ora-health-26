import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import { communityAPI } from '../services/api/communityAPI';
import { CommunityPost, Comment, PostCategory } from '../types';
import { PostCard } from '../components/community/PostCard';
import { CommentCard } from '../components/community/CommentCard';
import { CommentInput } from '../components/community/CommentInput';
import { useAuth } from '../context/AuthContext';

interface CommentsScreenProps {
  route: {
    params: {
      post: CommunityPost;
      category?: PostCategory;
    };
  };
  navigation: any;
}

export const CommentsScreen: React.FC<CommentsScreenProps> = ({
  route,
  navigation,
}) => {
  const { user } = useAuth();
  const { post: initialPost, category } = route.params;
  const [post, setPost] = useState<CommunityPost>(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await communityAPI.getComments(post.id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComments();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await communityAPI.likePost(postId);
      setPost({
        ...post,
        likes: result.likesCount,
        isLiked: result.liked,
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (content: string, isAnonymous: boolean) => {
    try {
      const newComment = await communityAPI.createComment(post.id, {
        content,
        isAnonymous,
      });

      setComments([...comments, newComment]);

      // Update comment count on post
      setPost({
        ...post,
        comments: post.comments + 1,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discussion</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Original Post */}
        <View style={styles.postSection}>
          <PostCard
            post={post}
            category={category}
            userId={user?.id || ''}
            onLike={handleLike}
            onComment={() => {}} // No-op since we're already on comments screen
          />
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeader}>
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share your thoughts
              </Text>
            </View>
          ) : (
            comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} userId={user?.id || ''} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <CommentInput onSubmit={handleAddComment} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  postSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.backgroundLight,
  },
  commentsSection: {
    padding: theme.spacing.lg,
  },
  commentsHeader: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xxxl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
