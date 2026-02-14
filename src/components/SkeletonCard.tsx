import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const SkeletonCard: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.iconCircle, { opacity }]} />
      <View style={styles.textContainer}>
        <Animated.View style={[styles.titleBar, { opacity }]} />
        <Animated.View style={[styles.subtitleBar, { opacity }]} />
      </View>
      <Animated.View style={[styles.chevron, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    height: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  titleBar: {
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  subtitleBar: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '90%',
  },
  chevron: {
    width: 20,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginLeft: 8,
  },
});

export default SkeletonCard;
