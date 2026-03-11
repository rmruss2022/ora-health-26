import { Router } from 'express';
import { inboxService } from '../services/inbox.service';
import { letterQueueService } from '../services/letter-queue.service';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(optionalAuth);
const TEST_USER_ID = 'f08ffbd7-ccd6-4a2f-ae08-ed0e007d70fa';

function getUserId(req: AuthRequest): string {
  return req.userId || (req.body?.userId as string) || (req.query.userId as string) || TEST_USER_ID;
}

// Get daily letters (3 per day from queue) - try this first for community Letters
router.get('/daily-letters', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const forDate = req.query.date as string | undefined;
    const letters = await letterQueueService.getDailyLetters(userId, forDate);
    const messages = letters.map((l) => ({
      id: l.id,
      userId,
      messageType: l.messageType,
      subject: l.subject,
      content: l.content,
      authorName: l.authorName,
      isRead: l.isRead,
      isArchived: false,
      readAt: l.readAt,
      createdAt: l.createdAt,
      timestamp: formatTimestamp(l.createdAt),
      isDailyLetter: true,
    }));
    res.json({ messages, unreadCount: messages.filter((m) => !m.isRead).length, totalCount: messages.length });
  } catch (error) {
    console.error('Error fetching daily letters:', error);
    res.status(500).json({ error: 'Failed to fetch daily letters' });
  }
});

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  if (diffMs < 0) return 'Just now'; // future date (timezone skew)
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

// Mark daily letter as read
router.post('/daily-letters/:dailyLetterId/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const dailyLetterId = String(req.params.dailyLetterId ?? '');
    await letterQueueService.markAsRead(userId, dailyLetterId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking daily letter as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Respond to daily letter (different from inbox messages - uses user_daily_letters.id)
router.post('/daily-letters/:dailyLetterId/respond', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const dailyLetterId = String(req.params.dailyLetterId ?? '');
    const { responseText, createPost, isAnonymous, authorName, authorAvatar } = req.body;

    if (!responseText || typeof responseText !== 'string' || !responseText.trim()) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const result = await letterQueueService.respondToDailyLetter(
      userId,
      dailyLetterId,
      responseText.trim(),
      !!createPost,
      !!isAnonymous,
      authorName || 'User',
      authorAvatar || '👤'
    );

    res.json(result);
  } catch (error) {
    console.error('Error responding to daily letter:', error);
    res.status(500).json({ error: 'Failed to respond to letter' });
  }
});

// Get inbox messages
router.get('/messages', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await inboxService.getMessages(userId, {
      unreadOnly,
      limit,
      offset
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read
router.post('/messages/:messageId/read', async (req: AuthRequest, res) => {
  try {
    const messageId = String(req.params.messageId ?? '');
    const userId = getUserId(req);

    await inboxService.markAsRead(messageId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Archive message
router.post('/messages/:messageId/archive', async (req: AuthRequest, res) => {
  try {
    const messageId = String(req.params.messageId ?? '');
    const userId = getUserId(req);

    await inboxService.archiveMessage(messageId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error archiving message:', error);
    res.status(500).json({ error: 'Failed to archive message' });
  }
});

// Respond to message
router.post('/messages/:messageId/respond', async (req: AuthRequest, res) => {
  try {
    const messageId = String(req.params.messageId ?? '');
    const userId = getUserId(req);
    const { responseText, createPost, isAnonymous, authorName, authorAvatar } = req.body;

    if (!responseText) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const result = await inboxService.respondToMessage(
      messageId,
      userId,
      responseText,
      createPost || false,
      isAnonymous || false,
      authorName || 'User',
      authorAvatar || '👤'
    );

    res.json(result);
  } catch (error) {
    console.error('Error responding to message:', error);
    res.status(500).json({ error: 'Failed to respond to message' });
  }
});

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);

    const count = await inboxService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Generate daily message (for testing/admin use)
router.post('/generate-daily', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);

    const message = await inboxService.generateDailyMessage(userId);
    res.json({ message });
  } catch (error) {
    console.error('Error generating daily message:', error);
    res.status(500).json({ error: 'Failed to generate daily message' });
  }
});

export default router;
