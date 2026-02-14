import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HeaderGradient: React.FC = () => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={['#4A90E2', '#2E5C8A']}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.appName}>Shadow AI</Text>
        <Text style={styles.tagline}>Your personal companion for growth and reflection</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
