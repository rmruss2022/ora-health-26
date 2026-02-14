import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  StatusBar,
} from 'react-native';
import { theme } from '../theme';
import { LetterView } from '../components/letters/LetterView';
import { Letter } from '../components/letters/LetterCard';

interface LetterDetailScreenProps {
  navigation: any;
  route: {
    params: {
      letter: Letter;
    };
  };
}

/**
 * LetterDetailScreen - Full-screen letter reading experience
 * 
 * Features:
 * - Entrance animation (fade in + slide up)
 * - Full LetterView component for reading
 * - Back button to return to inbox
 * - Clean, distraction-free reading experience
 * 
 * Animation:
 * - Fades in and slides up smoothly after navigation
 * - Premium feel that complements envelope open animation
 */
export const LetterDetailScreen: React.FC<LetterDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { letter } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation when screen mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the inbox"
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Inbox</Text>
        </TouchableOpacity>
      </View>

      {/* Animated letter content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LetterView
          letter={letter}
          // Optional: add thread support later
          // onThreadPress={() => navigation.navigate('LetterThread', { threadId: letter.threadId })}
          // threadCount={letter.threadCount}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingTop: 60, // Account for status bar
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.xs,
  },
  backText: {
    fontFamily: 'Switzer-Medium',
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  contentContainer: {
    flex: 1,
  },
});
