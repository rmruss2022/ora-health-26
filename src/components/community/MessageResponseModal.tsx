import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { InboxMessage } from '../../types';
import { theme } from '../../theme';

interface MessageResponseModalProps {
  visible: boolean;
  message: InboxMessage | null;
  onClose: () => void;
  onSubmit: (responseText: string, createPost: boolean, isAnonymous: boolean) => Promise<void>;
}

export const MessageResponseModal: React.FC<MessageResponseModalProps> = ({
  visible,
  message,
  onClose,
  onSubmit,
}) => {
  const [responseText, setResponseText] = useState('');
  const [createPost, setCreatePost] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterLimit = 500;
  const remainingChars = characterLimit - responseText.length;

  const handleSubmit = async () => {
    if (!responseText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(responseText, createPost, isAnonymous);

      // Reset state and close
      setResponseText('');
      setCreatePost(false);
      setIsAnonymous(false);
      onClose();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setResponseText('');
      setCreatePost(false);
      setIsAnonymous(false);
      onClose();
    }
  };

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isSubmitting}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Respond to Message</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Original Message */}
          <View style={styles.messageContainer}>
            {message.subject && (
              <Text style={styles.messageSubject}>{message.subject}</Text>
            )}
            <Text style={styles.messageContent}>{message.content}</Text>
          </View>

          {/* Response Input */}
          <View style={styles.responseSection}>
            <Text style={styles.sectionLabel}>Your Response</Text>
            <TextInput
              style={styles.textInput}
              value={responseText}
              onChangeText={setResponseText}
              placeholder="Share your thoughts..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={characterLimit}
              textAlignVertical="top"
            />
            <Text
              style={[
                styles.characterCount,
                remainingChars < 50 && styles.characterCountWarning,
              ]}
            >
              {remainingChars} characters remaining
            </Text>
          </View>

          {/* Share as Post Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Share as post to community</Text>
              <Text style={styles.toggleDescription}>
                Make your response visible to others
              </Text>
            </View>
            <Switch
              value={createPost}
              onValueChange={setCreatePost}
              trackColor={{
                false: theme.colors.lightGrey,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.white}
            />
          </View>

          {/* Anonymous Toggle (only if sharing) */}
          {createPost && (
            <View style={styles.toggleSection}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Post anonymously</Text>
                <Text style={styles.toggleDescription}>
                  Your name won't be shown on the post
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
          )}
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!responseText.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!responseText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {createPost ? 'Post Response' : 'Submit Response'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  messageContainer: {
    backgroundColor: theme.colors.accentLightest,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accentLight,
  },
  messageSubject: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  messageContent: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  responseSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    minHeight: 120,
    maxHeight: 200,
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
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
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
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
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
