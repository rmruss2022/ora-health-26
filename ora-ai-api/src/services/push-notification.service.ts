/**
 * Push Notification Service (Backend)
 * Sends push notifications via Expo Push Notification service
 */

import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { query } from '../config/database';

interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface UserPushToken {
  userId: string;
  pushToken: string;
  platform: string;
  isActive: boolean;
}

export class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    });
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(payload: PushNotificationPayload): Promise<boolean> {
    try {
      // Get user's push tokens
      const tokens = await this.getUserPushTokens(payload.userId);

      if (tokens.length === 0) {
        console.log(`No push tokens found for user ${payload.userId}`);
        return false;
      }

      // Build messages
      const messages: ExpoPushMessage[] = tokens
        .filter(token => Expo.isExpoPushToken(token.pushToken))
        .map(token => ({
          to: token.pushToken,
          sound: payload.sound || 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge,
          priority: payload.priority || 'high',
          channelId: payload.channelId || 'default',
        }));

      if (messages.length === 0) {
        console.log(`No valid push tokens for user ${payload.userId}`);
        return false;
      }

      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Log tickets
      await this.logPushTickets(payload.userId, tickets);

      // Check for errors
      const hasError = tickets.some(
        ticket => ticket.status === 'error'
      );

      return !hasError;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const success = await this.sendToUser({
        userId,
        title,
        body,
        data,
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Send notification for new letter
   */
  async sendLetterNotification(
    recipientId: string,
    senderName: string,
    subject: string,
    letterId: string
  ): Promise<boolean> {
    return await this.sendToUser({
      userId: recipientId,
      title: `New letter from ${senderName}`,
      body: subject,
      data: {
        type: 'letter',
        letterId,
      },
      channelId: 'letters',
      priority: 'high',
    });
  }

  /**
   * Get user's push tokens from database
   */
  private async getUserPushTokens(userId: string): Promise<UserPushToken[]> {
    try {
      const result = await query(
        `SELECT user_id as "userId", push_token as "pushToken", platform, is_active as "isActive"
         FROM user_push_tokens
         WHERE user_id = $1
         AND is_active = true
         ORDER BY updated_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching user push tokens:', error);
      return [];
    }
  }

  /**
   * Register or update user's push token
   */
  async registerPushToken(
    userId: string,
    pushToken: string,
    platform: string
  ): Promise<void> {
    try {
      // Validate token
      if (!Expo.isExpoPushToken(pushToken)) {
        throw new Error('Invalid Expo push token');
      }

      await query(
        `INSERT INTO user_push_tokens
         (user_id, push_token, platform, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (user_id, push_token)
         DO UPDATE SET
           is_active = true,
           platform = EXCLUDED.platform,
           updated_at = NOW()`,
        [userId, pushToken, platform]
      );

      console.log(`Registered push token for user ${userId}`);
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  /**
   * Deactivate a push token
   */
  async deactivatePushToken(userId: string, pushToken: string): Promise<void> {
    try {
      await query(
        `UPDATE user_push_tokens
         SET is_active = false, updated_at = NOW()
         WHERE user_id = $1 AND push_token = $2`,
        [userId, pushToken]
      );
    } catch (error) {
      console.error('Error deactivating push token:', error);
    }
  }

  /**
   * Log push notification tickets
   */
  private async logPushTickets(
    userId: string,
    tickets: ExpoPushTicket[]
  ): Promise<void> {
    try {
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('Push notification error:', ticket.message, ticket.details);

          // Log to database
          await query(
            `INSERT INTO push_notification_logs
             (user_id, status, error_message, error_details)
             VALUES ($1, $2, $3, $4)`,
            [
              userId,
              'error',
              ticket.message || null,
              JSON.stringify(ticket.details || {}),
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error logging push tickets:', error);
    }
  }

  /**
   * Get notification preferences for user
   */
  async getUserNotificationPreferences(
    userId: string
  ): Promise<{
    lettersEnabled: boolean;
    communityEnabled: boolean;
    remindersEnabled: boolean;
  }> {
    try {
      const result = await query(
        `SELECT
           notifications_enabled,
           letter_notifications_enabled,
           community_notifications_enabled,
           reminder_notifications_enabled
         FROM user_notification_preferences
         WHERE user_id = $1`,
        [userId]
      );

      const prefs = result.rows[0];

      if (!prefs || !prefs.notifications_enabled) {
        return {
          lettersEnabled: false,
          communityEnabled: false,
          remindersEnabled: false,
        };
      }

      return {
        lettersEnabled: prefs.letter_notifications_enabled ?? true,
        communityEnabled: prefs.community_notifications_enabled ?? true,
        remindersEnabled: prefs.reminder_notifications_enabled ?? true,
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Default to all enabled
      return {
        lettersEnabled: true,
        communityEnabled: true,
        remindersEnabled: true,
      };
    }
  }

  /**
   * Check if user should receive notification based on preferences
   */
  async shouldSendNotification(
    userId: string,
    type: 'letter' | 'community' | 'reminder'
  ): Promise<boolean> {
    const prefs = await this.getUserNotificationPreferences(userId);

    switch (type) {
      case 'letter':
        return prefs.lettersEnabled;
      case 'community':
        return prefs.communityEnabled;
      case 'reminder':
        return prefs.remindersEnabled;
      default:
        return false;
    }
  }

  /**
   * Collective Meditation Notifications
   */

  /**
   * Send 5-minute warning for upcoming collective session
   */
  async sendCollectiveSessionWarning(
    participantCount: number,
    sessionId: string
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get all users who want meditation notifications
      const usersResult = await query(
        `SELECT DISTINCT u.id
         FROM users u
         JOIN user_notification_preferences p ON u.id = p.user_id
         WHERE (p.notifications_enabled = true OR p.notifications_enabled IS NULL)
         LIMIT 1000` // Prevent sending to too many at once
      );

      const userIds = usersResult.rows.map((row: any) => row.id);

      if (userIds.length === 0) {
        return { sent: 0, failed: 0 };
      }

      // Send notification to all users
      return await this.sendToUsers(
        userIds,
        '🌅 Collective Meditation Starting Soon',
        `${participantCount} ${participantCount === 1 ? 'person is' : 'people are'} meditating in 5 minutes. Join?`,
        {
          type: 'collective_session_warning',
          sessionId,
          participantCount,
        }
      );
    } catch (error) {
      console.error('Error sending collective session warning:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send notification that a collective session has started
   */
  async sendCollectiveSessionStarted(
    participantCount: number,
    sessionId: string
  ): Promise<{ sent: number; failed: number }> {
    try {
      const usersResult = await query(
        `SELECT DISTINCT u.id
         FROM users u
         JOIN user_notification_preferences p ON u.id = p.user_id
         WHERE (p.notifications_enabled = true OR p.notifications_enabled IS NULL)
         LIMIT 1000`
      );

      const userIds = usersResult.rows.map((row: any) => row.id);

      if (userIds.length === 0) {
        return { sent: 0, failed: 0 };
      }

      return await this.sendToUsers(
        userIds,
        '🧘 Collective Meditation Now',
        `${participantCount} ${participantCount === 1 ? 'person is' : 'people are'} meditating right now`,
        {
          type: 'collective_session_started',
          sessionId,
          participantCount,
        }
      );
    } catch (error) {
      console.error('Error sending collective session started notification:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send daily reflection reminder
   */
  async sendDailyReflectionReminder(userId: string): Promise<boolean> {
    return await this.sendToUser({
      userId,
      title: '✨ Daily Reflection',
      body: 'Take a moment to reflect on your day',
      data: {
        type: 'daily_reflection',
      },
      channelId: 'meditation',
      priority: 'normal',
    });
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();
