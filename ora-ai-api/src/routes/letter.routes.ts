// Letter Routes
// API routes for the letters/messaging system

import { Router } from 'express';
import { letterController } from '../controllers/letter.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== INBOX ENDPOINTS =====

// GET /api/letters/inbox - Get inbox letters (received)
router.get('/inbox', letterController.getInbox.bind(letterController));

// GET /api/letters/sent - Get sent letters
router.get('/sent', letterController.getSentLetters.bind(letterController));

// GET /api/letters/unread-count - Get unread badge count
router.get('/unread-count', letterController.getUnreadCount.bind(letterController));

// ===== PREFERENCES ENDPOINTS =====

// GET /api/letters/preferences - Get user letter preferences
router.get('/preferences', letterController.getPreferences.bind(letterController));

// PATCH /api/letters/preferences - Update user letter preferences
router.patch('/preferences', letterController.updatePreferences.bind(letterController));

// ===== LETTER ACTIONS =====

// POST /api/letters - Send a new letter
router.post('/', letterController.sendLetter.bind(letterController));

// GET /api/letters/:id - Read a specific letter (auto-marks as read)
router.get('/:id', letterController.getLetter.bind(letterController));

// POST /api/letters/:id/reply - Reply to a letter
router.post('/:id/reply', letterController.replyToLetter.bind(letterController));

// PATCH /api/letters/:id/read - Mark as read/unread
router.patch('/:id/read', letterController.toggleRead.bind(letterController));

// PATCH /api/letters/:id/archive - Archive/unarchive letter
router.patch('/:id/archive', letterController.toggleArchive.bind(letterController));

// PATCH /api/letters/:id/star - Star/unstar letter
router.patch('/:id/star', letterController.toggleStar.bind(letterController));

// ===== AI GENERATION =====

// POST /api/letters/generate-daily - Generate AI daily letter
// (For testing, admin use, or manual trigger - can also be called by cron)
router.post('/generate-daily', letterController.generateDailyLetter.bind(letterController));

export default router;
