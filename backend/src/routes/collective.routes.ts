import { Router } from 'express';
import { collectiveSessionService } from '../services/collective-session.service';

const router = Router();

/**
 * POST /api/collective/sessions
 * Create a new collective meditation session
 */
router.post('/sessions', async (req, res) => {
  try {
    const { scheduledTime, durationMinutes } = req.body;

    if (!scheduledTime || !durationMinutes) {
      return res.status(400).json({
        error: 'scheduledTime and durationMinutes are required',
      });
    }

    const session = await collectiveSessionService.createSession(
      new Date(scheduledTime),
      durationMinutes
    );

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating collective session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/collective/sessions/active
 * Get the currently active session
 */
router.get('/sessions/active', async (req, res) => {
  try {
    const session = await collectiveSessionService.getActiveSession();

    if (!session) {
      return res.status(404).json({ message: 'No active session' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error getting active session:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});

/**
 * GET /api/collective/sessions/upcoming
 * Get the next scheduled session
 */
router.get('/sessions/upcoming', async (req, res) => {
  try {
    const session = await collectiveSessionService.getUpcomingSession();

    if (!session) {
      return res.status(404).json({ message: 'No upcoming session' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error getting upcoming session:', error);
    res.status(500).json({ error: 'Failed to get upcoming session' });
  }
});

/**
 * POST /api/collective/sessions/:id/start
 * Start a session
 */
router.post('/sessions/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await collectiveSessionService.startSession(id);
    res.json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * POST /api/collective/sessions/:id/join
 * Join a collective session
 */
router.post('/sessions/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const participant = await collectiveSessionService.joinSession(id, userId);
    res.json(participant);
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

/**
 * POST /api/collective/sessions/:id/leave
 * Leave a collective session
 */
router.post('/sessions/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await collectiveSessionService.leaveSession(id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({ error: 'Failed to leave session' });
  }
});

/**
 * POST /api/collective/sessions/:id/complete
 * Mark session as completed for the user
 */
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || (req as any).user?.id;
    const { emoji, shareToCommunity } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await collectiveSessionService.completeSessionForUser(id, userId, emoji, shareToCommunity);
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing session for user:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

/**
 * POST /api/collective/sessions/:id/end
 * End a session (admin/system)
 */
router.post('/sessions/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await collectiveSessionService.completeSession(id);
    res.json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

/**
 * GET /api/collective/sessions/:id/stats
 * Get statistics for a session
 */
router.get('/sessions/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await collectiveSessionService.getSessionStats(id);
    res.json(stats);
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({ error: 'Failed to get session stats' });
  }
});

/**
 * GET /api/collective/sessions/:id/participants
 * Get participants for a session
 */
router.get('/sessions/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const participants = await collectiveSessionService.getSessionParticipants(id);
    res.json(participants);
  } catch (error) {
    console.error('Error getting session participants:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

export default router;
