/**
 * OnboardingNavigator
 * Stack navigator for the 4-screen onboarding flow.
 * Shown when user is authenticated but hasn't completed onboarding + subscription.
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { OnboardingWelcomeScreen } from '../screens/onboarding/OnboardingWelcomeScreen';
import { OnboardingInfoScreen } from '../screens/onboarding/OnboardingInfoScreen';
import { OnboardingChatScreen } from '../screens/onboarding/OnboardingChatScreen';
import { OnboardingSubscriptionScreen } from '../screens/onboarding/OnboardingSubscriptionScreen';

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingInfo: { slideIndex: 0 | 1 | 2 };
  OnboardingChat: undefined;
  OnboardingSubscription: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="OnboardingWelcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        cardStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="OnboardingInfo" component={OnboardingInfoScreen} />
      <Stack.Screen name="OnboardingChat" component={OnboardingChatScreen} />
      <Stack.Screen name="OnboardingSubscription" component={OnboardingSubscriptionScreen} />
    </Stack.Navigator>
  );
}
