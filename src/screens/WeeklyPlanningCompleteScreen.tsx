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

export function WeeklyPlanningCompleteScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FFF9E6', '#FFE4B5', '#FFF9E6']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.title}>Your Week is Set!</Text>
          <Text style={styles.message}>
            You've created a beautiful plan for the week ahead. Your intentions are ready to guide you.
          </Text>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Remember:</Text>
            <Text style={styles.tip}>🌅 Revisit your intentions each morning</Text>
            <Text style={styles.tip}>💫 Be gentle with yourself</Text>
            <Text style={styles.tip}>🙏 Celebrate small wins along the way</Text>
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
    backgroundColor: '#FFF9E6',
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
    marginBottom: 48,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3A2E',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: theme.typography.h3.fontFamily,
  },
  tip: {
    fontSize: 14,
    color: '#526253',
    marginBottom: 12,
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
