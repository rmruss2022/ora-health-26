/**
 * SubscriptionService
 * Handles in-app purchases via RevenueCat (react-native-purchases).
 * Uses a dynamic import to prevent the native module from bundling on web.
 */

import { Platform } from 'react-native';

class SubscriptionService {
  /**
   * Configure RevenueCat with the given user ID.
   * Safe to call on web — no-ops silently.
   */
  async configure(userId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? ''
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
      if (!apiKey) {
        console.warn('[SubscriptionService] No RevenueCat API key configured');
        return;
      }
      Purchases.configure({ apiKey, appUserID: userId });
    } catch (error) {
      console.warn('[SubscriptionService] RevenueCat configure failed:', error);
    }
  }

  /**
   * Purchase the monthly subscription package.
   * Returns true if the user has at least one active entitlement after purchase.
   * Always returns true on web (no native store available).
   */
  async purchaseMonthly(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const monthly = offerings.current?.monthly;
    if (!monthly) throw new Error('No monthly package available');
    const { customerInfo } = await Purchases.purchasePackage(monthly);
    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  /**
   * Restore prior purchases (e.g. after reinstall).
   * Returns true if user has active entitlements.
   */
  async restorePurchases(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const customerInfo = await Purchases.restorePurchases();
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch {
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService();
