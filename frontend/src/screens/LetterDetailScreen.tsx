import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { LetterView } from '../components/letters/LetterView';
import { inboxAPI } from '../services/api/inboxAPI';
import { InboxMessage } from '../types';

interface LetterDetailScreenProps {
  navigation: any;
  route: {
    params: {
      letter?: InboxMessage;
    };
  };
}

export const LetterDetailScreen: React.FC<LetterDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const letter = route.params?.letter;
  const insets = useSafeAreaInsets();
  const [responseText, setResponseText] = useState('');
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSubmit = async () => {
    if (!letter || !responseText.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (letter.isDailyLetter) {
        await inboxAPI.respondToDailyLetter(
          letter.id,
          responseText.trim(),
          shareToCommunity,
          false
        );
      } else {
        await inboxAPI.respondToMessage(
          letter.id,
          responseText.trim(),
          shareToCommunity,
          false
        );
      }
      setResponseText('');
      setShareToCommunity(false);
      Alert.alert(
        shareToCommunity ? 'Shared!' : 'Sent!',
        shareToCommunity
          ? 'Your response was shared with the community.'
          : 'Your response was saved.'
      );
    } catch (error) {
      console.error('Error responding to letter:', error);
      Alert.alert('Error', 'Failed to send response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!letter) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Letters</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.errorText}>Letter not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Letters</Text>
        </TouchableOpacity>
      </View>

      {/* Letter content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LetterView letter={letter} />
      </ScrollView>

      {/* Response bar — matches ChatInput style */}
      <View style={[styles.responseBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={responseText}
            onChangeText={setResponseText}
            placeholder="Share your thoughts..."
            placeholderTextColor="#A8A49C"
            multiline
            maxLength={500}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!responseText.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!responseText.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.sendIcon}>
                <View style={styles.sendArrow} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Share toggle */}
        <TouchableOpacity
          style={styles.shareToggle}
          onPress={() => setShareToCommunity(!shareToCommunity)}
          activeOpacity={0.7}
        >
          <View style={[styles.togglePill, shareToCommunity && styles.togglePillActive]}>
            <Text style={[styles.toggleText, shareToCommunity && styles.toggleTextActive]}>
              Share as community post
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: '#FAF8F3',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180,170,155,0.3)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontFamily: 'Switzer-Regular',
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.xs,
  },
  backText: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Switzer-Regular',
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  // Response bar matches ChatInput exactly
  responseBar: {
    backgroundColor: '#FAF8F3',
    borderTopWidth: 1,
    borderTopColor: 'rgba(180,170,155,0.3)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(180,170,155,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Switzer-Regular',
    fontSize: 15,
    color: '#2D2D2D',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d473e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: '#fff',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  shareToggle: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(163,163,163,0.4)',
    backgroundColor: 'transparent',
  },
  togglePillActive: {
    backgroundColor: 'rgba(29,71,62,0.08)',
    borderColor: 'rgba(29,71,62,0.35)',
  },
  toggleText: {
    fontFamily: 'Switzer-Regular',
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  toggleTextActive: {
    fontFamily: 'Switzer-Medium',
    color: '#1d473e',
  },
});
