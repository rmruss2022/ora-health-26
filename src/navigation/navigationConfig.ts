import { CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';

/**
 * Custom navigation transition configurations for Ora AI
 * 
 * Provides smooth, intentional animations for different navigation patterns
 */

/**
 * Horizontal slide (default for forward navigation)
 * iOS-style push/pop animation
 */
export const horizontalSlideConfig = {
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};

/**
 * Fade transition (for tab switches)
 * Smooth opacity transition without slide
 */
export const fadeConfig = {
  gestureEnabled: false,
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 250,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200,
      },
    },
  },
};

/**
 * Modal slide-up (for compose/create screens)
 * Vertical slide from bottom with backdrop
 */
export const modalSlideConfig = {
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  presentation: 'modal' as const,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};

/**
 * Reveal from bottom (for sheets/panels)
 * Transparent backdrop with content sliding from bottom
 */
export const revealFromBottomConfig = {
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
  cardStyleInterpolator: CardStyleInterpolators.forRevealFromBottomAndroid,
  presentation: 'transparentModal' as const,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
      },
    },
  },
};

/**
 * Scale from center (for detail views)
 * Card scales up from center point
 */
export const scaleFromCenterConfig = {
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  cardStyleInterpolator: CardStyleInterpolators.forScaleFromCenterAndroid,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
      },
    },
  },
};

/**
 * Get default screen options based on platform and screen type
 */
export function getScreenOptions(screenType: 'default' | 'modal' | 'tab' | 'detail' = 'default') {
  switch (screenType) {
    case 'modal':
      return {
        ...modalSlideConfig,
        headerShown: false,
        cardOverlayEnabled: true,
        cardStyle: { backgroundColor: 'transparent' },
      };
    
    case 'tab':
      return {
        ...fadeConfig,
        headerShown: false,
      };
    
    case 'detail':
      return {
        ...scaleFromCenterConfig,
        headerShown: true,
      };
    
    case 'default':
    default:
      return {
        ...horizontalSlideConfig,
        headerShown: true,
      };
  }
}

/**
 * Platform-specific preset
 * Uses native transitions for better performance
 */
export const platformPreset = Platform.select({
  ios: TransitionPresets.SlideFromRightIOS,
  android: TransitionPresets.FadeFromBottomAndroid,
  default: TransitionPresets.DefaultTransition,
});

/**
 * Bottom tab bar animation config
 * Smooth tab switches with minimal distraction
 */
export const tabBarOptions = {
  animation: 'shift' as const,
  activeTintColor: '#4A90E2',
  inactiveTintColor: '#8E8E93',
  showLabel: true,
  style: {
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabStyle: {
    paddingVertical: 4,
  },
};

export default {
  horizontalSlideConfig,
  fadeConfig,
  modalSlideConfig,
  revealFromBottomConfig,
  scaleFromCenterConfig,
  getScreenOptions,
  platformPreset,
  tabBarOptions,
};
