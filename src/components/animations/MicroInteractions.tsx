/**
 * Micro-interactions and Delightful Details
 * Subtle animations and interactions throughout the app
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

/**
 * Tab Bar Icon Bounce
 * Bounces icon when tab is pressed
 */
export const useTabIconBounce = (focused: boolean) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return {
    transform: [{ scale: bounceAnim }],
  };
};

/**
 * Pull to Refresh Animation
 * Custom pull-to-refresh indicator
 */
export const usePullToRefreshAnimation = (refreshing: boolean) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [refreshing]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return { transform: [{ rotate }] };
};

/**
 * Message Send Animation
 * Bubble expand animation when sending message
 */
export const useMessageSendAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const triggerAnimation = () => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    triggerAnimation,
    style: {
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
    },
  };
};

/**
 * Like Button Heart Animation
 * Heart bounces and fills when liked
 */
export const useLikeAnimation = (isLiked: boolean) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(isLiked ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(colorAnim, {
        toValue: isLiked ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isLiked]);

  const color = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D1D1D1', '#FF4458'],
  });

  return {
    transform: [{ scale: scaleAnim }],
    color,
  };
};

/**
 * Streak Flame Flicker
 * Subtle flame animation for streak badges
 */
export const useStreakFlickerAnimation = () => {
  const flickerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return {
    transform: [{ scale: flickerAnim }],
  };
};

/**
 * Button Press Scale
 * Subtle scale-down on press for all touchable elements
 */
export const usePressAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return {
    onPressIn,
    onPressOut,
    style: {
      transform: [{ scale: scaleAnim }],
    },
  };
};

/**
 * Card Entrance Animation
 * Fade in + slide up for cards
 */
export const useCardEntranceAnimation = (delay: number = 0) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return {
    opacity: opacityAnim,
    transform: [{ translateY: translateYAnim }],
  };
};

/**
 * Badge Pulse Animation
 * Subtle pulse for notification badges
 */
export const useBadgePulseAnimation = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return {
    transform: [{ scale: pulseAnim }],
  };
};

/**
 * Shimmer Loading Effect
 * For skeleton loaders
 */
export const useShimmerAnimation = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return {
    transform: [{ translateX }],
  };
};

/**
 * Success Checkmark Animation
 * Animated checkmark for completion states
 */
export const useCheckmarkAnimation = (visible: boolean) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return {
    transform: [{ scale: scaleAnim }, { rotate }],
  };
};
