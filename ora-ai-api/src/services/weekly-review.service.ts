/**
 * Weekly Review Service
 * Handles end-of-week reviews and AI analysis
 */

import { query } from '../config/database';
import { agentMemoryService } from './agent-memory.service';
import { pushNotificationService } from './push-notification.service';
import { weeklyPlanningService } from './weekly-planning.service';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface WeeklyReview {
  id: string;
  userId: string;
  weeklyPlanId?: string;
  weekStartDate: string;
  reflection: string;
  learnings?: string;
  wins?: string;
  challenges?: string;
  aiAnalysis?: string;
  moodScore?: number;
  createdAt: string;
}

export class WeeklyReviewService {
  /**
   * Send weekly review prompt to user
   */
  async sendReviewPrompt(userId: string): Promise<boolean> {
    try {
      // Check if user has review enabled
      const shouldSend = await pushNotificationService.shouldSendNotification(
        userId,
        'reminder'
      );

      if (!shouldSend) {
        console.log(`User ${userId} has review notifications disabled`);
        return false;
      }

      // Get user memory context
      const memoryContext = await agentMemoryService.getUserMemoryContext(userId);
      
      // Get this week's plan if exists
      const currentPlan = await weeklyPlanningService.getCurrentWeekPlan(userId);

      // Generate personalized review prompt
      const prompt = await this.generateReviewPrompt(memoryContext, currentPlan);

      // Send push notification
      const sent = await pushNotificationService.sendToUser({
        userId,
        title: '🌟 Reflect on Your Week',
        body: prompt,
        data: {
          type: 'weekly_review',
          hasPlan: !!currentPlan,
          planId: currentPlan?.id,
        },
        channelId: 'review',
        priority: 'high',
      });

      // Log the notification
      await query(
        `INSERT INTO push_notification_logs
         (user_id, notification_type, title, body, status)
         VALUES ($1, 'weekly_review', $2, $3, $4)`,
        [userId, '🌟 Reflect on Your Week', prompt, sent ? 'sent' : 'error']
      );

      return sent;
    } catch (error) {
      console.error('Error sending review prompt:', error);
      return false;
    }
  }

  /**
   * Generate personalized review prompt
   */
  private async generateReviewPrompt(
    memoryContext: any,
    currentPlan?: any
  ): Promise<string> {
    try {
      let systemPrompt = `You are a mindful wellness coach helping users reflect on their week.
Generate a warm, thoughtful prompt (max 100 chars) that encourages reflection.`;

      if (currentPlan) {
        systemPrompt += `\n\nTheir week's intentions were: "${currentPlan.intentions}"`;
      }

      if (memoryContext.meditationHistory?.recentSessions?.length > 0) {
        systemPrompt += `\n\nThey meditated ${memoryContext.meditationHistory.recentSessions.length} times this week.`;
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: 'Generate a brief, warm weekly reflection prompt.'
        }],
        system: systemPrompt,
      });

      const promptText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'How did your week go? What did you learn?';

      return promptText.length > 120 
        ? promptText.substring(0, 117) + '...'
        : promptText;
    } catch (error) {
      console.error('Error generating review prompt:', error);
      return 'How did your week go? What did you learn?';
    }
  }

  /**
   * Save user's weekly review
   */
  async saveWeeklyReview(
    userId: string,
    reflection: string,
    options?: {
      learnings?: string;
      wins?: string;
      challenges?: string;
      moodScore?: number;
    }
  ): Promise<WeeklyReview> {
    try {
      // Get Monday of current week
      const weekStart = this.getMondayOfWeek(new Date());

      // Get this week's plan
      const currentPlan = await weeklyPlanningService.getCurrentWeekPlan(userId);

      // Generate AI analysis
      const memoryContext = await agentMemoryService.getUserMemoryContext(userId);
      const aiAnalysis = await this.generateAnalysis(
        reflection,
        currentPlan?.intentions,
        memoryContext,
        options
      );

      const result = await query(
        `INSERT INTO weekly_reviews
         (user_id, weekly_plan_id, week_start_date, reflection, learnings, wins, challenges, ai_analysis, mood_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id, week_start_date)
         DO UPDATE SET
           reflection = EXCLUDED.reflection,
           learnings = EXCLUDED.learnings,
           wins = EXCLUDED.wins,
           challenges = EXCLUDED.challenges,
           ai_analysis = EXCLUDED.ai_analysis,
           mood_score = EXCLUDED.mood_score,
           updated_at = NOW()
         RETURNING 
           id,
           user_id as "userId",
           weekly_plan_id as "weeklyPlanId",
           week_start_date::text as "weekStartDate",
           reflection,
           learnings,
           wins,
           challenges,
           ai_analysis as "aiAnalysis",
           mood_score as "moodScore",
           created_at::text as "createdAt"`,
        [
          userId,
          currentPlan?.id || null,
          weekStart,
          reflection,
          options?.learnings || null,
          options?.wins || null,
          options?.challenges || null,
          aiAnalysis,
          options?.moodScore || null,
        ]
      );

      // Clear cache so next fetch gets updated data
      await agentMemoryService.clearCache(userId);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving weekly review:', error);
      throw error;
    }
  }

  /**
   * Generate AI analysis comparing plan vs reality
   */
  private async generateAnalysis(
    reflection: string,
    intentions?: string,
    memoryContext?: any,
    options?: any
  ): Promise<string> {
    try {
      let systemPrompt = `You are a supportive wellness coach analyzing a user's weekly review.

User's reflection: "${reflection}"`;

      if (intentions) {
        systemPrompt += `\n\nTheir original intentions were: "${intentions}"`;
      }

      if (options?.wins) {
        systemPrompt += `\n\nWins: ${options.wins}`;
      }

      if (options?.challenges) {
        systemPrompt += `\n\nChallenges: ${options.challenges}`;
      }

      systemPrompt += `\n\nProvide brief, warm feedback (2-3 sentences) that:
- Acknowledges their growth
- Highlights progress or insights
- Offers gentle encouragement for next week`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 250,
        messages: [{
          role: 'user',
          content: 'Analyze my week and provide feedback.'
        }],
        system: systemPrompt,
      });

      return response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Thank you for taking time to reflect. Every week brings growth. 🌱';
    } catch (error) {
      console.error('Error generating analysis:', error);
      return 'Thank you for taking time to reflect. Every week brings growth. 🌱';
    }
  }

  /**
   * Get user's weekly reviews
   */
  async getUserWeeklyReviews(userId: string, limit: number = 10): Promise<WeeklyReview[]> {
    try {
      const result = await query(
        `SELECT 
           id,
           user_id as "userId",
           weekly_plan_id as "weeklyPlanId",
           week_start_date::text as "weekStartDate",
           reflection,
           learnings,
           wins,
           challenges,
           ai_analysis as "aiAnalysis",
           mood_score as "moodScore",
           created_at::text as "createdAt"
         FROM weekly_reviews
         WHERE user_id = $1
         ORDER BY week_start_date DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching weekly reviews:', error);
      return [];
    }
  }

  /**
   * Get current week's review
   */
  async getCurrentWeekReview(userId: string): Promise<WeeklyReview | null> {
    try {
      const weekStart = this.getMondayOfWeek(new Date());

      const result = await query(
        `SELECT 
           id,
           user_id as "userId",
           weekly_plan_id as "weeklyPlanId",
           week_start_date::text as "weekStartDate",
           reflection,
           learnings,
           wins,
           challenges,
           ai_analysis as "aiAnalysis",
           mood_score as "moodScore",
           created_at::text as "createdAt"
         FROM weekly_reviews
         WHERE user_id = $1
         AND week_start_date = $2`,
        [userId, weekStart]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching current week review:', error);
      return null;
    }
  }

  /**
   * Get Monday of the week for a given date
   */
  private getMondayOfWeek(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Send review prompts to all eligible users
   */
  async sendReviewPromptsToAll(): Promise<{ sent: number; failed: number }> {
    try {
      console.log('🌟 Sending weekly review prompts to all eligible users...');

      const result = await query(
        `SELECT user_id
         FROM user_notification_preferences
         WHERE weekly_review_enabled = true
         AND notifications_enabled = true`
      );

      let sent = 0;
      let failed = 0;

      for (const row of result.rows) {
        const success = await this.sendReviewPrompt(row.user_id);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }

      console.log(`✅ Review prompts sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Error sending review prompts to all users:', error);
      return { sent: 0, failed: 0 };
    }
  }
}

// Singleton instance
export const weeklyReviewService = new WeeklyReviewService();
