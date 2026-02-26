/**
 * Push Notifications Service
 * Handles Expo push notifications for letters and other events
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  type: 'letter' | 'message' | 'community' | 'reminder';
  letterId?: string;
  messageId?: string;
  postId?: string;
  [key: string]: any;
}

export class NotificationService {
  private pushToken: string | null = null;

  /**
   * Request notification permissions and get push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.pushToken = tokenData.data;

      // Register token with backend
      await this.registerTokenWithBackend(this.pushToken);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9D76',
        });

        // Letter notifications channel
        await Notifications.setNotificationChannelAsync('letters', {
          name: 'Letters',
          description: 'Notifications for new letters',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9D76',
        });
      }

      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/api/notifications/register-token', {
        pushToken: token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error registering push token with backend:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listener for notifications received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    // Listener for when user taps notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        onNotificationResponse?.(response);
      }
    );

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  handleNotificationTap(
    data: NotificationData,
    navigation: any
  ): void {
    switch (data.type) {
      case 'letter':
        if (data.letterId) {
          navigation.navigate('LetterRead', { letterId: data.letterId });
        } else {
          navigation.navigate('Community', { screen: 'Letters' });
        }
        break;

      case 'message':
        if (data.messageId) {
          navigation.navigate('Chat', { messageId: data.messageId });
        }
        break;

      case 'community':
        if (data.postId) {
          navigation.navigate('Community', {
            screen: 'PostDetail',
            params: { postId: data.postId },
          });
        } else {
          navigation.navigate('Community');
        }
        break;

      default:
        navigation.navigate('Home');
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    triggerSeconds: number = 1
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: { seconds: triggerSeconds },
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { NotificationData };
