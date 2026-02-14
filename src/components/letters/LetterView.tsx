import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { Letter } from './LetterCard';

interface LetterViewProps {
  letter: Letter;
  onThreadPress?: () => void;
  threadCount?: number;
}

/**
 * LetterView - Full letter reading view component
 * 
 * Visual Design:
 * - Paper-like aesthetic with cream background
 * - Sentient font for intimate, personal feel
 * - Serif typography for letter body
 * - Metadata header (from, date, subject)
 * - Signature footer (italicized, right-aligned)
 * - Optional thread indicator
 * 
 * Typography:
 * - Title: Sentient Bold 24px
 * - Body: Sentient Regular 17px, line-height 28px (1.65 ratio)
 * - Metadata: Switzer Regular 13px
 * - Signature: Sentient Italic 15px
 */
export const LetterView: React.FC<LetterViewProps> = ({
  letter,
  onThreadPress,
  threadCount,
}) => {
  // Format full date
  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get sender display name
  const getSenderName = () => {
    if (letter.from === 'agent' && letter.agentName) {
      return letter.agentName;
    }
    if (letter.from === 'user') {
      return 'You';
    }
    if (letter.from === 'system') {
      return 'Ora';
    }
    return 'Unknown';
  };

  // Extract signature from body (if present)
  // Simple heuristic: last paragraph if it's short (<50 chars) and starts with common closings
  const { bodyText, signature } = React.useMemo(() => {
    const paragraphs = letter.body.trim().split('\n\n');
    const lastPara = paragraphs[paragraphs.length - 1];
    
    const closings = ['Warmly', 'Best', 'Sincerely', 'Regards', 'Yours', 'Cheers', 'Love'];
    const hasClosing = closings.some(closing => lastPara.startsWith(closing));
    
    if (hasClosing && lastPara.length < 50) {
      return {
        bodyText: paragraphs.slice(0, -1).join('\n\n'),
        signature: lastPara,
      };
    }
    
    return {
      bodyText: letter.body,
      signature: null,
    };
  }, [letter.body]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Paper container with letter content */}
      <View style={styles.paper}>
        {/* Letter metadata header */}
        <View style={styles.header}>
          <Text style={styles.metadata}>From: {getSenderName()}</Text>
          <Text style={styles.metadata}>Date: {getFormattedDate(letter.sentAt)}</Text>
          {letter.subject && (
            <Text style={styles.subject}>Subject: {letter.subject}</Text>
          )}
        </View>

        {/* Separator line */}
        <View style={styles.separator} />

        {/* Letter body - Sentient font for intimacy */}
        <View style={styles.bodyContainer}>
          {/* Greeting (if body starts with "Dear") */}
          {bodyText.startsWith('Dear') && (
            <Text style={styles.greeting}>
              {bodyText.split('\n\n')[0]}
            </Text>
          )}

          {/* Main body text */}
          <Text style={styles.body}>
            {bodyText.startsWith('Dear')
              ? bodyText.split('\n\n').slice(1).join('\n\n')
              : bodyText}
          </Text>

          {/* Signature (if extracted) */}
          {signature && (
            <View style={styles.signatureContainer}>
              <Text style={styles.signature}>{signature}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Thread indicator (if part of a conversation) */}
      {threadCount && threadCount > 1 && onThreadPress && (
        <TouchableOpacity
          style={styles.threadButton}
          onPress={onThreadPress}
          accessibilityRole="button"
          accessibilityLabel={`View thread with ${threadCount} letters`}
          accessibilityHint="Tap to see the full conversation"
        >
          <Text style={styles.threadIcon}>📚</Text>
          <Text style={styles.threadText}>
            View Thread ({threadCount} letters)
          </Text>
        </TouchableOpacity>
      )}

      {/* Bottom spacing for better scroll experience */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  contentContainer: {
    padding: theme.spacing.md, // 16px horizontal padding
  },
  paper: {
    backgroundColor: theme.colors.cream, // #F5F1E8 - paper feel
    borderRadius: theme.borderRadius.sm, // 8px - subtle, not too rounded
    borderWidth: 1,
    borderColor: theme.colors.border, // E0DCD3
    padding: theme.spacing.xl, // 24px horizontal
    paddingVertical: theme.spacing.xxl, // 32px vertical
    ...theme.shadows.lg,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  metadata: {
    fontFamily: 'Switzer-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  subject: {
    fontFamily: 'Switzer-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.lg, // 20px
  },
  bodyContainer: {
    // Container for body text
  },
  greeting: {
    fontFamily: 'Sentient-Regular',
    fontSize: 17,
    lineHeight: 28, // 1.65 ratio for reading comfort
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg, // 20px paragraph spacing
  },
  body: {
    fontFamily: 'Sentient-Regular',
    fontSize: 17,
    lineHeight: 28, // 1.65 ratio for reading comfort
    color: theme.colors.textPrimary,
    // Note: For multi-paragraph letters, handle spacing with custom rendering
    // This is simplified - production might parse \n\n and render as separate <Text> components
  },
  signatureContainer: {
    marginTop: theme.spacing.xl, // 24px extra space before signature
    alignItems: 'flex-end',
  },
  signature: {
    fontFamily: 'Sentient-Italic',
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.textSecondary,
  },
  threadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  threadIcon: {
    fontSize: 20,
    marginRight: theme.spacing.xs,
  },
  threadText: {
    fontFamily: 'Switzer-Medium',
    fontSize: 15,
    color: theme.colors.primary,
  },
  bottomSpacer: {
    height: theme.spacing.xxl, // Extra space at bottom
  },
});
