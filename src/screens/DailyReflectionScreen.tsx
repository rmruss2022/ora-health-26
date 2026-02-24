import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { reflectionService } from '../services/reflection.service';

interface DailyPrompt {
  id: string;
  question: string;
  date: string;
  category: string;
}

interface PublicReflection {
  id: string;
  response: string;
  createdAt: string;
}

export const DailyReflectionScreen: React.FC = () => {
  const navigation = useNavigation();

  // State
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);
  const [response, setResponse] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publicReflections, setPublicReflections] = useState<PublicReflection[]>([]);
  const [showCommunity, setShowCommunity] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    try {
      setLoading(true);
      const todayPrompt = await reflectionService.getDailyPrompt();
      setPrompt(todayPrompt);

      // Check if user already answered
      const existingResponse = await reflectionService.getUserReflection(todayPrompt.id);
      if (existingResponse) {
        setResponse(existingResponse.response);
        setIsPublic(existingResponse.isPublic);
        setSaved(true);
      }
    } catch (error) {
      console.error('Failed to load prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prompt || !response.trim()) return;

    try {
      setSaving(true);
      await reflectionService.saveReflection(prompt.id, response, isPublic);
      setSaved(true);

      // Load community responses
      if (isPublic) {
        const community = await reflectionService.getPublicReflections(prompt.id, 3);
        setPublicReflections(community);
        setShowCommunity(true);
      }
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleViewCommunity = async () => {
    if (!prompt) return;

    try {
      const community = await reflectionService.getPublicReflections(prompt.id, 5);
      setPublicReflections(community);
      setShowCommunity(true);
    } catch (error) {
      console.error('Failed to load community reflections:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.forestGreen} />
      </View>
    );
  }

  if (!prompt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No reflection prompt available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPrompt}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={[theme.colors.cream, theme.colors.lavender + '15']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{prompt.category}</Text>
          </View>
        </View>

        {/* Prompt question */}
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>{prompt.question}</Text>
        </View>

        {showCommunity && publicReflections.length > 0 ? (
          // Show community responses
          <View style={styles.communityContainer}>
            <Text style={styles.communityTitle}>Community reflections</Text>

            {publicReflections.map((reflection) => (
              <View key={reflection.id} style={styles.reflectionCard}>
                <Text style={styles.reflectionText}>{reflection.response}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowCommunity(false)}
            >
              <Text style={styles.backText}>Back to yours</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Input form
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Your thoughts..."
              placeholderTextColor={theme.colors.forestGreen + '60'}
              value={response}
              onChangeText={setResponse}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              editable={!saved}
            />

            <View style={styles.charCount}>
              <Text style={styles.charCountText}>
                {response.length} / 1000
              </Text>
            </View>

            {/* Public toggle */}
            <View style={styles.publicToggle}>
              <View>
                <Text style={styles.toggleLabel}>Share with community</Text>
                <Text style={styles.toggleHint}>
                  Your name won't be shown
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: theme.colors.forestGreen + '30',
                  true: theme.colors.lavender,
                }}
                thumbColor={theme.colors.cream}
                disabled={saved}
              />
            </View>

            {/* Save button */}
            {!saved ? (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!response.trim() || saving) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!response.trim() || saving}
              >
                <LinearGradient
                  colors={[theme.colors.forestGreen, theme.colors.forestGreen + 'dd']}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color={theme.colors.cream} />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {isPublic ? 'Save & Share' : 'Save Privately'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.savedContainer}>
                <Text style={styles.savedText}>✓ Reflection saved</Text>
                <TouchableOpacity
                  style={styles.viewCommunityButton}
                  onPress={handleViewCommunity}
                >
                  <Text style={styles.viewCommunityText}>
                    See what others shared
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cream,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cream,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  dateText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.7,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.lavender + '30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.forestGreen,
    textTransform: 'lowercase',
  },
  promptContainer: {
    marginBottom: 32,
  },
  promptText: {
    fontSize: 28,
    fontFamily: theme.fonts.medium,
    color: theme.colors.forestGreen,
    lineHeight: 38,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.forestGreen + '20',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    minHeight: 200,
    maxHeight: 300,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  charCountText: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.5,
  },
  publicToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.lavender + '15',
    borderRadius: 16,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.forestGreen,
    marginBottom: 4,
  },
  toggleHint: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.6,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: theme.fonts.medium,
    color: theme.colors.cream,
  },
  savedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  savedText: {
    fontSize: 18,
    fontFamily: theme.fonts.medium,
    color: theme.colors.forestGreen,
    marginBottom: 16,
  },
  viewCommunityButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  viewCommunityText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.7,
  },
  communityContainer: {
    marginBottom: 20,
  },
  communityTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.medium,
    color: theme.colors.forestGreen,
    marginBottom: 20,
  },
  reflectionCard: {
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.forestGreen + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  reflectionText: {
    fontSize: 15,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    lineHeight: 22,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.6,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeText: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.forestGreen,
    opacity: 0.6,
  },
});
