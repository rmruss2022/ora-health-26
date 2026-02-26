// Letter Controller
// Request handlers for letter/messaging endpoints

import { Response } from 'express';
import { letterService } from '../services/letter.service';
import { AuthRequest } from '../middleware/auth.middleware';

class LetterController {
  // ===== GET /api/letters/inbox - Get inbox letters =====
  async getInbox(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const unreadOnly = req.query.unreadOnly === 'true';
      const starredOnly = req.query.starredOnly === 'true';
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await letterService.getInbox(req.userId, {
        unreadOnly,
        starredOnly,
        limit,
        offset
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get Inbox Error:', error);
      res.status(500).json({
        error: 'Failed to fetch inbox',
        message: 'An error occurred while fetching inbox letters'
      });
    }
  }

  // ===== GET /api/letters/sent - Get sent letters =====
  async getSentLetters(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await letterService.getSentLetters(req.userId, {
        limit,
        offset
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get Sent Letters Error:', error);
      res.status(500).json({
        error: 'Failed to fetch sent letters',
        message: 'An error occurred while fetching sent letters'
      });
    }
  }

  // ===== GET /api/letters/:id - Read a specific letter =====
  async getLetter(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const id = req.params.id as string;

      const letter = await letterService.getLetter(id, req.userId);

      if (!letter) {
        return res.status(404).json({
          error: 'Letter not found',
          message: 'The requested letter does not exist or you do not have access to it'
        });
      }

      // Auto-mark as read if user is recipient and not already read
      if (letter.recipientId === req.userId && !letter.readAt) {
        await letterService.markAsRead(id, req.userId);
        letter.readAt = new Date();
      }

      res.json({
        success: true,
        letter
      });
    } catch (error: any) {
      console.error('Get Letter Error:', error);
      res.status(500).json({
        error: 'Failed to fetch letter',
        message: 'An error occurred while fetching the letter'
      });
    }
  }

  // ===== POST /api/letters - Send a new letter =====
  async sendLetter(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const { recipientId, subject, body, metadata } = req.body;

      // Validate required fields
      if (!recipientId) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Recipient ID is required'
        });
      }

      if (!subject || !body) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Subject and body are required'
        });
      }

      // Verify recipient exists
      const { query } = await import('../config/database');
      const recipientCheck = await query(
        'SELECT id FROM users WHERE id = $1',
        [recipientId]
      );

      if (recipientCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Recipient not found',
          message: 'The specified recipient does not exist'
        });
      }

      const letter = await letterService.sendLetter({
        senderId: req.userId,
        recipientId,
        subject,
        body,
        metadata
      });

      res.status(201).json({
        success: true,
        letter
      });
    } catch (error: any) {
      console.error('Send Letter Error:', error);
      res.status(500).json({
        error: 'Failed to send letter',
        message: 'An error occurred while sending the letter'
      });
    }
  }

  // ===== POST /api/letters/:id/reply - Reply to a letter =====
  async replyToLetter(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const id = req.params.id as string;
      const { subject, body } = req.body;

      // Validate required fields
      if (!subject || !body) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Subject and body are required'
        });
      }

      // Verify letter exists and user has access
      const originalLetter = await letterService.getLetter(id, req.userId);
      if (!originalLetter) {
        return res.status(404).json({
          error: 'Letter not found',
          message: 'The letter you are trying to reply to does not exist or you do not have access to it'
        });
      }

      const reply = await letterService.replyToLetter({
        letterId: id,
        senderId: req.userId,
        subject,
        body
      });

      res.status(201).json({
        success: true,
        letter: reply
      });
    } catch (error: any) {
      console.error('Reply to Letter Error:', error);

      if (error.message === 'Cannot reply to AI-generated letter with no sender') {
        return res.status(400).json({
          error: 'Cannot reply',
          message: 'You cannot reply to system-generated letters'
        });
      }

      res.status(500).json({
        error: 'Failed to send reply',
        message: 'An error occurred while sending the reply'
      });
    }
  }

  // ===== PATCH /api/letters/:id/read - Mark as read/unread =====
  async toggleRead(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const id = req.params.id as string;
      const { read } = req.body;

      if (typeof read !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid parameter',
          message: 'read must be a boolean value'
        });
      }

      if (read) {
        await letterService.markAsRead(id, req.userId);
      } else {
        await letterService.markAsUnread(id, req.userId);
      }

      res.json({
        success: true,
        message: read ? 'Letter marked as read' : 'Letter marked as unread'
      });
    } catch (error: any) {
      console.error('Toggle Read Error:', error);
      res.status(500).json({
        error: 'Failed to update letter',
        message: 'An error occurred while updating the letter'
      });
    }
  }

  // ===== PATCH /api/letters/:id/archive - Archive/unarchive letter =====
  async toggleArchive(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const id = req.params.id as string;
      const { archived } = req.body;

      if (typeof archived !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid parameter',
          message: 'archived must be a boolean value'
        });
      }

      if (archived) {
        await letterService.archiveLetter(id, req.userId);
      } else {
        await letterService.unarchiveLetter(id, req.userId);
      }

      res.json({
        success: true,
        message: archived ? 'Letter archived' : 'Letter unarchived'
      });
    } catch (error: any) {
      console.error('Toggle Archive Error:', error);
      res.status(500).json({
        error: 'Failed to update letter',
        message: 'An error occurred while updating the letter'
      });
    }
  }

  // ===== PATCH /api/letters/:id/star - Star/unstar letter =====
  async toggleStar(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const id = req.params.id as string;
      const { starred } = req.body;

      if (typeof starred !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid parameter',
          message: 'starred must be a boolean value'
        });
      }

      await letterService.toggleStar(id, req.userId, starred);

      res.json({
        success: true,
        message: starred ? 'Letter starred' : 'Letter unstarred'
      });
    } catch (error: any) {
      console.error('Toggle Star Error:', error);
      res.status(500).json({
        error: 'Failed to update letter',
        message: 'An error occurred while updating the letter'
      });
    }
  }

  // ===== GET /api/letters/unread-count - Get unread count =====
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const count = await letterService.getUnreadCount(req.userId);

      res.json({
        success: true,
        count
      });
    } catch (error: any) {
      console.error('Get Unread Count Error:', error);
      res.status(500).json({
        error: 'Failed to get unread count',
        message: 'An error occurred while fetching unread count'
      });
    }
  }

  // ===== POST /api/letters/generate-daily - Generate AI daily letter (for testing/cron) =====
  async generateDailyLetter(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const letter = await letterService.generateDailyLetter(req.userId);

      res.status(201).json({
        success: true,
        letter
      });
    } catch (error: any) {
      console.error('Generate Daily Letter Error:', error);

      if (error.message === 'No active letter templates found') {
        return res.status(500).json({
          error: 'Configuration error',
          message: 'No letter templates are currently available'
        });
      }

      res.status(500).json({
        error: 'Failed to generate letter',
        message: 'An error occurred while generating the daily letter'
      });
    }
  }

  // ===== GET /api/letters/preferences - Get user preferences =====
  async getPreferences(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const preferences = await letterService.getUserPreferences(req.userId);

      if (!preferences) {
        return res.status(404).json({
          error: 'Preferences not found',
          message: 'Letter preferences have not been set up for this user'
        });
      }

      res.json({
        success: true,
        preferences
      });
    } catch (error: any) {
      console.error('Get Preferences Error:', error);
      res.status(500).json({
        error: 'Failed to fetch preferences',
        message: 'An error occurred while fetching preferences'
      });
    }
  }

  // ===== PATCH /api/letters/preferences - Update user preferences =====
  async updatePreferences(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const updates = req.body;

      const preferences = await letterService.updateUserPreferences(
        req.userId,
        updates
      );

      res.json({
        success: true,
        preferences
      });
    } catch (error: any) {
      console.error('Update Preferences Error:', error);
      res.status(500).json({
        error: 'Failed to update preferences',
        message: 'An error occurred while updating preferences'
      });
    }
  }
}

export const letterController = new LetterController();
