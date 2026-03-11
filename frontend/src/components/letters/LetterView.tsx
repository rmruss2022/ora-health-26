import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { InboxMessage } from '../../types';

const AUTHOR_LABELS: Record<string, string> = {
  community_highlight: 'From the circle',
  insight: 'A member',
  encouragement: 'From the circle',
  prompt: 'A member',
  activity_suggestion: 'From the circle',
};

/**
 * LetterView - Full letter reading view with Ora design
 * Letters are from community members describing their experience; readers can respond inline.
 */
export const LetterView: React.FC<{ letter: InboxMessage }> = ({ letter }) => {
  const authorLabel = letter.authorName || AUTHOR_LABELS[letter.messageType] || 'A community member';
  const dateLabel = letter.timestamp || 'Recently';
  const body = letter.content;
  const subject = letter.subject;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.authorPill}>
            <Text style={styles.authorLabel}>{authorLabel}</Text>
          </View>
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Subject */}
        {subject ? (
          <Text style={styles.subject}>{subject}</Text>
        ) : null}

        {/* Letter body */}
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.3)',
    padding: theme.spacing.xl,
    backgroundColor: '#FFFDF9',
    ...theme.shadows.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  authorPill: {
    backgroundColor: 'rgba(212,184,232,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,184,232,0.5)',
  },
  authorLabel: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 11,
    color: '#6B5B95',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateText: {
    fontFamily: 'Switzer-Regular',
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(163,163,163,0.18)',
    marginBottom: theme.spacing.lg,
  },
  subject: {
    fontFamily: 'Sentient-Light',
    fontSize: 23,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    lineHeight: 31,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: 'Sentient-LightItalic',
    fontSize: 17,
    lineHeight: 29,
    color: theme.colors.textPrimary,
  },
});
