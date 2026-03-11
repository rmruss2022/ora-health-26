import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { communityAPI } from '../services/api/communityAPI';
import { categoriesAPI } from '../services/api/categoriesAPI';
import { inboxAPI } from '../services/api/inboxAPI';
import { CommunityPost, PostCategory, InboxMessage } from '../types';
import { PostCard } from '../components/community/PostCard';
import { CategoryFilter } from '../components/community/CategoryFilter';
import { FloatingAuraAgent } from '../components/FloatingAuraAgent';
import { useAuth } from '../context/AuthContext';

interface CommunityScreenProps {
  navigation: any;
}

const FALLBACK_LETTERS: InboxMessage[] = [
  {
    id: 'fallback-letter-1',
    userId: 'demo-user',
    messageType: 'encouragement',
    subject: 'A gentle reminder',
    content: 'Small acts done consistently can shift your whole week. Keep showing up for yourself.',
    isRead: false,
    isArchived: false,
    timestamp: '2h ago',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-letter-2',
    userId: 'demo-user',
    messageType: 'insight',
    subject: 'Community insight',
    content: 'Most members who complete 5-minute sessions report feeling calmer by day three.',
    isRead: true,
    isArchived: false,
    timestamp: 'Yesterday',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-letter-3',
    userId: 'demo-user',
    messageType: 'community_highlight',
    subject: 'From the circle',
    content: '“I no longer wait for motivation. I just begin with one mindful breath.”',
    isRead: true,
    isArchived: false,
    timestamp: '3d ago',
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_CATEGORIES: PostCategory[] = [
  { id: 'reflection', name: 'Reflection', description: 'Reflective conversations', icon: '💭', color: '#7C3AED', displayOrder: 1 },
  { id: 'growth', name: 'Growth', description: 'Growth milestones', icon: '🌱', color: '#16A34A', displayOrder: 2 },
  { id: 'wellness', name: 'Wellness', description: 'Well-being and balance', icon: '💚', color: '#0D9488', displayOrder: 3 },
  { id: 'support', name: 'Support', description: 'Community support', icon: '🤝', color: '#DB2777', displayOrder: 4 },
  { id: 'gratitude', name: 'Gratitude', description: 'Gratitude moments', icon: '🙏', color: '#2563EB', displayOrder: 5 },
];

const FALLBACK_POSTS: CommunityPost[] = [
  {
    id: 'fallback-post-1',
    userId: 'demo-user-1',
    author: { name: 'Kai', avatar: 'K', isAnonymous: true },
    type: 'progress',
    category: 'growth',
    content: 'Finished 7 straight days of short evening sessions. The consistency is finally clicking.',
    tags: ['streak', 'evening'],
    likes: 18,
    comments: 6,
    timestamp: '1h ago',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-post-2',
    userId: 'demo-user-2',
    author: { name: 'Mira', avatar: 'M', isAnonymous: true },
    type: 'support',
    category: 'support',
    content: 'If anyone feels scattered today, try 10 box breaths before opening messages. It helped me reset.',
    tags: ['support', 'breathwork'],
    likes: 27,
    comments: 12,
    timestamp: '3h ago',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-post-3',
    userId: 'demo-user-3',
    author: { name: 'Noah', avatar: 'N', isAnonymous: true },
    type: 'gratitude',
    category: 'gratitude',
    content: 'Grateful for this space. Showing up for five minutes this morning changed my whole mood.',
    tags: ['gratitude', 'morning'],
    likes: 21,
    comments: 5,
    timestamp: 'Yesterday',
    createdAt: new Date().toISOString(),
  },
];

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [letters, setLetters] = useState<InboxMessage[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadLetters();
    loadCategories();
    setPostsPage(0);
    loadPosts(0);
  }, [selectedCategory]);

  const loadLetters = async () => {
    try {
      const result = await inboxAPI.getDailyLetters();
      setLetters(result.messages.length > 0 ? result.messages : FALLBACK_LETTERS);
    } catch (error) {
      console.error('Error loading letters:', error);
      try {
        const fallback = await inboxAPI.getMessages(false, 10, 0);
        setLetters(fallback.messages.length > 0 ? fallback.messages : FALLBACK_LETTERS);
      } catch {
        setLetters(FALLBACK_LETTERS);
      }
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getCategories();
      setCategories(data.length > 0 ? data : FALLBACK_CATEGORIES);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(FALLBACK_CATEGORIES);
    }
  };

  const loadPosts = async (page: number = 0) => {
    try {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);

      const data = await communityAPI.getPosts({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        category: selectedCategory || undefined,
      });
      const sortedPage = [...data].sort((a, b) => {
        if ((b.comments || 0) !== (a.comments || 0)) {
          return (b.comments || 0) - (a.comments || 0);
        }
        return (b.likes || 0) - (a.likes || 0);
      });

      const fallbackForCategory = selectedCategory
        ? FALLBACK_POSTS.filter((post) => post.category === selectedCategory)
        : FALLBACK_POSTS;

      if (page === 0) {
        setPosts(sortedPage.length > 0 ? sortedPage : fallbackForCategory);
      } else {
        setPosts((prev) => [...prev, ...sortedPage]);
      }
      setHasMorePosts(sortedPage.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading posts:', error);
      if (page === 0) {
        const fallbackForCategory = selectedCategory
          ? FALLBACK_POSTS.filter((post) => post.category === selectedCategory)
          : FALLBACK_POSTS;
        setPosts(fallbackForCategory);
      }
      setHasMorePosts(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = postsPage + 1;
    setPostsPage(nextPage);
    loadPosts(nextPage);
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <LinearGradient
              colors={['#D4B8E8', '#F8C8DC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerOrb}
            />
            <View>
              <Text style={styles.headerTitle}>Ora Club Community</Text>
              <Text style={styles.headerSubtitle}>Share your journey, lift each other</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>Sign out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newPostButton}
              onPress={() => navigation.navigate('CreatePost')}
              activeOpacity={0.8}
            >
              <Text style={styles.newPostIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          <Text style={styles.circleTitle}>Letters</Text>
          <TouchableOpacity
            style={styles.letterEntryCard}
            onPress={() => navigation.navigate('LetterInboxList')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1d473e', '#2d5e52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.letterGradient}
            >
              <Image
                source={require('../../assets/icons/letter-sealed.jpg')}
                style={styles.letterEnvelopeIcon}
                resizeMode="contain"
              />
              <Text style={styles.letterSubject}>
                {letters.length > 0 ? letters.find(l => !l.isRead)?.subject || letters[0]?.subject || 'Letters from the circle' : 'Letters from the circle'}
              </Text>
              <Text style={styles.letterHint}>Read and respond</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.promptBanner} activeOpacity={0.8}>
            <View style={styles.promptIconContainer}>
              <Text style={styles.promptIcon}>✨</Text>
            </View>
            <View style={styles.promptContent}>
              <Text style={styles.promptLabel}>Write something</Text>
              <Text style={styles.promptText}>What small habit has made a big impact?</Text>
            </View>
            <Text style={styles.promptArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.circleTitle}>Community Conversations</Text>
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
            <>
              {posts.map((post) => {
                const category = categories.find(c => c.id === post.category);
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    category={category}
                    onPress={() => handleComment(post.id)}
                  />
                );
              })}

              {/* Load more */}
              {hasMorePosts && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  activeOpacity={0.75}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={theme.colors.lavender} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Write post CTA */}
              <TouchableOpacity
                style={styles.writePostCTA}
                onPress={() => navigation.navigate('CreatePost')}
                activeOpacity={0.8}
              >
                <Text style={styles.writePostIcon}>✏️</Text>
                <Text style={styles.writePostText}>Write post</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <FloatingAuraAgent context="community" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F3',
  },
  loadingText: {
    fontFamily: 'Switzer-Regular',
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 16,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FAF8F3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'Sentient-Light',
    fontSize: 28,
    letterSpacing: 0.3,
    color: '#2D2D2D',
  },
  headerSubtitle: {
    fontFamily: 'Switzer-Regular',
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.45)',
    backgroundColor: 'transparent',
  },
  logoutText: {
    fontFamily: 'Switzer-Regular',
    fontSize: 13,
    color: '#8A8A8A',
  },
  newPostButton: {
    minWidth: 68,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  newPostIcon: {
    fontSize: 22,
    color: '#1d473e',
    fontWeight: '300',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    borderRadius: 20,
    padding: 0,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  letterGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 24,
    borderRadius: 20,
  },
  circleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.lavender,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  letterEntryCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 0,
    marginBottom: 10,
  },
  letterHint: {
    fontFamily: 'Switzer-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  letterEnvelopeIcon: {
    width: 80,
    height: 80,
    borderRadius: 14,
    marginBottom: 16,
    opacity: 0.95,
  },
  letterSubject: {
    fontFamily: 'Sentient-LightItalic',
    fontSize: 17,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(212,184,232,0.45)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  promptIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4B8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promptIcon: {
    fontSize: 20,
  },
  promptContent: {
    flex: 1,
  },
  promptLabel: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#1d473e',
    marginBottom: 2,
  },
  promptText: {
    fontFamily: 'Sentient-Light',
    fontSize: 15,
    color: '#2D2D2D',
    lineHeight: 21,
  },
  promptArrow: {
    fontSize: 24,
    color: '#1d473e',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Sentient-Light',
    fontSize: 22,
    color: '#2D2D2D',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Switzer-Regular',
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#1d473e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyButtonText: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loadMoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.35)',
    borderRadius: 14,
    marginBottom: 12,
  },
  loadMoreText: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 14,
    color: theme.colors.lavender,
    letterSpacing: 0.2,
  },
  writePostCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d473e',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  writePostIcon: {
    fontSize: 16,
  },
  writePostText: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
