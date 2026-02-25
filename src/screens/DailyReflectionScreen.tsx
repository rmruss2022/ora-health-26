import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export const DailyReflectionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [reflectionText, setReflectionText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mock prompt
  const todayPrompt = "What am I grateful for today?";

  // Mock community responses
  const communityResponses = [
    "The warmth of the morning sun",
    "A conversation with an old friend",
    "The quiet moments before the day begins",
  ];

  const handleSubmit = async () => {
    if (!reflectionText.trim()) return;

    setSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      console.log('Reflection submitted:', {
        text: reflectionText,
        isPublic,
      });
      setSubmitting(false);
      navigation.goBack();
    }, 500);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 88 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Reflection</Text>
        </View>

        {/* Prompt Card */}
        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>Today's Prompt</Text>
          <Text style={styles.promptText}>{todayPrompt}</Text>
        </View>

        {/* Input */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Write your reflection..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={6}
            value={reflectionText}
            onChangeText={setReflectionText}
            textAlignVertical="top"
          />
        </View>

        {/* Public Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleTitle}>Share Publicly</Text>
            <Text style={styles.toggleSubtitle}>
              Your reflection will be shared anonymously with the community
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{
              false: '#D1D5DB',
              true: theme.colors.forestGreen,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!reflectionText.trim() || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!reflectionText.trim() || submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Reflection'}
          </Text>
        </TouchableOpacity>

        {/* Community Responses */}
        {isPublic && communityResponses.length > 0 && (
          <View style={styles.communitySection}>
            <Text style={styles.communityTitle}>Community Responses</Text>
            <Text style={styles.communitySubtitle}>
              What others have shared today
            </Text>

            {communityResponses.map((response, index) => (
              <View key={index} style={styles.responseCard}>
                <Text style={styles.responseText}>{response}</Text>
                <Text style={styles.responseTime}>Anonymous • 2h ago</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: theme.colors.forestGreen,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
  },
  promptCard: {
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.white,
    lineHeight: 28,
  },
  inputCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 150,
  },
  input: {
    fontSize: 16,
    color: theme.colors.charcoal,
    lineHeight: 24,
    flex: 1,
  },
  toggleCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  submitButton: {
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  communitySection: {
    marginTop: 8,
  },
  communityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  communitySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  responseCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  responseText: {
    fontSize: 15,
    color: theme.colors.charcoal,
    lineHeight: 22,
    marginBottom: 8,
  },
  responseTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
