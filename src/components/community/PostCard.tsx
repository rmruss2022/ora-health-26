/**
 * PostCard Component (Redesigned)
 * Question-first layout with clean, modern design
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CommunityPost, PostCategory } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { getAuthorDisplayName, getAuthorAvatar } from '../../utils/anonymousAvatars';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  reflection: { bg: '#F3E8FF', text: '#7C3AED' },
  growth: { bg: '#DCFCE7', text: '#16A34A' },
  wellness: { bg: '#CCFBF1', text: '#0D9488' },
  gratitude: { bg: '#DBEAFE', text: '#2563EB' },
  support: { bg: '#FCE7F3', text: '#DB2777' },
  question: { bg: '#FED7AA', text: '#EA580C' },
};

interface PostCardProps {
  post: CommunityPost;
  category?: PostCategory;
  onPress: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  category,
  onPress,
}) => {
  const categoryStyle = category
    ? CATEGORY_COLORS[category.id.toLowerCase()] || CATEGORY_COLORS.question
    : CATEGORY_COLORS.question;

  // Format timestamp (e.g., "2h ago")
  const formatTimestamp = (timestamp: string | Date): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Post: ${post.content}`}
      accessibilityHint="Double tap to view full post and comments"
    >
      {/* Question/Post Content - Primary Focus */}
      <Text style={styles.questionText} numberOfLines={3}>
        {post.content}
      </Text>

      {/* Author Row */}
      <View style={styles.authorRow}>
        <View style={styles.authorAvatar}>
          <Text style={styles.avatarText}>
            {getAuthorAvatar(post.author.avatar, post.author.isAnonymous, post.id)}
          </Text>
        </View>
        <Text style={styles.authorName}>
          {getAuthorDisplayName(post.author.name, post.author.isAnonymous, post.id)}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(post.timestamp)}
        </Text>
      </View>

      {/* Category Badge & Stats Row */}
      <View style={styles.footer}>
        {/* Category Badge */}
        {category && (
          <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
            <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
              {category.name}
            </Text>
          </View>
        )}

        <View style={styles.spacer} />

        {/* Stats Row */}
        <View style={styles.stats}>
          {/* Comments Count */}
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text style={styles.statText}>{post.comments || 0}</Text>
          </View>

          {/* Reactions Count */}
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color="#6B7280" />
            <Text style={styles.statText}>{post.likes || 0}</Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.35)',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: 'System',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'System',
  },
  dot: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  timestamp: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'System',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  spacer: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  chevron: {
    marginLeft: 8,
  },
});
