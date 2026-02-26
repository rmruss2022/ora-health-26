import { collectiveSessionService } from '../services/collective-session.service';
import { websocketService } from '../services/websocket.service';
import { pushNotificationService } from '../services/push-notification.service';

/**
 * Collective Meditation Session Scheduler
 * 
 * Runs periodically to:
 * 1. Create upcoming sessions (7am, 12pm, 6pm, 9pm daily)
 * 2. Start sessions when their scheduled time arrives
 * 3. Send 5-minute warning notifications
 * 4. End sessions when duration completes
 */

// Session times (24-hour format, UTC)
const SESSION_TIMES = [7, 12, 18, 21]; // 7am, 12pm, 6pm, 9pm
const SESSION_DURATION = 10; // minutes
const WARNING_MINUTES = 5;

interface ScheduledSession {
  id: string;
  scheduledTime: Date;
  durationMinutes: number;
  startedAt?: Date;
  endedAt?: Date;
}

/**
 * Create sessions for the next 24 hours if they don't exist
 */
export async function ensureUpcomingSessions(): Promise<void> {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create sessions for today and tomorrow
    for (const day of [now, tomorrow]) {
      for (const hour of SESSION_TIMES) {
        const sessionTime = new Date(day);
        sessionTime.setHours(hour, 0, 0, 0);

        // Skip if session time has passed
        if (sessionTime < now) continue;

        // Check if session already exists
        const existing = await checkSessionExists(sessionTime);
        if (existing) continue;

        // Create session
        await collectiveSessionService.createSession(sessionTime, SESSION_DURATION);
        console.log(`[Scheduler] Created session for ${sessionTime.toISOString()}`);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error ensuring upcoming sessions:', error);
  }
}

/**
 * Check if a session exists for a specific time (within 1 minute tolerance)
 */
async function checkSessionExists(scheduledTime: Date): Promise<boolean> {
  try {
    return await collectiveSessionService.sessionExistsAtTime(scheduledTime);
  } catch (error) {
    console.error('[Scheduler] Error checking if session exists:', error);
    return false;
  }
}

/**
 * Check for sessions that should start now
 */
export async function startDueSessions(): Promise<void> {
  try {
    const now = new Date();
    const upcoming = await collectiveSessionService.getUpcomingSession();

    if (!upcoming) return;

    const scheduledTime = new Date(upcoming.scheduledTime);
    const diffMs = scheduledTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    // If session should start now (within 1 minute)
    if (diffMinutes <= 0 && diffMinutes > -2) {
      await collectiveSessionService.startSession(upcoming.id);
      
      // Push notification that session started
      await pushNotificationService.sendCollectiveSessionStarted(
        upcoming.participantCount || 0,
        upcoming.id
      );

      console.log(`[Scheduler] Started session ${upcoming.id}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error starting due sessions:', error);
  }
}

/**
 * Send 5-minute warning for upcoming sessions
 */
export async function sendWarningNotifications(): Promise<void> {
  try {
    const now = new Date();
    const upcoming = await collectiveSessionService.getUpcomingSession();

    if (!upcoming) return;

    const scheduledTime = new Date(upcoming.scheduledTime);
    const diffMs = scheduledTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    // If exactly 5 minutes away (within 30-second window)
    if (diffMinutes === WARNING_MINUTES) {
      // WebSocket notification
      websocketService.notifyCollectiveSessionStarting(upcoming.id, {
        scheduledTime: upcoming.scheduledTime.toString(),
        durationMinutes: upcoming.durationMinutes,
        participantCount: upcoming.participantCount || 0,
      });

      // Push notification
      await pushNotificationService.sendCollectiveSessionWarning(
        upcoming.participantCount || 0,
        upcoming.id
      );

      console.log(`[Scheduler] Sent 5-minute warning for session ${upcoming.id}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error sending warning notifications:', error);
  }
}

/**
 * End sessions that have exceeded their duration
 */
export async function endCompletedSessions(): Promise<void> {
  try {
    const active = await collectiveSessionService.getActiveSession();

    if (!active || !active.startedAt) return;

    const now = new Date();
    const startTime = new Date(active.startedAt);
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);

    // If session duration has passed
    if (elapsedMinutes >= active.durationMinutes) {
      await collectiveSessionService.completeSession(active.id);
      console.log(`[Scheduler] Ended session ${active.id}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error ending completed sessions:', error);
  }
}

/**
 * Main scheduler function - run every minute
 */
export async function runCollectiveSessionScheduler(): Promise<void> {
  console.log('[Scheduler] Running collective session scheduler...');

  try {
    await ensureUpcomingSessions();
    await sendWarningNotifications();
    await startDueSessions();
    await endCompletedSessions();
  } catch (error) {
    console.error('[Scheduler] Error in scheduler:', error);
  }
}

/**
 * Start the scheduler (call this once on server startup)
 */
export function startCollectiveSessionScheduler(): void {
  console.log('[Scheduler] Starting collective session scheduler');

  // Run immediately
  runCollectiveSessionScheduler();

  // Then run every minute
  setInterval(() => {
    runCollectiveSessionScheduler();
  }, 60 * 1000); // Every 1 minute
}
