import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { InboxMessage } from '../../types';

interface LetterViewProps {
  letter: InboxMessage;
}

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  prompt: 'Ora',
  encouragement: 'Ora',
  activity_suggestion: 'Ora',
  insight: 'Ora',
  community_highlight: 'Community',
};

/**
 * LetterView - Full letter reading view
 *
 * Layout (matching letter.png reference):
 * - Metadata row: author name (left) / posted date (right)
 * - Full letter content below
 */
export const LetterView: React.FC<LetterViewProps> = ({ letter }) => {
  const authorLabel = MESSAGE_TYPE_LABELS[letter.messageType] ?? 'Ora';
  const dateLabel = letter.timestamp || 'Recently';
  const body = letter.content;
  const subject = letter.subject;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.paper}>
        {/* Metadata row: author left / date right */}
        <View style={styles.metaRow}>
          <Text style={styles.authorName}>{authorLabel}</Text>
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Subject (if present) */}
        {subject ? <Text style={styles.subject}>{subject}</Text> : null}

        {/* Full letter body */}
        <Text style={styles.body}>{body}</Text>
      </View>

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
    padding: 16,
  },
  paper: {
    backgroundColor: theme.colors.cream ?? '#F5F1E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border ?? '#E0DCD3',
    padding: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Switzer-Medium',
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: 'Switzer-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border ?? '#E0DCD3',
    marginBottom: 20,
  },
  subject: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    fontFamily: 'Sentient-Regular',
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: theme.colors.textPrimary,
    fontFamily: 'Sentient-Regular',
  },
  bottomSpacer: {
    height: 32,
  },
});
