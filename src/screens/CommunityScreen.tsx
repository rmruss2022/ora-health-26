import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { communityAPI } from '../services/api/communityAPI';
import { categoriesAPI } from '../services/api/categoriesAPI';
import { inboxAPI } from '../services/api/inboxAPI';
import { CommunityPost, PostCategory, InboxMessage } from '../types';
import { PostCard } from '../components/community/PostCard';
import { CategoryFilter } from '../components/community/CategoryFilter';
import { useAuth } from '../context/AuthContext';

const feedTabs = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'home', label: 'For You' },
  { id: 'letters', label: 'Letters' },
  { id: 'prompts', label: 'Prompts' },
];

const postTypeIcons: Record<string, string> = {
  progress: '🎯',
  prompt: '💭',
  resource: '📚',
  support: '🤝',
  gratitude: '💙',
};

const promptCategories = [
  { id: 'reflection', label: 'Reflection', icon: '🪞', color: '#E8D5FF' },
  { id: 'growth', label: 'Growth', icon: '🌱', color: '#D4F1E8' },
  { id: 'wellness', label: 'Wellness', icon: '💚', color: '#E3F4D7' },
  { id: 'creativity', label: 'Creativity', icon: '🎨', color: '#FFE8D5' },
  { id: 'connection', label: 'Connection', icon: '🤝', color: '#FFD5E8' },
  { id: 'gratitude', label: 'Gratitude', icon: '💙', color: '#D5E8FF' },
];

const communityPrompts = [
  {
    id: '1',
    category: 'reflection',
    text: 'What small habit has made a big impact on your life?',
    responseCount: 47,
    isActive: true,
  },
  {
    id: '2',
    category: 'growth',
    text: 'Share a challenge you overcame recently and what you learned',
    responseCount: 32,
    isActive: true,
  },
  {
    id: '3',
    category: 'wellness',
    text: 'What does self-care look like for you today?',
    responseCount: 28,
    isActive: true,
  },
  {
    id: '4',
    category: 'creativity',
    text: 'Describe a moment when you felt truly creative',
    responseCount: 19,
    isActive: false,
  },
  {
    id: '5',
    category: 'connection',
    text: 'How has someone in your life positively influenced you?',
    responseCount: 53,
    isActive: true,
  },
  {
    id: '6',
    category: 'gratitude',
    text: 'Name three things you are grateful for this week',
    responseCount: 61,
    isActive: true,
  },
  {
    id: '7',
    category: 'reflection',
    text: 'What would you tell your younger self?',
    responseCount: 44,
    isActive: false,
  },
  {
    id: '8',
    category: 'growth',
    text: 'What skill or habit are you working on developing?',
    responseCount: 35,
    isActive: true,
  },
];

interface CommunityScreenProps {
  navigation: any;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [letters, setLetters] = useState<InboxMessage[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLetters();
    loadCategories();
    loadPosts();
  }, [selectedCategory]);

  const loadLetters = async () => {
    try {
      const result = await inboxAPI.getMessages(false, 4, 0);
      setLetters(result.messages);
    } catch (error) {
      console.error('Error loading letters:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await communityAPI.getPosts({
        limit: 20,
        offset: 0,
        category: selectedCategory || undefined,
      });
      const sortedPosts = [...data].sort((a, b) => {
        if ((b.comments || 0) !== (a.comments || 0)) {
          return (b.comments || 0) - (a.comments || 0);
        }
        return (b.likes || 0) - (a.likes || 0);
      });
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      const category = categories.find(c => c.id === post.category);
      navigation.navigate('Comments', { post, category });
    }
  };

  const handleCategorySelect = (categoryId: string | 'all') => {
    setSelectedCategory(categoryId === 'all' ? null : categoryId);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Community</Text>
          <View style={styles.headerMedallion}>
            <View style={styles.headerMedallionInner}>
              <Text style={styles.headerMedallionGlyph}>◉</Text>
            </View>
            <View style={styles.headerMedallionOrbit} />
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Share your journey, support others</Text>
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.newPostButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.newPostIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Letters</Text>
        {letters.length === 0 ? (
          <View style={styles.emptyInlineCard}>
            <Text style={styles.emptyInlineText}>No letters yet. New reflections will appear here.</Text>
          </View>
        ) : (
          letters.map((message) => (
            <View key={message.id} style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <Text style={styles.letterSubject}>{message.subject || 'Letter'}</Text>
                <Text style={styles.letterTime}>{message.timestamp}</Text>
              </View>
              <Text style={styles.letterBody} numberOfLines={3}>
                {message.content}
              </Text>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.promptBanner} activeOpacity={0.8}>
          <View style={styles.promptIconContainer}>
            <Text style={styles.promptIcon}>✨</Text>
          </View>
          <View style={styles.promptContent}>
            <Text style={styles.promptLabel}>This Week's Prompt</Text>
            <Text style={styles.promptText}>What small habit has made a big impact?</Text>
          </View>
          <Text style={styles.promptArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Community Conversations</Text>
        <CategoryFilter
          selectedCategory={selectedCategory as any}
          onSelectCategory={handleCategorySelect}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤝</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share your journey with the community
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Text style={styles.emptyButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => {
            const category = categories.find(c => c.id === post.category);
            return (
              <PostCard
                key={post.id}
                post={post}
                category={category}
                onPress={() => handleComment(post.id)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECECEC',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  header: {
    backgroundColor: '#D2CCAB',
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerMedallion: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6E1C5',
    borderWidth: 1,
    borderColor: '#A9AD84',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#4A4A3A',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerMedallionInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1EEDC',
    borderWidth: 1,
    borderColor: '#B9BD98',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMedallionGlyph: {
    fontSize: 12,
    color: '#5F6A52',
  },
  headerMedallionOrbit: {
    position: 'absolute',
    right: -2,
    top: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7D8568',
    borderWidth: 1,
    borderColor: '#E6E1C5',
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#F6F5F1',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D1C5',
  },
  newPostButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#5C6C57',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  newPostIcon: {
    fontSize: 24,
    color: theme.colors.white,
    fontWeight: '300',
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE6D0',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#D2C78F',
  },
  promptIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  promptIcon: {
    fontSize: 20,
  },
  promptContent: {
    flex: 1,
  },
  promptLabel: {
    ...theme.typography.tiny,
    fontWeight: '600',
    color: '#5C542E',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  promptText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  promptArrow: {
    fontSize: 24,
    color: '#70693B',
    marginLeft: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  letterCard: {
    backgroundColor: '#F7F5EE',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#D8D3C8',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  letterSubject: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  letterTime: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
  },
  letterBody: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyInlineCard: {
    backgroundColor: '#F7F5EE',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#D8D3C8',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyInlineText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
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
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    backgroundColor: '#5C6C57',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  emptyButtonText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxxl,
  },
  placeholderText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  // Prompts Tab Styles
  promptsTabContainer: {
    flex: 1,
  },
  promptCategoriesScroll: {
    backgroundColor: '#F6F5F1',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexGrow: 0,
    maxHeight: 64,
  },
  promptCategoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  promptCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    marginRight: theme.spacing.xs,
    gap: 6,
  },
  promptCategoryChipActive: {
    backgroundColor: '#606A4A',
  },
  promptCategoryChipIcon: {
    fontSize: 16,
  },
  promptCategoryChipText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  promptCategoryChipTextActive: {
    color: theme.colors.textLight,
  },
  promptsListScroll: {
    flex: 1,
  },
  promptCard: {
    backgroundColor: '#F7F5EE',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: '#D8D3C8',
  },
  promptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  promptCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  promptCategoryBadgeIcon: {
    fontSize: 14,
  },
  promptCategoryBadgeText: {
    ...theme.typography.small,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  activePromptBadge: {
    backgroundColor: '#7B845F',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  activePromptBadgeText: {
    ...theme.typography.tiny,
    fontWeight: '700',
    color: theme.colors.textLight,
    textTransform: 'uppercase',
  },
  promptCardText: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  promptCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  promptResponseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promptResponseIcon: {
    fontSize: 16,
  },
  promptResponseCountText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  promptCardArrow: {
    fontSize: 20,
    color: theme.colors.textTertiary,
  },
  // Legacy styles kept for reference, now using PostCard component
  postCard: {
    backgroundColor: '#F7F5EE',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: '#D8D3C8',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: 20,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorName: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
  },
  postType: {
    fontSize: 16,
  },
  timestamp: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  promptContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  promptContextIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  promptContextText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  postContent: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.backgroundGray,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actionTextActive: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  lettersContainer: {
    padding: theme.spacing.lg,
  },
  lettersTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  lettersSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
});
