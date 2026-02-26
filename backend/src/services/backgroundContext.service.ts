/**
 * Background Context Service
 * Analyzes user data to generate context for dynamic backgrounds
 */

import { query } from '../config/database';

export interface UserContext {
  userId: string;
  activityLevel: 'low' | 'medium' | 'high';
  dominantMood: string;
  recentBehaviors: string[];
  journalFrequency: number; // entries per week
  meditationStreak: number; // days
  engagementScore: number; // 0-100
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  wellnessScore: number; // 0-100
}

export interface VisualizationData {
  type: 'wave' | 'particle' | 'gradient' | 'graph' | 'mandala';
  colors: string[];
  intensity: number;
  complexity: number;
  data: number[];
}

export class BackgroundContextService {
  /**
   * Get comprehensive user context for background generation
   */
  async getUserContext(userId: string): Promise<UserContext> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get journal activity
    const journalQuery = await query(
      `SELECT COUNT(*) as count FROM journal_entries 
       WHERE user_id = $1 AND created_at > $2`,
      [userId, weekAgo]
    );
    const journalFrequency = parseInt(journalQuery.rows[0]?.count || '0');

    // Get chat/behavior activity
    const behaviorQuery = await query(
      `SELECT behavior_id, COUNT(*) as count 
       FROM chat_messages 
       WHERE user_id = $1 AND created_at > $2 
       GROUP BY behavior_id 
       ORDER BY count DESC`,
      [userId, weekAgo]
    );
    const recentBehaviors = behaviorQuery.rows.map((row: any) => row.behavior_id);

    // Get meditation streak (simplified)
    const meditationQuery = await query(
      `SELECT COUNT(DISTINCT DATE(created_at)) as streak 
       FROM meditation_sessions 
       WHERE user_id = $1 AND created_at > $2`,
      [userId, weekAgo]
    );
    const meditationStreak = parseInt(meditationQuery.rows[0]?.streak || '0');

    // Calculate activity level
    const totalActivity = journalFrequency + recentBehaviors.length + meditationStreak;
    const activityLevel = totalActivity > 15 ? 'high' : totalActivity > 7 ? 'medium' : 'low';

    // Determine dominant mood (from journal entries)
    const moodQuery = await query(
      `SELECT mood, COUNT(*) as count 
       FROM journal_entries 
       WHERE user_id = $1 AND created_at > $2 AND mood IS NOT NULL 
       GROUP BY mood 
       ORDER BY count DESC 
       LIMIT 1`,
      [userId, weekAgo]
    );
    const dominantMood = moodQuery.rows[0]?.mood || 'neutral';

    // Calculate engagement score
    const engagementScore = Math.min(100, Math.round(
      (journalFrequency * 10) + 
      (recentBehaviors.length * 5) + 
      (meditationStreak * 8)
    ));

    // Determine time of day
    const hour = now.getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Calculate wellness score (composite)
    const wellnessScore = Math.round(
      (engagementScore * 0.4) + 
      (meditationStreak * 5) + 
      (journalFrequency * 3)
    );

    return {
      userId,
      activityLevel,
      dominantMood,
      recentBehaviors,
      journalFrequency,
      meditationStreak,
      engagementScore,
      timeOfDay,
      wellnessScore: Math.min(100, wellnessScore),
    };
  }

  /**
   * Generate visualization data based on user context
   */
  generateVisualizationData(context: UserContext): VisualizationData {
    // Select visualization type based on context
    const type = this.selectVisualizationType(context);
    
    // Generate color palette based on mood and time
    const colors = this.generateColorPalette(context);
    
    // Calculate intensity based on activity level
    const intensity = context.activityLevel === 'high' ? 0.8 
                    : context.activityLevel === 'medium' ? 0.5 
                    : 0.3;
    
    // Calculate complexity based on engagement
    const complexity = Math.min(1, context.engagementScore / 100);
    
    // Generate data points for visualization
    const data = this.generateDataPoints(context);

    return {
      type,
      colors,
      intensity,
      complexity,
      data,
    };
  }

  private selectVisualizationType(context: UserContext): VisualizationData['type'] {
    // High activity users get dynamic particles
    if (context.activityLevel === 'high' && context.engagementScore > 70) {
      return 'particle';
    }
    
    // Meditation-focused users get mandalas
    if (context.meditationStreak >= 5) {
      return 'mandala';
    }
    
    // Active journalers get graphs
    if (context.journalFrequency >= 4) {
      return 'graph';
    }
    
    // Evening/night users get waves
    if (context.timeOfDay === 'evening' || context.timeOfDay === 'night') {
      return 'wave';
    }
    
    // Default to gradient
    return 'gradient';
  }

  private generateColorPalette(context: UserContext): string[] {
    const moodColors: Record<string, string[]> = {
      happy: ['#FFD700', '#FFA500', '#FF6B6B'],
      grateful: ['#4ECDC4', '#44E3C6', '#95E1D3'],
      calm: ['#6C5CE7', '#A29BFE', '#74B9FF'],
      energetic: ['#FF7675', '#FD79A8', '#FDCB6E'],
      reflective: ['#A29BFE', '#74B9FF', '#81ECEC'],
      neutral: ['#B2BEC3', '#74B9FF', '#A29BFE'],
    };

    const timeColors: Record<string, string[]> = {
      morning: ['#FEF5E7', '#FAD7A0', '#F8C471'],
      afternoon: ['#AED6F1', '#85C1E2', '#5DADE2'],
      evening: ['#D7BDE2', '#BB8FCE', '#A569BD'],
      night: ['#5D6D7E', '#34495E', '#2C3E50'],
    };

    // Blend mood and time colors
    const mood = moodColors[context.dominantMood] || moodColors.neutral;
    const time = timeColors[context.timeOfDay];

    return [...mood.slice(0, 2), ...time.slice(0, 2)];
  }

  private generateDataPoints(context: UserContext): number[] {
    // Generate data points representing activity over time
    const points: number[] = [];
    const count = 30; // 30 data points

    // Base pattern on engagement score
    const base = context.engagementScore / 100;
    
    for (let i = 0; i < count; i++) {
      // Create wave pattern with some randomness
      const wave = Math.sin(i * 0.2) * 0.3;
      const random = Math.random() * 0.2;
      const value = Math.max(0, Math.min(1, base + wave + random));
      points.push(value);
    }

    return points;
  }

  /**
   * Get activity trend data for graphs
   */
  async getActivityTrend(userId: string, days: number = 30): Promise<number[]> {
    const result = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM (
         SELECT created_at FROM journal_entries WHERE user_id = $1
         UNION ALL
         SELECT created_at FROM chat_messages WHERE user_id = $1
         UNION ALL
         SELECT created_at FROM meditation_sessions WHERE user_id = $1
       ) activities
       WHERE created_at > NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );

    // Fill in missing days with 0
    const data: number[] = new Array(days).fill(0);
    result.rows.forEach((row: any) => {
      const dayIndex = Math.floor(
        (new Date().getTime() - new Date(row.date).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < days) {
        data[days - 1 - dayIndex] = parseInt(row.count);
      }
    });

    return data;
  }
}

export const backgroundContextService = new BackgroundContextService();
