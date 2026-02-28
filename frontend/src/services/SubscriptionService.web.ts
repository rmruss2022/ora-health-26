/**
 * SubscriptionService — web stub
 * On web there is no native store, so purchaseMonthly always returns true
 * and configure is a no-op.
 */

class SubscriptionService {
  async configure(_userId: string): Promise<void> {
    // no-op on web
  }

  async purchaseMonthly(): Promise<boolean> {
    return true;
  }

  async restorePurchases(): Promise<boolean> {
    return false;
  }
}

export const subscriptionService = new SubscriptionService();
