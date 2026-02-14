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
import { communityAPI } from '../services/api';
import { categoriesAPI } from '../services/api';
import { CommunityPost, PostCategory } from '../types';
import { PostCard } from '../components/community/PostCard';
import { CategoryFilter } from '../components/community/CategoryFilter';
import { InboxTabContent } from '../components/community/InboxTabContent';
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
  const [activeTab, setActiveTab] = useState<string>('inbox');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadCategories();
    if (activeTab === 'home') {
      loadPosts();
    }
  }, [activeTab, selectedCategory]);

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
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await communityAPI.likePost(postId);

      // Update local state
      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: result.likesCount,
              isLiked: result.liked,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      const category = categories.find(c => c.id === post.category);
      navigation.navigate('Comments', { post, category });
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
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
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>
          Share your journey, support others
        </Text>
      </View>

      {/* Tabs + New Post Button */}
      <View style={styles.tabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {feedTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive,
                ]}
              >
                {tab.label}
                {tab.id === 'inbox' && unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.newPostButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.newPostIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Inbox Tab Content */}
      {activeTab === 'inbox' && (
        <InboxTabContent onUnreadCountChange={setUnreadCount} />
      )}

      {/* For You Tab Content */}
      {activeTab === 'home' && (
        <>
          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />

          {/* Current Prompt */}
          <TouchableOpacity style={styles.promptBanner} activeOpacity={0.8}>
            <View style={styles.promptIconContainer}>
              <Text style={styles.promptIcon}>✨</Text>
            </View>
            <View style={styles.promptContent}>
              <Text style={styles.promptLabel}>This Week's Prompt</Text>
              <Text style={styles.promptText}>
                What small habit has made a big impact?
              </Text>
            </View>
            <Text style={styles.promptArrow}>→</Text>
          </TouchableOpacity>

          {/* Posts Feed */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {posts.length === 0 ? (
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
                      userId={user?.id || ''}
                      onLike={handleLike}
                      onComment={handleComment}
                    />
                  );
                })
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* Letters Tab */}
      {activeTab === 'letters' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.lettersContainer}>
            <Text style={styles.lettersTitle}>Your Letters</Text>
            <Text style={styles.lettersSubtitle}>
              Thoughtful messages from your past self and the community
            </Text>

            {/* Coming Soon State (replace with actual letters later) */}
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💌</Text>
              <Text style={styles.emptyTitle}>No letters yet</Text>
              <Text style={styles.emptyText}>
                Letters will appear here when you receive them from your journey or the community
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Prompts Tab */}
      {activeTab === 'prompts' && (
        <>
          {/* Category Filter for Prompts */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptCategoriesScroll}
            contentContainerStyle={styles.promptCategoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.promptCategoryChip,
                selectedPromptCategory === null && styles.promptCategoryChipActive,
              ]}
              onPress={() => setSelectedPromptCategory(null)}
            >
              <Text
                style={[
                  styles.promptCategoryChipText,
                  selectedPromptCategory === null && styles.promptCategoryChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {promptCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.promptCategoryChip,
                  selectedPromptCategory === cat.id && styles.promptCategoryChipActive,
                  { backgroundColor: selectedPromptCategory === cat.id ? cat.color : theme.colors.backgroundLight },
                ]}
                onPress={() => setSelectedPromptCategory(cat.id)}
              >
                <Text style={styles.promptCategoryChipIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.promptCategoryChipText,
                    selectedPromptCategory === cat.id && styles.promptCategoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Prompts List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {communityPrompts
              .filter((prompt) => !selectedPromptCategory || prompt.category === selectedPromptCategory)
              .map((prompt) => {
                const category = promptCategories.find((c) => c.id === prompt.category);
                return (
                  <TouchableOpacity
                    key={prompt.id}
                    style={styles.promptCard}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('PromptResponses', { prompt, category })}
                  >
                    <View style={styles.promptCardHeader}>
                      <View
                        style={[
                          styles.promptCategoryBadge,
                          { backgroundColor: category?.color || theme.colors.backgroundLight },
                        ]}
                      >
                        <Text style={styles.promptCategoryBadgeIcon}>{category?.icon}</Text>
                        <Text style={styles.promptCategoryBadgeText}>{category?.label}</Text>
                      </View>
                      {prompt.isActive && (
                        <View style={styles.activePromptBadge}>
                          <Text style={styles.activePromptBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.promptCardText}>{prompt.text}</Text>
                    <View style={styles.promptCardFooter}>
                      <View style={styles.promptResponseCount}>
                        <Text style={styles.promptResponseIcon}>💬</Text>
                        <Text style={styles.promptResponseCountText}>
                          {prompt.responseCount} {prompt.responseCount === 1 ? 'response' : 'responses'}
                        </Text>
                      </View>
                      <Text style={styles.promptCardArrow}>→</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
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
    backgroundColor: theme.colors.cream,
    paddingTop: 60,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  tabLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.textLight,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeText: {
    ...theme.typography.tiny,
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: '700',
  },
  newPostButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
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
    backgroundColor: theme.colors.goldenLightest,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.goldenLight,
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
    color: theme.colors.golden,
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
    color: theme.colors.golden,
    marginLeft: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
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
    backgroundColor: theme.colors.charcoal,
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
  promptCategoriesScroll: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  promptCategoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
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
    backgroundColor: theme.colors.charcoal,
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
  promptCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.accent,
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
