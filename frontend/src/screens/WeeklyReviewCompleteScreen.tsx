import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function WeeklyReviewCompleteScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FCE4EC', '#F8BBD0', '#FCE4EC']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>🌟</Text>
          <Text style={styles.title}>Beautiful Reflection!</Text>
          <Text style={styles.message}>
            You took time to honor your journey this week. That's growth.
          </Text>

          <View style={styles.quotesContainer}>
            <Text style={styles.quote}>
              "The unexamined life is not worth living."
            </Text>
            <Text style={styles.quoteAuthor}>— Socrates</Text>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tip}>✨ Carry forward what you learned</Text>
            <Text style={styles.tip}>💚 Be proud of showing up</Text>
            <Text style={styles.tip}>🌱 Every week is a chance to grow</Text>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={['#526253', '#3D4A3E']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Return Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCE4EC',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3A2E',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: theme.typography.h1.fontFamily,
  },
  message: {
    fontSize: 16,
    color: '#6B7268',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  quotesContainer: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    width: '100%',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#2D3A2E',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#6B7268',
    textAlign: 'center',
  },
  tipsContainer: {
    width: '100%',
  },
  tip: {
    fontSize: 14,
    color: '#526253',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
