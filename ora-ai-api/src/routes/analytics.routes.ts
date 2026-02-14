import { Router } from 'express';
import { analyticsService } from '../services/analytics.service';

const router = Router();

/**
 * POST /api/analytics/events
 * Track one or more analytics events
 */
router.post('/events', async (req, res) => {
  try {
    const { events } = req.body;

    // Validate request
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'events must be a non-empty array',
      });
    }

    // Validate each event
    for (const event of events) {
      if (!event.userId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Each event must have a userId',
        });
      }
      if (!event.eventType) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Each event must have an eventType',
        });
      }
    }

    // Track events
    await analyticsService.trackEvents(events);

    res.status(201).json({
      success: true,
      tracked: events.length,
    });
  } catch (error) {
    console.error('Error tracking analytics events:', error);
    res.status(500).json({
      error: 'Failed to track events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/events/user/:userId
 * Get events for a specific user
 */
router.get('/events/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { eventTypes, startDate, endDate, limit, offset } = req.query;

    const options: any = {};

    if (eventTypes) {
      options.eventTypes = Array.isArray(eventTypes)
        ? eventTypes
        : [eventTypes as string];
    }
    if (startDate) options.startDate = startDate as string;
    if (endDate) options.endDate = endDate as string;
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);

    const events = await analyticsService.getUserEvents(userId, options);

    res.json({
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/stats/user/:userId
 * Get event statistics for a specific user
 */
router.get('/stats/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await analyticsService.getUserEventStats(userId);

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/stats
 * Get global event statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await analyticsService.getGlobalStats(
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/timeline
 * Get events grouped by day for time-series analysis
 */
router.get('/timeline', async (req, res) => {
  try {
    const { eventType, days } = req.query;

    const timeline = await analyticsService.getEventsByDay(
      eventType as string | undefined,
      days ? parseInt(days as string) : 30
    );

    res.json({ timeline });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      error: 'Failed to fetch timeline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
