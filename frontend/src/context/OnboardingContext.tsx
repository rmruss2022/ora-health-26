/**
 * OnboardingContext
 * Tracks whether the user has completed onboarding and has an active subscription.
 * Persists flags using SecureStore (native) or localStorage (web).
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const FORCE_ONBOARDING = process.env.EXPO_PUBLIC_FORCE_ONBOARDING === 'true';

const KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  SUBSCRIPTION_GRANTED: 'subscription_granted',
} as const;

/**
 * Cross-platform storage wrapper.
 * expo-secure-store throws on web, so we always use localStorage there.
 */
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  isSubscribed: boolean;
  isLoadingOnboarding: boolean;
  loadOnboardingState(): Promise<void>;
  completeOnboarding(): Promise<void>;
  grantSubscription(): Promise<void>;
  resetOnboarding(): Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);

  async function loadOnboardingState(): Promise<void> {
    if (FORCE_ONBOARDING) return; // ignore stored flags — always show onboarding
    try {
      setIsLoadingOnboarding(true);
      const [completed, subscribed] = await Promise.all([
        storage.getItem(KEYS.ONBOARDING_COMPLETED),
        storage.getItem(KEYS.SUBSCRIPTION_GRANTED),
      ]);
      setHasCompletedOnboarding(completed === 'true');
      setIsSubscribed(subscribed === 'true');
    } catch (error) {
      console.error('[OnboardingContext] Failed to load state:', error);
    } finally {
      setIsLoadingOnboarding(false);
    }
  }

  async function completeOnboarding(): Promise<void> {
    await storage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');
    setHasCompletedOnboarding(true);
  }

  async function grantSubscription(): Promise<void> {
    await storage.setItem(KEYS.SUBSCRIPTION_GRANTED, 'true');
    setIsSubscribed(true);
  }

  async function resetOnboarding(): Promise<void> {
    await Promise.all([
      storage.removeItem(KEYS.ONBOARDING_COMPLETED),
      storage.removeItem(KEYS.SUBSCRIPTION_GRANTED),
    ]);
    setHasCompletedOnboarding(false);
    setIsSubscribed(false);
  }

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        isSubscribed,
        isLoadingOnboarding,
        loadOnboardingState,
        completeOnboarding,
        grantSubscription,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
