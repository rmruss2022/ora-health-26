import { Router } from 'express';
import { quizService } from '../services/quiz.service';

const router = Router();

/**
 * GET /api/quiz/daily
 * Get today's quiz (or create if doesn't exist)
 */
router.get('/daily', async (req, res) => {
  try {
    const quiz = await quizService.getTodaysQuiz();
    res.json(quiz);
  } catch (error) {
    console.error('Error getting daily quiz:', error);
    res.status(500).json({ error: 'Failed to get daily quiz' });
  }
});

/**
 * GET /api/quiz/date/:date
 * Get quiz for specific date (YYYY-MM-DD)
 */
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const quiz = await quizService.getQuizByDate(date);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found for this date' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error getting quiz by date:', error);
    res.status(500).json({ error: 'Failed to get quiz' });
  }
});

/**
 * POST /api/quiz/responses
 * Submit quiz answers
 */
router.post('/responses', async (req, res) => {
  try {
    const { userId, quizId, answers, timeTakenSeconds } = req.body;
    const uid = userId || (req as any).user?.id;

    if (!uid) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!quizId || !answers) {
      return res.status(400).json({ error: 'quizId and answers are required' });
    }

    const response = await quizService.submitQuizResponse(
      uid,
      quizId,
      answers,
      timeTakenSeconds
    );

    // Generate insights
    const insights = await quizService.generateInsight(uid, response.id);

    res.status(201).json({
      response,
      insights,
    });
  } catch (error) {
    console.error('Error submitting quiz response:', error);
    res.status(500).json({ error: 'Failed to submit quiz response' });
  }
});

/**
 * GET /api/quiz/responses/:quizId
 * Get user's response for a specific quiz
 */
router.get('/responses/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.query.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const response = await quizService.getUserQuizResponse(userId as string, quizId);

    if (!response) {
      return res.status(404).json({ message: 'No response found' });
    }

    // Get insights for this response
    const insights = await quizService.getQuizInsights(response.id);

    res.json({
      response,
      insights,
    });
  } catch (error) {
    console.error('Error getting quiz response:', error);
    res.status(500).json({ error: 'Failed to get quiz response' });
  }
});

/**
 * GET /api/quiz/history
 * Get user's quiz history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId || (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 30;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const history = await quizService.getUserQuizHistory(userId as string, limit);
    res.json(history);
  } catch (error) {
    console.error('Error getting quiz history:', error);
    res.status(500).json({ error: 'Failed to get quiz history' });
  }
});

/**
 * GET /api/quiz/streak
 * Get user's quiz completion streak
 */
router.get('/streak', async (req, res) => {
  try {
    const userId = req.query.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const streak = await quizService.getUserStreak(userId as string);

    if (!streak) {
      return res.json({
        current_streak: 0,
        longest_streak: 0,
        total_completed: 0,
        last_completed_date: null,
      });
    }

    res.json(streak);
  } catch (error) {
    console.error('Error getting quiz streak:', error);
    res.status(500).json({ error: 'Failed to get quiz streak' });
  }
});

/**
 * GET /api/quiz/stats
 * Get user's quiz statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.userId || (req as any).user?.id;
    const days = parseInt(req.query.days as string) || 30;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const stats = await quizService.getUserQuizStats(userId as string, days);
    res.json(stats);
  } catch (error) {
    console.error('Error getting quiz stats:', error);
    res.status(500).json({ error: 'Failed to get quiz stats' });
  }
});

export default router;
