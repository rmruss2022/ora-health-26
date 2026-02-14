import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { EnvelopeCard } from '../EnvelopeCard';
import { Letter } from './LetterCard';
import { EmptyState } from './EmptyState';

interface LettersTabContentProps {
  navigation: any;
}

/**
 * LettersTabContent - Demo/example component for Letters tab
 * 
 * This component demonstrates how to use EnvelopeCard with animation.
 * It shows sample letters and handles navigation to LetterDetailScreen.
 * 
 * Usage in CommunityScreen:
 * - Replace the empty state in Letters tab with this component
 * - Pass navigation prop to enable navigation to detail screen
 */
export const LettersTabContent: React.FC<LettersTabContentProps> = ({ navigation }) => {
  // Sample letters for demonstration
  // In production, these would come from an API/database
  const sampleLetters: Letter[] = [
    {
      id: '1',
      from: 'agent',
      agentId: 'ora-coach',
      agentName: 'Ora',
      subject: 'Your Weekly Reflection',
      body: 'Dear friend,\n\nI hope this letter finds you in a moment of calm. This week, I\'ve noticed your dedication to mindfulness practice...',
      preview: 'I hope this letter finds you in a moment of calm. This week, I\'ve noticed your dedication to mindfulness...',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      state: 'unread',
    },
    {
      id: '2',
      from: 'system',
      subject: 'You\'ve unlocked a new insight!',
      body: 'Congratulations!\n\nYour consistent practice has revealed a pattern worth celebrating...',
      preview: 'Your consistent practice has revealed a pattern worth celebrating...',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      state: 'read',
    },
    {
      id: '3',
      from: 'user',
      subject: 'Letter to Future Self',
      body: 'Dear Future Me,\n\nI\'m writing this from a place of growth and hope...',
      preview: 'I\'m writing this from a place of growth and hope...',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      state: 'read',
    },
  ];

  const handleLetterPress = (letter: Letter) => {
    navigation.navigate('LetterDetail', { letter });
  };

  const renderLetter = ({ item }: { item: Letter }) => (
    <EnvelopeCard
      letter={item}
      onPress={() => handleLetterPress(item)}
    />
  );

  if (sampleLetters.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sampleLetters}
        keyExtractor={(item) => item.id}
        renderItem={renderLetter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Letters</Text>
            <Text style={styles.headerSubtitle}>
              Thoughtful messages from your journey
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontFamily: 'Switzer-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Switzer-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
});
