import { query } from '../config/database';

export interface Meditation {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  icon: string;
  audioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeditationSession {
  id: string;
  userId: string;
  meditationId: string;
  startedAt: Date;
  completedAt?: Date;
  durationCompleted?: number;
}

export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  completedThisWeek: number;
  lastMeditationDate?: Date;
}

export class MeditationService {
  async getAllMeditations(): Promise<Meditation[]> {
    const queryText = `
      SELECT
        id, title, description, duration, category, icon,
        audio_url as "audioUrl", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM meditations
      ORDER BY created_at DESC
    `;

    const result = await query(queryText);
    return result.rows;
  }

  async getMeditationsByCategory(category: string): Promise<Meditation[]> {
    const queryText = `
      SELECT
        id, title, description, duration, category, icon,
        audio_url as "audioUrl", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM meditations
      WHERE category = $1
      ORDER BY created_at DESC
    `;

    const result = await query(queryText, [category]);
    return result.rows;
  }

  async getMeditationById(id: string): Promise<Meditation | null> {
    const queryText = `
      SELECT
        id, title, description, duration, category, icon,
        audio_url as "audioUrl", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM meditations
      WHERE id = $1
    `;

    const result = await query(queryText, [id]);
    return result.rows[0] || null;
  }

  async startSession(userId: string, meditationId: string): Promise<MeditationSession> {
    const queryText = `
      INSERT INTO meditation_sessions (user_id, meditation_id, started_at)
      VALUES ($1, $2, NOW())
      RETURNING
        id, user_id as "userId", meditation_id as "meditationId",
        started_at as "startedAt"
    `;

    const result = await query(queryText, [userId, meditationId]);
    return result.rows[0];
  }

  async completeSession(
    sessionId: string,
    durationCompleted: number
  ): Promise<MeditationSession> {
    const queryText = `
      UPDATE meditation_sessions
      SET completed_at = NOW(), duration_completed = $2
      WHERE id = $1
      RETURNING
        id, user_id as "userId", meditation_id as "meditationId",
        started_at as "startedAt", completed_at as "completedAt",
        duration_completed as "durationCompleted"
    `;

    const result = await query(queryText, [sessionId, durationCompleted]);
    return result.rows[0];
  }

  async getUserSessions(userId: string, limit = 10): Promise<MeditationSession[]> {
    const queryText = `
      SELECT
        ms.id, ms.user_id as "userId", ms.meditation_id as "meditationId",
        ms.started_at as "startedAt", ms.completed_at as "completedAt",
        ms.duration_completed as "durationCompleted",
        m.title as "meditationTitle", m.icon as "meditationIcon"
      FROM meditation_sessions ms
      JOIN meditations m ON ms.meditation_id = m.id
      WHERE ms.user_id = $1
      ORDER BY ms.started_at DESC
      LIMIT $2
    `;

    const result = await query(queryText, [userId, limit]);
    return result.rows;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    // Get basic stats
    const statsQuery = `
      SELECT
        COUNT(*) as "totalSessions",
        COALESCE(SUM(duration_completed), 0) as "totalMinutes"
      FROM meditation_sessions
      WHERE user_id = $1 AND completed_at IS NOT NULL
    `;

    const weekQuery = `
      SELECT COUNT(*) as "completedThisWeek"
      FROM meditation_sessions
      WHERE user_id = $1
        AND completed_at IS NOT NULL
        AND started_at >= NOW() - INTERVAL '7 days'
    `;

    const lastSessionQuery = `
      SELECT DATE(completed_at) as "lastDate"
      FROM meditation_sessions
      WHERE user_id = $1 AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 1
    `;

    const [statsResult, weekResult, lastSessionResult] = await Promise.all([
      query(statsQuery, [userId]),
      query(weekQuery, [userId]),
      query(lastSessionQuery, [userId])
    ]);

    // Calculate streak
    const streak = await this.calculateStreak(userId);

    return {
      totalSessions: parseInt(statsResult.rows[0].totalSessions),
      totalMinutes: parseInt(statsResult.rows[0].totalMinutes),
      currentStreak: streak.current,
      longestStreak: streak.longest,
      completedThisWeek: parseInt(weekResult.rows[0].completedThisWeek),
      lastMeditationDate: lastSessionResult.rows[0]?.lastDate,
    };
  }

  /**
   * Calculate current and longest meditation streak
   */
  private async calculateStreak(userId: string): Promise<{ current: number; longest: number }> {
    // Get all meditation dates (distinct days with completed sessions)
    const datesQuery = `
      SELECT DISTINCT DATE(completed_at) as meditation_date
      FROM meditation_sessions
      WHERE user_id = $1 AND completed_at IS NOT NULL
      ORDER BY meditation_date DESC
    `;

    const result = await query(datesQuery, [userId]);
    const dates = result.rows.map(row => new Date(row.meditation_date));

    if (dates.length === 0) {
      return { current: 0, longest: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if most recent date is today or yesterday for current streak
    const lastDate = dates[0];
    lastDate.setHours(0, 0, 0, 0);
    
    if (lastDate.getTime() === today.getTime() || lastDate.getTime() === yesterday.getTime()) {
      currentStreak = 1;
      
      // Calculate current streak by checking consecutive days
      for (let i = 1; i < dates.length; i++) {
        const current = dates[i];
        const previous = dates[i - 1];
        current.setHours(0, 0, 0, 0);
        previous.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < dates.length; i++) {
      const current = dates[i];
      const previous = dates[i - 1];
      current.setHours(0, 0, 0, 0);
      previous.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }
}

export const meditationService = new MeditationService();
