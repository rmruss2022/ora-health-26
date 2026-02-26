/**
 * Notifications Service (Frontend)
 * Handles push notification registration and preferences
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './api/apiClient';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  lettersEnabled: boolean;
  communityEnabled: boolean;
  remindersEnabled: boolean;
  weeklyPlanningEnabled?: boolean;
  weeklyReviewEnabled?: boolean;
  weeklyPlanningDay?: string;
  weeklyPlanningTime?: string;
  weeklyReviewDay?: string;
  weeklyReviewTime?: string;
}

export class NotificationsService {
  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission to receive notifications was denied');
        return null;
      }

      // Get the push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });

      const pushToken = tokenData.data;

      // Register token with backend
      await apiClient.post('/api/notifications/register-token', {
        pushToken,
        platform: Platform.OS,
      });

      console.log('✅ Push notification token registered:', pushToken);

      return pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const response = await apiClient.get('/api/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      await apiClient.put('/api/notifications/preferences', preferences);
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Deactivate push token
   */
  async deactivateToken(pushToken: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/notifications/token/${pushToken}`);
      return true;
    } catch (error) {
      console.error('Error deactivating push token:', error);
      return false;
    }
  }

  /**
   * Add notification listener
   */
  addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }
}

// Singleton instance
export const notificationsService = new NotificationsService();
