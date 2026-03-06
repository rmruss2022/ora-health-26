import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';
import { postgresService } from '../services/postgres.service';

class JournalController {
  async createEntry(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { content, behaviorId, mood, tags, isShared } = req.body;

      if (!content || !behaviorId) {
        return res.status(400).json({ error: 'Content and behaviorId required' });
      }

      const entryId = await postgresService.createJournalEntry({
        id: randomUUID(),
        userId,
        content,
        behaviorContext: behaviorId,
        mood,
        tags: tags || [],
        metadata: { isShared: isShared || false },
      });

      res.status(201).json({
        id: entryId,
        userId,
        content,
        behaviorId,
        mood,
        tags: tags || [],
        isShared: isShared || false,
      });
    } catch (error) {
      console.error('CreateEntry Error:', error);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }

  async getEntries(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 50;

      const entries = await postgresService.getJournalEntries(userId, limit);

      res.json(
        entries.map((e) => ({
          id: e.id,
          userId: e.user_id,
          content: e.content,
          behaviorId: e.behavior_context,
          mood: e.mood,
          tags: e.tags,
          isShared: e.metadata?.isShared ?? false,
          createdAt: e.created_at,
        }))
      );
    } catch (error) {
      console.error('GetEntries Error:', error);
      res.status(500).json({ error: 'Failed to get entries' });
    }
  }

  async getEntry(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const entryId = req.params.entryId as string;

      const entry = await postgresService.getJournalEntry(entryId, userId);

      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({
        id: entry.id,
        userId: entry.user_id,
        content: entry.content,
        behaviorId: entry.behavior_context,
        mood: entry.mood,
        tags: entry.tags,
        isShared: entry.metadata?.isShared ?? false,
        createdAt: entry.created_at,
      });
    } catch (error) {
      console.error('GetEntry Error:', error);
      res.status(500).json({ error: 'Failed to get entry' });
    }
  }

  async updateEntry(req: AuthRequest, res: Response) {
    try {
      // Implement update logic
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      console.error('UpdateEntry Error:', error);
      res.status(500).json({ error: 'Failed to update entry' });
    }
  }

  async deleteEntry(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const entryId = req.params.entryId as string;

      await postgresService.deleteJournalEntry(userId, entryId);

      res.json({ success: true });
    } catch (error) {
      console.error('DeleteEntry Error:', error);
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  }
}

export const journalController = new JournalController();
