/**
 * Weekly Planning Service
 * Handles weekly planning prompts and AI interactions
 */

import { query } from '../config/database';
import { agentMemoryService } from './agent-memory.service';
import { pushNotificationService } from './push-notification.service';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  intentions: string;
  aiPrompt?: string;
  aiResponse?: string;
  goals?: any;
  createdAt: string;
}

export class WeeklyPlanningService {
  /**
   * Send weekly planning prompt to user
   */
  async sendPlanningPrompt(userId: string): Promise<boolean> {
    try {
      // Check if user has planning enabled
      const shouldSend = await pushNotificationService.shouldSendNotification(
        userId,
        'reminder'
      );

      if (!shouldSend) {
        console.log(`User ${userId} has planning notifications disabled`);
        return false;
      }

      // Get user memory context
      const memoryContext = await agentMemoryService.getUserMemoryContext(userId);
      const contextSummary = agentMemoryService.formatContextForPrompt(memoryContext);

      // Generate personalized prompt
      const prompt = await this.generatePersonalizedPrompt(contextSummary, memoryContext);

      // Send push notification
      const sent = await pushNotificationService.sendToUser({
        userId,
        title: '🌅 Plan Your Week',
        body: prompt,
        data: {
          type: 'weekly_planning',
          context: contextSummary,
        },
        channelId: 'planning',
        priority: 'high',
      });

      // Log the notification
      await query(
        `INSERT INTO push_notification_logs
         (user_id, notification_type, title, body, status)
         VALUES ($1, 'weekly_planning', $2, $3, $4)`,
        [userId, '🌅 Plan Your Week', prompt, sent ? 'sent' : 'error']
      );

      return sent;
    } catch (error) {
      console.error('Error sending planning prompt:', error);
      return false;
    }
  }

  /**
   * Generate personalized planning prompt using AI
   */
  private async generatePersonalizedPrompt(
    contextSummary: string,
    memoryContext: any
  ): Promise<string> {
    try {
      const systemPrompt = `You are a mindful wellness coach helping users plan their week. 
Generate a warm, encouraging prompt (max 100 chars) that:
- References their recent progress if available
- Encourages them to set intentions
- Is personal and motivating

Context: ${contextSummary}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: 'Generate a brief, warm weekly planning prompt.'
        }],
        system: systemPrompt,
      });

      const promptText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'What intentions do you want to set this week?';

      // Ensure it's not too long for push notification
      return promptText.length > 120 
        ? promptText.substring(0, 117) + '...'
        : promptText;
    } catch (error) {
      console.error('Error generating personalized prompt:', error);
      // Fallback to generic prompt
      return 'What intentions do you want to set this week?';
    }
  }

  /**
   * Save user's weekly plan
   */
  async saveWeeklyPlan(
    userId: string,
    intentions: string,
    goals?: any
  ): Promise<WeeklyPlan> {
    try {
      // Get Monday of current week
      const weekStart = this.getMondayOfWeek(new Date());

      // Generate AI response/encouragement
      const memoryContext = await agentMemoryService.getUserMemoryContext(userId);
      const aiResponse = await this.generateEncouragement(intentions, memoryContext);

      const result = await query(
        `INSERT INTO weekly_plans
         (user_id, week_start_date, intentions, ai_response, goals)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, week_start_date)
         DO UPDATE SET
           intentions = EXCLUDED.intentions,
           ai_response = EXCLUDED.ai_response,
           goals = EXCLUDED.goals,
           updated_at = NOW()
         RETURNING 
           id,
           user_id as "userId",
           week_start_date::text as "weekStartDate",
           intentions,
           ai_response as "aiResponse",
           goals,
           created_at::text as "createdAt"`,
        [userId, weekStart, intentions, aiResponse, goals ? JSON.stringify(goals) : null]
      );

      // Clear cache so next fetch gets updated data
      await agentMemoryService.clearCache(userId);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving weekly plan:', error);
      throw error;
    }
  }

  /**
   * Generate AI encouragement for user's intentions
   */
  private async generateEncouragement(
    intentions: string,
    memoryContext: any
  ): Promise<string> {
    try {
      const systemPrompt = `You are a supportive wellness coach. The user has set these intentions: "${intentions}"

Provide brief, warm encouragement (2-3 sentences max) that:
- Acknowledges their intentions
- Offers practical support
- Is genuine and motivating

${memoryContext.meditationHistory?.totalSessions > 0 ? 
  `Note: They've completed ${memoryContext.meditationHistory.totalSessions} meditation sessions.` : ''}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: 'Generate encouragement for my weekly intentions.'
        }],
        system: systemPrompt,
      });

      return response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Beautiful intentions! Take it one day at a time.';
    } catch (error) {
      console.error('Error generating encouragement:', error);
      return 'Beautiful intentions! Take it one day at a time. 🌟';
    }
  }

  /**
   * Get user's weekly plans
   */
  async getUserWeeklyPlans(userId: string, limit: number = 10): Promise<WeeklyPlan[]> {
    try {
      const result = await query(
        `SELECT 
           id,
           user_id as "userId",
           week_start_date::text as "weekStartDate",
           intentions,
           ai_prompt as "aiPrompt",
           ai_response as "aiResponse",
           goals,
           created_at::text as "createdAt"
         FROM weekly_plans
         WHERE user_id = $1
         ORDER BY week_start_date DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching weekly plans:', error);
      return [];
    }
  }

  /**
   * Get current week's plan
   */
  async getCurrentWeekPlan(userId: string): Promise<WeeklyPlan | null> {
    try {
      const weekStart = this.getMondayOfWeek(new Date());

      const result = await query(
        `SELECT 
           id,
           user_id as "userId",
           week_start_date::text as "weekStartDate",
           intentions,
           ai_prompt as "aiPrompt",
           ai_response as "aiResponse",
           goals,
           created_at::text as "createdAt"
         FROM weekly_plans
         WHERE user_id = $1
         AND week_start_date = $2`,
        [userId, weekStart]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching current week plan:', error);
      return null;
    }
  }

  /**
   * Get Monday of the week for a given date
   */
  private getMondayOfWeek(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Send planning prompts to all eligible users
   */
  async sendPlanningPromptsToAll(): Promise<{ sent: number; failed: number }> {
    try {
      console.log('🌅 Sending weekly planning prompts to all eligible users...');

      // Get users with planning enabled
      const result = await query(
        `SELECT user_id
         FROM user_notification_preferences
         WHERE weekly_planning_enabled = true
         AND notifications_enabled = true`
      );

      let sent = 0;
      let failed = 0;

      for (const row of result.rows) {
        const success = await this.sendPlanningPrompt(row.user_id);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }

      console.log(`✅ Planning prompts sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Error sending planning prompts to all users:', error);
      return { sent: 0, failed: 0 };
    }
  }
}

// Singleton instance
export const weeklyPlanningService = new WeeklyPlanningService();
