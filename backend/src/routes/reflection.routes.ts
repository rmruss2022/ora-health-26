import { Router } from 'express';
import { reflectionService } from '../services/reflection.service';

const router = Router();

/**
 * GET /api/reflections/daily
 * Get today's daily prompt (or prompt for specific date)
 */
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : undefined;

    const prompt = await reflectionService.getDailyPrompt(targetDate);
    res.json(prompt);
  } catch (error) {
    console.error('Error getting daily prompt:', error);
    res.status(500).json({ error: 'Failed to get daily prompt' });
  }
});

/**
 * POST /api/reflections
 * Save a user's reflection response
 */
router.post('/', async (req, res) => {
  try {
    const { promptId, response, isPublic } = req.body;
    const userId = req.body.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!promptId || !response) {
      return res.status(400).json({ error: 'promptId and response are required' });
    }

    const reflection = await reflectionService.saveReflectionResponse(
      userId,
      promptId,
      response,
      isPublic || false
    );

    res.status(201).json(reflection);
  } catch (error) {
    console.error('Error saving reflection:', error);
    res.status(500).json({ error: 'Failed to save reflection' });
  }
});

/**
 * GET /api/reflections/user
 * Get a user's reflection for a specific prompt
 */
router.get('/user', async (req, res) => {
  try {
    const { promptId } = req.query;
    const userId = req.query.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!promptId) {
      return res.status(400).json({ error: 'promptId is required' });
    }

    const reflection = await reflectionService.getUserReflection(
      userId as string,
      promptId as string
    );

    if (!reflection) {
      return res.status(404).json({ message: 'No reflection found' });
    }

    res.json(reflection);
  } catch (error) {
    console.error('Error getting user reflection:', error);
    res.status(500).json({ error: 'Failed to get reflection' });
  }
});

/**
 * GET /api/reflections/:promptId/public
 * Get random public reflections for a prompt
 */
router.get('/:promptId/public', async (req, res) => {
  try {
    const { promptId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const userId = req.query.userId || (req as any).user?.id;

    const reflections = await reflectionService.getPublicReflections(
      promptId,
      limit,
      userId as string | undefined
    );

    res.json(reflections);
  } catch (error) {
    console.error('Error getting public reflections:', error);
    res.status(500).json({ error: 'Failed to get public reflections' });
  }
});

/**
 * GET /api/reflections/:promptId/count
 * Get count of public reflections for a prompt
 */
router.get('/:promptId/count', async (req, res) => {
  try {
    const { promptId } = req.params;
    const count = await reflectionService.getPublicReflectionCount(promptId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting reflection count:', error);
    res.status(500).json({ error: 'Failed to get reflection count' });
  }
});

export default router;
