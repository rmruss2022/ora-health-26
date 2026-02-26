/**
 * Agent Memory Service
 * Retrieves and caches user context for personalized AI prompts
 */

import { query } from '../config/database';

export interface UserMemoryContext {
  meditationHistory: {
    totalSessions: number;
    totalMinutes: number;
    recentSessions: Array<{
      date: string;
      duration: number;
      type?: string;
    }>;
    favoriteTime?: string;
    longestStreak?: number;
  };
  moodPatterns: {
    recentMoods: Array<{
      date: string;
      mood: string;
      score?: number;
    }>;
    averageMood?: number;
    trends?: string;
  };
  communityActivity: {
    totalPosts: number;
    recentPosts: Array<{
      date: string;
      content: string;
      reactions: number;
    }>;
    engagementLevel?: string;
  };
  weeklyPlans: {
    lastPlan?: {
      date: string;
      intentions: string;
    };
    planningStreak?: number;
    completionRate?: number;
  };
  weeklyReviews: {
    lastReview?: {
      date: string;
      reflection: string;
      learnings?: string;
    };
    reviewStreak?: number;
  };
}

export class AgentMemoryService {
  /**
   * Get complete user memory context for AI agents
   */
  async getUserMemoryContext(userId: string): Promise<UserMemoryContext> {
    try {
      // Check cache first
      const cachedMemory = await this.getCachedMemory(userId);
      if (cachedMemory) {
        return cachedMemory;
      }

      // Build fresh memory context
      const [
        meditationHistory,
        moodPatterns,
        communityActivity,
        weeklyPlans,
        weeklyReviews,
      ] = await Promise.all([
        this.getMeditationHistory(userId),
        this.getMoodPatterns(userId),
        this.getCommunityActivity(userId),
        this.getWeeklyPlans(userId),
        this.getWeeklyReviews(userId),
      ]);

      const memoryContext: UserMemoryContext = {
        meditationHistory,
        moodPatterns,
        communityActivity,
        weeklyPlans,
        weeklyReviews,
      };

      // Cache for 1 hour
      await this.cacheMemory(userId, memoryContext, 60);

      return memoryContext;
    } catch (error) {
      console.error('Error getting user memory context:', error);
      // Return empty context on error
      return this.getEmptyContext();
    }
  }

  /**
   * Get meditation history for user
   */
  private async getMeditationHistory(userId: string) {
    try {
      const result = await query(
        `WITH recent AS (
          SELECT created_at::date as date, COALESCE(duration_completed, 0) as duration
          FROM meditation_sessions
          WHERE user_id = $1
          AND created_at > NOW() - INTERVAL '90 days'
          ORDER BY created_at DESC
          LIMIT 10
        )
        SELECT
          (SELECT COUNT(*) FROM meditation_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '90 days') as total_sessions,
          (SELECT COALESCE(SUM(duration_completed), 0) FROM meditation_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '90 days') as total_minutes,
          (SELECT json_agg(json_build_object('date', date, 'duration', duration)) FROM recent) as recent_sessions`,
        [userId]
      );

      const row = result.rows[0];

      return {
        totalSessions: parseInt(row?.total_sessions || '0'),
        totalMinutes: parseInt(row?.total_minutes || '0'),
        recentSessions: row?.recent_sessions || [],
      };
    } catch (error) {
      console.error('Error fetching meditation history:', error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        recentSessions: [],
      };
    }
  }

  /**
   * Get mood patterns for user
   */
  private async getMoodPatterns(userId: string) {
    try {
      // Fetch from weekly reviews and daily reflections
      const result = await query(
        `SELECT 
          created_at::date as date,
          mood_score as score
         FROM weekly_reviews
         WHERE user_id = $1
         AND mood_score IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 12`,
        [userId]
      );

      const recentMoods = result.rows.map(row => ({
        date: row.date,
        mood: row.score >= 7 ? 'positive' : row.score >= 4 ? 'neutral' : 'challenging',
        score: row.score,
      }));

      const averageMood = recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + (m.score || 0), 0) / recentMoods.length
        : undefined;

      return {
        recentMoods,
        averageMood: averageMood ? Math.round(averageMood * 10) / 10 : undefined,
      };
    } catch (error) {
      console.error('Error fetching mood patterns:', error);
      return {
        recentMoods: [],
      };
    }
  }

  /**
   * Get community activity for user
   */
  private async getCommunityActivity(userId: string) {
    try {
      const result = await query(
        `WITH recent AS (
          SELECT 
            created_at::date as date,
            SUBSTRING(content, 1, 100) as content,
            (SELECT COUNT(*) FROM reactions WHERE post_id = community_posts.id) as reactions
          FROM community_posts
          WHERE user_id = $1
          AND created_at > NOW() - INTERVAL '90 days'
          ORDER BY created_at DESC
          LIMIT 5
        )
        SELECT 
          (SELECT COUNT(*) FROM community_posts WHERE user_id = $1 AND created_at > NOW() - INTERVAL '90 days') as total_posts,
          (SELECT json_agg(json_build_object('date', date, 'content', content, 'reactions', reactions)) FROM recent) as recent_posts`,
        [userId, userId]
      );

      const row = result.rows[0];

      return {
        totalPosts: parseInt(row?.total_posts || '0'),
        recentPosts: row?.recent_posts || [],
      };
    } catch (error) {
      console.error('Error fetching community activity:', error);
      return {
        totalPosts: 0,
        recentPosts: [],
      };
    }
  }

  /**
   * Get weekly plans for user
   */
  private async getWeeklyPlans(userId: string) {
    try {
      const result = await query(
        `SELECT 
          week_start_date,
          intentions,
          created_at
         FROM weekly_plans
         WHERE user_id = $1
         ORDER BY week_start_date DESC
         LIMIT 10`,
        [userId]
      );

      const lastPlan = result.rows[0];
      const planningStreak = this.calculateStreak(
        result.rows.map(r => new Date(r.week_start_date))
      );

      return {
        lastPlan: lastPlan ? {
          date: lastPlan.week_start_date,
          intentions: lastPlan.intentions,
        } : undefined,
        planningStreak,
      };
    } catch (error) {
      console.error('Error fetching weekly plans:', error);
      return {};
    }
  }

  /**
   * Get weekly reviews for user
   */
  private async getWeeklyReviews(userId: string) {
    try {
      const result = await query(
        `SELECT 
          week_start_date,
          reflection,
          learnings,
          created_at
         FROM weekly_reviews
         WHERE user_id = $1
         ORDER BY week_start_date DESC
         LIMIT 10`,
        [userId]
      );

      const lastReview = result.rows[0];
      const reviewStreak = this.calculateStreak(
        result.rows.map(r => new Date(r.week_start_date))
      );

      return {
        lastReview: lastReview ? {
          date: lastReview.week_start_date,
          reflection: lastReview.reflection,
          learnings: lastReview.learnings,
        } : undefined,
        reviewStreak,
      };
    } catch (error) {
      console.error('Error fetching weekly reviews:', error);
      return {};
    }
  }

  /**
   * Calculate streak from dates (weekly basis)
   */
  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = dates[i];
      const previous = dates[i + 1];
      
      const daysDiff = Math.floor(
        (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if dates are ~7 days apart (allow +/- 2 days for flexibility)
      if (daysDiff >= 5 && daysDiff <= 9) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get cached memory from database
   */
  private async getCachedMemory(userId: string): Promise<UserMemoryContext | null> {
    try {
      const result = await query(
        `SELECT context_data
         FROM agent_memory_cache
         WHERE user_id = $1
         AND memory_type = 'full_context'
         AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length > 0) {
        return result.rows[0].context_data as UserMemoryContext;
      }

      return null;
    } catch (error) {
      console.error('Error fetching cached memory:', error);
      return null;
    }
  }

  /**
   * Cache memory in database
   */
  private async cacheMemory(
    userId: string,
    context: UserMemoryContext,
    expiryMinutes: number
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO agent_memory_cache
         (user_id, memory_type, context_data, expires_at)
         VALUES ($1, 'full_context', $2, NOW() + INTERVAL '${expiryMinutes} minutes')
         ON CONFLICT (id) DO UPDATE
         SET context_data = EXCLUDED.context_data,
             expires_at = EXCLUDED.expires_at,
             updated_at = NOW()`,
        [userId, JSON.stringify(context)]
      );
    } catch (error) {
      console.error('Error caching memory:', error);
    }
  }

  /**
   * Get empty context structure
   */
  private getEmptyContext(): UserMemoryContext {
    return {
      meditationHistory: {
        totalSessions: 0,
        totalMinutes: 0,
        recentSessions: [],
      },
      moodPatterns: {
        recentMoods: [],
      },
      communityActivity: {
        totalPosts: 0,
        recentPosts: [],
      },
      weeklyPlans: {},
      weeklyReviews: {},
    };
  }

  /**
   * Clear cache for user (useful when data changes)
   */
  async clearCache(userId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM agent_memory_cache
         WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Format memory context into natural language for AI prompts
   */
  formatContextForPrompt(context: UserMemoryContext): string {
    const parts: string[] = [];

    // Meditation history
    if (context.meditationHistory.totalSessions > 0) {
      parts.push(
        `You've completed ${context.meditationHistory.totalSessions} meditation sessions (${context.meditationHistory.totalMinutes} minutes total).`
      );
    }

    // Recent meditation
    if (context.meditationHistory.recentSessions.length > 0) {
      const lastSession = context.meditationHistory.recentSessions[0];
      parts.push(`Your last meditation was on ${lastSession.date}.`);
    }

    // Mood patterns
    if (context.moodPatterns.averageMood) {
      const moodDesc = context.moodPatterns.averageMood >= 7 ? 'positive' :
                       context.moodPatterns.averageMood >= 4 ? 'balanced' : 'challenging';
      parts.push(`Your recent mood has been ${moodDesc}.`);
    }

    // Community engagement
    if (context.communityActivity.totalPosts > 0) {
      parts.push(`You've shared ${context.communityActivity.totalPosts} posts with the community.`);
    }

    // Last week's plan
    if (context.weeklyPlans.lastPlan) {
      parts.push(`Last week, you set these intentions: "${context.weeklyPlans.lastPlan.intentions}"`);
    }

    // Planning streak
    if (context.weeklyPlans.planningStreak && context.weeklyPlans.planningStreak > 1) {
      parts.push(`You're on a ${context.weeklyPlans.planningStreak}-week planning streak! 🎉`);
    }

    // Last review
    if (context.weeklyReviews.lastReview) {
      parts.push(`In your last review, you reflected: "${context.weeklyReviews.lastReview.reflection.substring(0, 100)}..."`);
    }

    return parts.join(' ');
  }
}

// Singleton instance
export const agentMemoryService = new AgentMemoryService();
