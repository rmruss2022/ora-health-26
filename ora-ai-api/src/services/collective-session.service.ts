import { query } from '../config/database';

export interface CollectiveSession {
  id: string;
  scheduledTime: Date;
  durationMinutes: number;
  startedAt?: Date;
  endedAt?: Date;
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectiveParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date;
  completed: boolean;
  postSessionEmoji?: string;
}

export interface SessionStats {
  participantCount: number;
  activeParticipants: number;
  completedParticipants: number;
}

export class CollectiveSessionService {
  /**
   * Create a new collective meditation session
   */
  async createSession(scheduledTime: Date, durationMinutes: number): Promise<CollectiveSession> {
    const queryText = `
      INSERT INTO collective_sessions (scheduled_time, duration_minutes)
      VALUES ($1, $2)
      RETURNING 
        id,
        scheduled_time as "scheduledTime",
        duration_minutes as "durationMinutes",
        started_at as "startedAt",
        ended_at as "endedAt",
        participant_count as "participantCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query(queryText, [scheduledTime, durationMinutes]);
    return result.rows[0];
  }

  /**
   * Get the currently active session (started but not ended)
   */
  async getActiveSession(): Promise<CollectiveSession | null> {
    const queryText = `
      SELECT 
        id,
        scheduled_time as "scheduledTime",
        duration_minutes as "durationMinutes",
        started_at as "startedAt",
        ended_at as "endedAt",
        participant_count as "participantCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM collective_sessions
      WHERE started_at IS NOT NULL AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `;

    const result = await query(queryText);
    return result.rows[0] || null;
  }

  /**
   * Get upcoming session (scheduled but not started)
   */
  async getUpcomingSession(): Promise<CollectiveSession | null> {
    const queryText = `
      SELECT 
        id,
        scheduled_time as "scheduledTime",
        duration_minutes as "durationMinutes",
        started_at as "startedAt",
        ended_at as "endedAt",
        participant_count as "participantCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM collective_sessions
      WHERE started_at IS NULL AND scheduled_time > NOW()
      ORDER BY scheduled_time ASC
      LIMIT 1
    `;

    const result = await query(queryText);
    return result.rows[0] || null;
  }

  /**
   * Start a session (mark as started)
   */
  async startSession(sessionId: string): Promise<CollectiveSession> {
    const queryText = `
      UPDATE collective_sessions
      SET started_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id,
        scheduled_time as "scheduledTime",
        duration_minutes as "durationMinutes",
        started_at as "startedAt",
        ended_at as "endedAt",
        participant_count as "participantCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query(queryText, [sessionId]);
    return result.rows[0];
  }

  /**
   * Join a collective session
   */
  async joinSession(sessionId: string, userId: string): Promise<CollectiveParticipant> {
    // Insert participant
    const insertQuery = `
      INSERT INTO collective_participants (session_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (session_id, user_id) DO UPDATE
      SET left_at = NULL, joined_at = NOW()
      RETURNING 
        id,
        session_id as "sessionId",
        user_id as "userId",
        joined_at as "joinedAt",
        left_at as "leftAt",
        completed,
        post_session_emoji as "postSessionEmoji"
    `;

    const participantResult = await query(insertQuery, [sessionId, userId]);

    // Update participant count
    await this.updateParticipantCount(sessionId);

    return participantResult.rows[0];
  }

  /**
   * Leave a collective session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const updateQuery = `
      UPDATE collective_participants
      SET left_at = NOW()
      WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL
    `;

    await query(updateQuery, [sessionId, userId]);
    await this.updateParticipantCount(sessionId);
  }

  /**
   * Mark session as completed for a user
   */
  async completeSessionForUser(
    sessionId: string,
    userId: string,
    emoji?: string
  ): Promise<void> {
    const updateQuery = `
      UPDATE collective_participants
      SET completed = true, post_session_emoji = $3
      WHERE session_id = $1 AND user_id = $2
    `;

    await query(updateQuery, [sessionId, userId, emoji]);
  }

  /**
   * Get current participant count for a session
   */
  async getParticipantCount(sessionId: string): Promise<number> {
    const queryText = `
      SELECT COUNT(*) as count
      FROM collective_participants
      WHERE session_id = $1 AND left_at IS NULL
    `;

    const result = await query(queryText, [sessionId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<SessionStats> {
    const queryText = `
      SELECT 
        COUNT(*) as total_participants,
        COUNT(*) FILTER (WHERE left_at IS NULL) as active_participants,
        COUNT(*) FILTER (WHERE completed = true) as completed_participants
      FROM collective_participants
      WHERE session_id = $1
    `;

    const result = await query(queryText, [sessionId]);
    const row = result.rows[0];

    return {
      participantCount: parseInt(row.total_participants),
      activeParticipants: parseInt(row.active_participants),
      completedParticipants: parseInt(row.completed_participants),
    };
  }

  /**
   * Complete a session (mark as ended)
   */
  async completeSession(sessionId: string): Promise<CollectiveSession> {
    const queryText = `
      UPDATE collective_sessions
      SET ended_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id,
        scheduled_time as "scheduledTime",
        duration_minutes as "durationMinutes",
        started_at as "startedAt",
        ended_at as "endedAt",
        participant_count as "participantCount",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query(queryText, [sessionId]);
    return result.rows[0];
  }

  /**
   * Update the cached participant count on a session
   */
  private async updateParticipantCount(sessionId: string): Promise<void> {
    const count = await this.getParticipantCount(sessionId);

    const updateQuery = `
      UPDATE collective_sessions
      SET participant_count = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await query(updateQuery, [count, sessionId]);
  }

  /**
   * Get participants for a session
   */
  async getSessionParticipants(sessionId: string): Promise<CollectiveParticipant[]> {
    const queryText = `
      SELECT 
        id,
        session_id as "sessionId",
        user_id as "userId",
        joined_at as "joinedAt",
        left_at as "leftAt",
        completed,
        post_session_emoji as "postSessionEmoji"
      FROM collective_participants
      WHERE session_id = $1
      ORDER BY joined_at DESC
    `;

    const result = await query(queryText, [sessionId]);
    return result.rows;
  }
}

export const collectiveSessionService = new CollectiveSessionService();
