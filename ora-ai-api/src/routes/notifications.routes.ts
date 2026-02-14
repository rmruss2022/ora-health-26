/**
 * Notifications API Routes
 */

import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { pushNotificationService } from '../services/push-notification.service';

const router = Router();

/**
 * POST /api/notifications/register-token
 * Register user's push notification token
 */
router.post(
  '/register-token',
  authMiddleware,
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
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { token } = req.params;

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
  authMiddleware,
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

export default router;
