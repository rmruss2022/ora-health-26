import { Router } from 'express';
import { exerciseService } from '../services/exercise.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ===== EXERCISE ENDPOINTS =====

// Get all exercises
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const exercises = await exerciseService.getAllExercises(userId);
    res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercise types
router.get('/types', async (req, res) => {
  try {
    const types = await exerciseService.getExerciseTypes();
    res.json({ types });
  } catch (error) {
    console.error('Error fetching exercise types:', error);
    res.status(500).json({ error: 'Failed to fetch exercise types' });
  }
});

// Get exercise by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const exercise = await exerciseService.getExerciseById(id, userId);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json({ exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// Get exercises by type
router.get('/type/:typeId', authenticateToken, async (req, res) => {
  try {
    const { typeId } = req.params;
    const userId = (req as any).user?.userId;
    const exercises = await exerciseService.getExercisesByType(typeId, userId);
    res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises by type:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercises by tag
router.get('/tag/:tag', authenticateToken, async (req, res) => {
  try {
    const { tag } = req.params;
    const userId = (req as any).user?.userId;
    const exercises = await exerciseService.getExercisesByTag(tag, userId);
    res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises by tag:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get user favorites
router.get('/favorites/mine', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const exercises = await exerciseService.getUserFavorites(userId);
    res.json({ exercises });
  } catch (error) {
    console.error('Error fetching favorite exercises:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Toggle favorite
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const result = await exerciseService.toggleFavorite(userId, id);
    res.json(result);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// ===== COMPLETION ENDPOINTS =====

// Start exercise
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const { moodBefore } = req.body;

    const completion = await exerciseService.startExercise(userId, id, moodBefore);
    res.json({ completion });
  } catch (error) {
    console.error('Error starting exercise:', error);
    res.status(500).json({ error: 'Failed to start exercise' });
  }
});

// Complete exercise
router.post('/completions/:completionId/complete', authenticateToken, async (req, res) => {
  try {
    const { completionId } = req.params;
    const { durationSeconds, moodAfter, rating, notes } = req.body;

    const completion = await exerciseService.completeExercise(completionId, {
      durationSeconds,
      moodAfter,
      rating,
      notes,
    });

    res.json({ completion });
  } catch (error) {
    console.error('Error completing exercise:', error);
    res.status(500).json({ error: 'Failed to complete exercise' });
  }
});

// Get user completions
router.get('/completions/mine', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    const completions = await exerciseService.getUserCompletions(userId, limit);
    res.json({ completions });
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

// Get user stats
router.get('/stats/mine', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await exerciseService.getUserStats(userId);
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ===== WEEKLY PLANNING ENDPOINTS =====

// Create/update weekly plan
router.post('/weekly-plans', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { weekStartDate, weekEndDate, reflections, intentions, focusAreas, goals } = req.body;

    const plan = await exerciseService.createWeeklyPlan(userId, {
      weekStartDate,
      weekEndDate,
      reflections,
      intentions,
      focusAreas,
      goals,
    });

    res.json({ plan });
  } catch (error) {
    console.error('Error creating weekly plan:', error);
    res.status(500).json({ error: 'Failed to create weekly plan' });
  }
});

// Get weekly plan by date
router.get('/weekly-plans/:weekStartDate', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { weekStartDate } = req.params;

    const plan = await exerciseService.getWeeklyPlan(userId, weekStartDate);
    
    if (!plan) {
      return res.status(404).json({ error: 'Weekly plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    console.error('Error fetching weekly plan:', error);
    res.status(500).json({ error: 'Failed to fetch weekly plan' });
  }
});

// Get current week plan
router.get('/weekly-plans/current/mine', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const plan = await exerciseService.getCurrentWeekPlan(userId);
    
    // Also send current week dates for convenience
    const weekStart = exerciseService.getCurrentWeekStart();
    const weekEnd = exerciseService.getCurrentWeekEnd();

    res.json({ 
      plan,
      currentWeek: { weekStart, weekEnd }
    });
  } catch (error) {
    console.error('Error fetching current week plan:', error);
    res.status(500).json({ error: 'Failed to fetch current week plan' });
  }
});

// Get user's weekly plans
router.get('/weekly-plans/mine/all', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const plans = await exerciseService.getUserWeeklyPlans(userId, limit);
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching weekly plans:', error);
    res.status(500).json({ error: 'Failed to fetch weekly plans' });
  }
});

// ===== WEEKLY REVIEW ENDPOINTS =====

// Create weekly review
router.post('/weekly-reviews', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { 
      weeklyPlanId, 
      weekStartDate, 
      weekEndDate, 
      intentionRatings, 
      wins, 
      challenges, 
      learnings, 
      gratitude,
      sharedToCommunity 
    } = req.body;

    const review = await exerciseService.createWeeklyReview(userId, {
      weeklyPlanId,
      weekStartDate,
      weekEndDate,
      intentionRatings,
      wins,
      challenges,
      learnings,
      gratitude,
      sharedToCommunity,
    });

    res.json({ review });
  } catch (error) {
    console.error('Error creating weekly review:', error);
    res.status(500).json({ error: 'Failed to create weekly review' });
  }
});

// Get weekly review by date
router.get('/weekly-reviews/:weekStartDate', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { weekStartDate } = req.params;

    const review = await exerciseService.getWeeklyReview(userId, weekStartDate);
    
    if (!review) {
      return res.status(404).json({ error: 'Weekly review not found' });
    }

    res.json({ review });
  } catch (error) {
    console.error('Error fetching weekly review:', error);
    res.status(500).json({ error: 'Failed to fetch weekly review' });
  }
});

// Get user's weekly reviews
router.get('/weekly-reviews/mine/all', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const reviews = await exerciseService.getUserWeeklyReviews(userId, limit);
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching weekly reviews:', error);
    res.status(500).json({ error: 'Failed to fetch weekly reviews' });
  }
});

export default router;
