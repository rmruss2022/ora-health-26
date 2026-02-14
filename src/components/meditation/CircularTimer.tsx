import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../../theme';

interface CircularTimerProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  isComplete?: boolean;
  colors?: string[];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularTimer: React.FC<CircularTimerProps> = ({
  size = 280,
  strokeWidth = 12,
  progress,
  isComplete = false,
  colors = [theme.colors.primary, theme.colors.secondary, theme.colors.accent],
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (isComplete) {
      // Pulse animation when complete
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isComplete]);

  // Calculate stroke dash offset based on progress
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
            <Stop offset="50%" stopColor={colors[1]} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors[2]} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.backgroundGray}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Glow effect when complete */}
      {isComplete && (
        <View
          style={[
            styles.glow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  glow: {
    position: 'absolute',
    backgroundColor: theme.colors.secondary,
    opacity: 0.2,
  },
});
