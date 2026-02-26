import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { theme } from '../../theme';

interface CommentInputProps {
  onSubmit: (content: string, isAnonymous: boolean) => Promise<void>;
  placeholder?: string;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = 'Add a thoughtful comment...',
}) => {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [height, setHeight] = useState(40);

  const characterLimit = 500;
  const remainingChars = characterLimit - content.length;

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content, isAnonymous);
      setContent('');
      setIsAnonymous(false);
      setHeight(40);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { height: Math.min(Math.max(height, 40), 120) }]}
          value={content}
          onChangeText={setContent}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={characterLimit}
          onContentSizeChange={(event) => {
            setHeight(event.nativeEvent.contentSize.height);
          }}
        />

        <View style={styles.footer}>
          <View style={styles.leftFooter}>
            <View style={styles.anonymousToggle}>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{
                  false: theme.colors.lightGrey,
                  true: theme.colors.accent,
                }}
                thumbColor={theme.colors.white}
                style={styles.switch}
              />
              <Text style={styles.anonymousLabel}>Anonymous</Text>
            </View>

            <Text
              style={[
                styles.characterCount,
                remainingChars < 50 && styles.characterCountWarning,
              ]}
            >
              {remainingChars}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!content.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  inputContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    padding: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  leftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  anonymousLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  characterCount: {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
  },
  characterCountWarning: {
    color: theme.colors.warning,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.lightGrey,
  },
  submitButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
