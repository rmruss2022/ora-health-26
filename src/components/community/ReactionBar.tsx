import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { theme } from '../../theme';
import { reactionsApi } from '../../services/reactions.service';

const EMOJIS = ['❤️', '👍', '🤗', '💡', '🔥'] as const;
type EmojiType = typeof EMOJIS[number];

interface ReactionCounts {
  '❤️': number;
  '👍': number;
  '🤗': number;
  '💡': number;
  '🔥': number;
}

interface ReactionSummary {
  counts: ReactionCounts;
  userReactions: string[];
  total: number;
}

interface ReactionBarProps {
  targetId: string;
  targetType: 'post' | 'comment';
  userId: string;
  initialData?: ReactionSummary;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({
  targetId,
  targetType,
  userId,
  initialData,
}) => {
  const [reactions, setReactions] = useState<ReactionSummary>(
    initialData || {
      counts: { '❤️': 0, '👍': 0, '🤗': 0, '💡': 0, '🔥': 0 },
      userReactions: [],
      total: 0,
    }
  );
  const [showPicker, setShowPicker] = useState(false);
  const [pickerScale] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  // Load reactions on mount
  useEffect(() => {
    if (!initialData) {
      loadReactions();
    }
  }, [targetId]);

  const loadReactions = async () => {
    try {
      const summary = await reactionsApi.getReactions(targetId, userId);
      setReactions(summary);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const handleReactionPress = async (emoji: EmojiType) => {
    if (loading) return;

    const isUserReaction = reactions.userReactions.includes(emoji);
    
    // Optimistic update
    const newReactions = { ...reactions };
    if (isUserReaction) {
      newReactions.counts[emoji]--;
      newReactions.userReactions = newReactions.userReactions.filter(
        (e) => e !== emoji
      );
      newReactions.total--;
    } else {
      newReactions.counts[emoji]++;
      newReactions.userReactions = [...newReactions.userReactions, emoji];
      newReactions.total++;
    }
    setReactions(newReactions);

    // API call
    setLoading(true);
    try {
      if (isUserReaction) {
        await reactionsApi.removeReaction(userId, targetId, emoji);
      } else {
        await reactionsApi.addReaction(userId, targetId, targetType, emoji);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Revert on error
      setReactions(reactions);
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = () => {
    setShowPicker(true);
    Animated.spring(pickerScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const closePicker = () => {
    Animated.timing(pickerScale, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowPicker(false));
  };

  const handlePickerSelect = (emoji: EmojiType) => {
    closePicker();
    handleReactionPress(emoji);
  };

  // Get top 3 reactions to display
  const topReactions = EMOJIS.filter((emoji) => reactions.counts[emoji] > 0)
    .sort((a, b) => reactions.counts[b] - reactions.counts[a])
    .slice(0, 3);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleLongPress()}
          onLongPress={handleLongPress}
          delayLongPress={300}
          activeOpacity={0.7}
        >
          <Text style={styles.addIcon}>😊</Text>
          <Text style={styles.addText}>React</Text>
        </TouchableOpacity>

        {topReactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {topReactions.map((emoji) => {
              const count = reactions.counts[emoji];
              const isUserReaction = reactions.userReactions.includes(emoji);

              return (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionButton,
                    isUserReaction && styles.reactionButtonActive,
                  ]}
                  onPress={() => handleReactionPress(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text
                    style={[
                      styles.reactionCount,
                      isUserReaction && styles.reactionCountActive,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="none"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Animated.View
            style={[
              styles.pickerContainer,
              {
                transform: [{ scale: pickerScale }],
              },
            ]}
          >
            <Text style={styles.pickerTitle}>Choose a reaction</Text>
            <View style={styles.pickerEmojis}>
              {EMOJIS.map((emoji) => {
                const isUserReaction = reactions.userReactions.includes(emoji);
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.pickerButton,
                      isUserReaction && styles.pickerButtonActive,
                    ]}
                    onPress={() => handlePickerSelect(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerEmoji}>{emoji}</Text>
                    {reactions.counts[emoji] > 0 && (
                      <Text style={styles.pickerCount}>
                        {reactions.counts[emoji]}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  addIcon: {
    fontSize: 16,
  },
  addText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: theme.borderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionButtonActive: {
    backgroundColor: theme.colors.backgroundLight,
    borderColor: theme.colors.accent,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  reactionCountActive: {
    color: theme.colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    minWidth: 280,
    ...theme.shadows.lg,
  },
  pickerTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  pickerEmojis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.sm,
  },
  pickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerButtonActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.backgroundLight,
  },
  pickerEmoji: {
    fontSize: 24,
  },
  pickerCount: {
    ...theme.typography.labelSmall,
    color: theme.colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
});
