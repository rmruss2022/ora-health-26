import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import { communityAPI } from '../services/api/communityAPI';
import { categoriesAPI } from '../services/api/categoriesAPI';
import { PostCategory } from '../types';

interface CreatePostScreenProps {
  navigation: any;
  route?: {
    params?: {
      promptText?: string;
      selectedCategory?: string;
    };
  };
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  navigation,
  route,
}) => {
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    route?.params?.selectedCategory || null
  );
  const [content, setContent] = useState('');
  const [promptText] = useState(route?.params?.promptText || '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const characterLimit = 1000;
  const remainingChars = characterLimit - content.length;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!content.trim() || !selectedCategory || isSubmitting) return;

    try {
      setIsSubmitting(true);

      await communityAPI.createPost({
        content: content.trim(),
        type: selectedCategory,
        category: selectedCategory,
        tags,
        isAnonymous,
        promptText: promptText || undefined,
      });

      // Navigate back to community
      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = content.trim().length > 0 && selectedCategory !== null && !isSubmitting;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, !canSubmit && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prompt Context (if applicable) */}
        {promptText && (
          <View style={styles.promptContext}>
            <Text style={styles.promptContextLabel}>Responding to prompt:</Text>
            <Text style={styles.promptContextText}>{promptText}</Text>
          </View>
        )}

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPill,
                    isSelected && {
                      backgroundColor: category.color,
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryIcon, isSelected && styles.categoryIconSelected]}>
                    {category.icon}
                  </Text>
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected ? styles.categoryTextSelected : { color: category.color },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Your Thoughts <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Share your story, progress, or ask for support..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={characterLimit}
            textAlignVertical="top"
          />
          <Text
            style={[
              styles.characterCount,
              remainingChars < 100 && styles.characterCountWarning,
            ]}
          >
            {remainingChars} characters remaining
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tags (optional)</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag..."
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={20}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addTagButton, !tagInput.trim() && styles.addTagButtonDisabled]}
              onPress={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 5}
            >
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tag}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={styles.helperText}>
            {tags.length}/5 tags • Tap a tag to remove it
          </Text>
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Post anonymously</Text>
              <Text style={styles.toggleDescription}>
                Your name won't be shown on this post
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{
                false: theme.colors.lightGrey,
                true: theme.colors.accent,
              }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Community Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Be kind and supportive{'\n'}
            • Share authentically{'\n'}
            • Respect privacy{'\n'}
            • No harmful content
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  cancelButton: {
    paddingVertical: theme.spacing.xs,
  },
  cancelText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  postButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: theme.colors.lightGrey,
  },
  postButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  promptContext: {
    backgroundColor: theme.colors.goldenLightest,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.goldenLight,
  },
  promptContextLabel: {
    ...theme.typography.tiny,
    fontWeight: '700',
    color: theme.colors.golden,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  promptContextText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryIconSelected: {
    opacity: 1,
  },
  categoryText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: theme.colors.white,
  },
  contentInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    minHeight: 150,
    maxHeight: 300,
  },
  characterCount: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },
  characterCountWarning: {
    color: theme.colors.warning,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  addTagButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: theme.colors.lightGrey,
  },
  addTagButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundGray,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  tagText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  tagRemove: {
    ...theme.typography.body,
    fontSize: 18,
    color: theme.colors.textTertiary,
  },
  helperText: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  toggleLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  toggleDescription: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  guidelines: {
    backgroundColor: theme.colors.infoLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.info,
    marginTop: theme.spacing.md,
  },
  guidelinesTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  guidelinesText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
