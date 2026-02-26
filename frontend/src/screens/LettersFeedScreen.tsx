import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { communityAPI } from '../services/api/communityAPI';
import { agentAPI } from '../services/api/agentAPI';
import { CommunityPost, PostCategory } from '../types';
import { PostCard } from '../components/community/PostCard';

interface LettersFeedScreenProps {
  navigation: any;
}

export const LettersFeedScreen: React.FC<LettersFeedScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<PostCategory[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadPosts(), loadCategories()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await communityAPI.getPosts({
        limit: 50,
        offset: 0,
      });

      // Sort by most recent
      const sortedPosts = [...data].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { categoriesAPI } = await import('../services/api/categoriesAPI');
      const data = await categoriesAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleComment = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      const category = categories.find((c) => c.id === post.category);
      navigation.navigate('Comments', { post, category });
    }
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading letters...</Text>
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
              colors={['#7C3AED', '#D946EF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerOrb}
            />
            <View>
              <Text style={styles.headerTitle}>Community Letters</Text>
              <Text style={styles.headerSubtitle}>
                Share your journey, lift each other
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.newPostButton}
            onPress={handleCreatePost}
            activeOpacity={0.8}
          >
            <Text style={styles.newPostIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <LinearGradient
            colors={['#F3E8FF', '#FFF7ED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <Text style={styles.bannerEmoji}>✨</Text>
            <Text style={styles.bannerTitle}>Welcome to the Circle</Text>
            <Text style={styles.bannerText}>
              A space for authentic sharing, growth, and community support. Our AI
              guides are here too!
            </Text>
          </LinearGradient>
        </View>

        {/* Posts Feed */}
        <View style={styles.feedContainer}>
          <Text style={styles.sectionTitle}>Recent Letters</Text>

          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💌</Text>
              <Text style={styles.emptyTitle}>No letters yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share something with the community
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreatePost}
              >
                <Text style={styles.emptyButtonText}>Write a Letter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            posts.map((post) => {
              const category = categories.find((c) => c.id === post.category);
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
        </View>
      </ScrollView>
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
  },
  loadingText: {
    fontFamily: 'System',
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
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 0.5,
    color: '#2D2D2D',
  },
  headerSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 2,
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
  welcomeBanner: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  bannerTitle: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '300',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 20,
  },
  feedContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.lavender,
    marginBottom: 16,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '300',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  emptyButtonText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
