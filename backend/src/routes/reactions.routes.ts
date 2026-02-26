import { Router } from 'express';
import { reactionsService } from '../services/reactions.service';

const router = Router();

// Add a reaction
router.post('/', async (req, res) => {
  try {
    const { userId, targetId, targetType, emoji } = req.body;

    if (!userId || !targetId || !targetType || !emoji) {
      return res.status(400).json({ 
        error: 'userId, targetId, targetType, and emoji are required' 
      });
    }

    if (!['post', 'comment'].includes(targetType)) {
      return res.status(400).json({ 
        error: 'targetType must be "post" or "comment"' 
      });
    }

    const reaction = await reactionsService.addReaction(
      userId,
      targetId,
      targetType,
      emoji
    );

    res.status(201).json({ reaction });
  } catch (error: any) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to add reaction' 
    });
  }
});

// Remove a reaction
router.delete('/', async (req, res) => {
  try {
    const { userId, targetId, emoji } = req.body;

    if (!userId || !targetId || !emoji) {
      return res.status(400).json({ 
        error: 'userId, targetId, and emoji are required' 
      });
    }

    const removed = await reactionsService.removeReaction(
      userId,
      targetId,
      emoji
    );

    if (removed) {
      res.json({ success: true, message: 'Reaction removed' });
    } else {
      res.status(404).json({ error: 'Reaction not found' });
    }
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Get reactions for a target
router.get('/:targetId', async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.query.userId as string | undefined;

    const summary = await reactionsService.getReactionSummary(targetId, userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// Get reactions for multiple targets (bulk)
router.post('/bulk', async (req, res) => {
  try {
    const { targetIds, userId } = req.body;

    if (!Array.isArray(targetIds)) {
      return res.status(400).json({ error: 'targetIds must be an array' });
    }

    const summaries = await reactionsService.getReactionSummaries(targetIds, userId);
    
    // Convert Map to object for JSON response
    const summariesObj: { [key: string]: any } = {};
    summaries.forEach((value, key) => {
      summariesObj[key] = value;
    });

    res.json({ summaries: summariesObj });
  } catch (error) {
    console.error('Error fetching bulk reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

export default router;
