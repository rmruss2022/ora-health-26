/**
 * Notifications API Routes
 */

import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { pushNotificationService } from '../services/push-notification.service';

const router = Router();

/**
 * POST /api/notifications/register-token
 * Register user's push notification token
 */
router.post(
  '/register-token',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { pushToken, platform } = req.body;

      if (!pushToken) {
        return res.status(400).json({ error: 'Push token is required' });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await pushNotificationService.registerPushToken(
        req.userId,
        pushToken,
        platform || 'unknown'
      );

      res.json({ success: true, message: 'Push token registered' });
    } catch (error: any) {
      console.error('Error registering push token:', error);
      res.status(500).json({ error: error.message || 'Failed to register push token' });
    }
  }
);

/**
 * DELETE /api/notifications/token/:token
 * Deactivate a push token
 */
router.delete(
  '/token/:token',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const token = req.params.token as string;

      if (!req.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await pushNotificationService.deactivatePushToken(req.userId, token);

      res.json({ success: true, message: 'Push token deactivated' });
    } catch (error: any) {
      console.error('Error deactivating push token:', error);
      res.status(500).json({ error: error.message || 'Failed to deactivate push token' });
    }
  }
);

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get(
  '/preferences',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const preferences = await pushNotificationService.getUserNotificationPreferences(
        req.userId
      );

      res.json(preferences);
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch preferences' });
    }
  }
);

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
router.put(
  '/preferences',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const {
        notificationsEnabled,
        letterNotificationsEnabled,
        communityNotificationsEnabled,
        reminderNotificationsEnabled,
        weeklyPlanningEnabled,
        weeklyReviewEnabled,
        weeklyPlanningDay,
        weeklyPlanningTime,
        weeklyReviewDay,
        weeklyReviewTime,
      } = req.body;

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [req.userId];
      let paramCount = 2;

      if (notificationsEnabled !== undefined) {
        updates.push(`notifications_enabled = $${paramCount++}`);
        values.push(notificationsEnabled);
      }
      if (letterNotificationsEnabled !== undefined) {
        updates.push(`letter_notifications_enabled = $${paramCount++}`);
        values.push(letterNotificationsEnabled);
      }
      if (communityNotificationsEnabled !== undefined) {
        updates.push(`community_notifications_enabled = $${paramCount++}`);
        values.push(communityNotificationsEnabled);
      }
      if (reminderNotificationsEnabled !== undefined) {
        updates.push(`reminder_notifications_enabled = $${paramCount++}`);
        values.push(reminderNotificationsEnabled);
      }
      if (weeklyPlanningEnabled !== undefined) {
        updates.push(`weekly_planning_enabled = $${paramCount++}`);
        values.push(weeklyPlanningEnabled);
      }
      if (weeklyReviewEnabled !== undefined) {
        updates.push(`weekly_review_enabled = $${paramCount++}`);
        values.push(weeklyReviewEnabled);
      }
      if (weeklyPlanningDay) {
        updates.push(`weekly_planning_day = $${paramCount++}`);
        values.push(weeklyPlanningDay.toLowerCase());
      }
      if (weeklyPlanningTime) {
        updates.push(`weekly_planning_time = $${paramCount++}`);
        values.push(weeklyPlanningTime);
      }
      if (weeklyReviewDay) {
        updates.push(`weekly_review_day = $${paramCount++}`);
        values.push(weeklyReviewDay.toLowerCase());
      }
      if (weeklyReviewTime) {
        updates.push(`weekly_review_time = $${paramCount++}`);
        values.push(weeklyReviewTime);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No preferences provided to update' });
      }

      updates.push(`updated_at = NOW()`);

      const query = require('../config/database').query;
      await query(
        `INSERT INTO user_notification_preferences (user_id)
         VALUES ($1)
         ON CONFLICT (user_id)
         DO UPDATE SET ${updates.join(', ')}`,
        values
      );

      // Fetch updated preferences
      const preferences = await pushNotificationService.getUserNotificationPreferences(
        req.userId
      );

      res.json({
        success: true,
        preferences,
      });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: error.message || 'Failed to update preferences' });
    }
  }
);

export default router;
