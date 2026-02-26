/**
 * Notification Service
 * Simplified version - complex vector-based notifications disabled
 */

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export class NotificationService {
  /**
   * Get user notifications (simplified - returns empty array)
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    console.log(`Notification ${notificationId} marked as read`);
  }

  /**
   * Create notification (simplified)
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string
  ): Promise<void> {
    console.log(`Notification created for user ${userId}: ${title}`);
  }

  /**
   * Send push notification (stub)
   */
  async sendPushNotification(params: any): Promise<boolean> {
    console.log(`Push notification: ${params.title}`);
    return true;
  }
}

export const notificationService = new NotificationService();
