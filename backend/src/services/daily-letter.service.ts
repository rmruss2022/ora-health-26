/**
 * Daily Letter Service
 * Generates personalized AI letters to users each day based on their activity
 */

import OpenAI from 'openai';
import { letterService } from './letter.service';
import { vectorSearchService } from './vector-search.service';

interface UserContext {
  userId: string;
  userName: string;
  recentJournalEntries: Array<{
    content: string;
    date: Date;
    category: string;
  }>;
  currentGoals: string[];
  recentBehaviors: string[];
  meditationStreak: number;
  lastLoginDate: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
}

interface LetterContent {
  subject: string;
  body: string;
  tone: 'supportive' | 'encouraging' | 'reflective' | 'celebratory';
}

export class DailyLetterService {
  private openai: OpenAI;
  private readonly SYSTEM_USER_ID = 'ora-ai-system';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate and send daily letter to a user
   */
  async generateAndSendDailyLetter(userId: string): Promise<boolean> {
    try {
      console.log(`[DailyLetter] Generating letter for user ${userId}`);

      // STEP 1: Gather user context
      const context = await this.gatherUserContext(userId);
      
      if (!context) {
        console.log(`[DailyLetter] Insufficient context for user ${userId}`);
        return false;
      }

      // STEP 2: Generate personalized letter
      const letter = await this.generateLetter(context);

      // STEP 3: Send letter via letter service
      await letterService.createLetter({
        sender_id: this.SYSTEM_USER_ID, // System/Ora AI sender
        recipient_id: userId,
        subject: letter.subject,
        body: letter.body,
        is_ai_generated: true,
      });

      console.log(`[DailyLetter] Successfully sent letter to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`[DailyLetter] Error generating letter for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Generate daily letters for all active users
   */
  async generateDailyLettersForAllUsers(): Promise<{
    total: number;
    successful: number;
    failed: number;
  }> {
    try {
      // Get list of active users (logged in within last 7 days)
      const result = await vectorSearchService.pool.query(
        `SELECT id FROM users 
         WHERE last_login >= NOW() - INTERVAL '7 days'
         AND daily_letter_enabled = true
         ORDER BY id`
      );

      const users = result.rows;
      let successful = 0;
      let failed = 0;

      // Process in batches to avoid rate limits
      for (const user of users) {
        const success = await this.generateAndSendDailyLetter(user.id);
        if (success) {
          successful++;
        } else {
          failed++;
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[DailyLetter] Batch complete: ${successful}/${users.length} successful`);

      return {
        total: users.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('[DailyLetter] Error in batch generation:', error);
      return { total: 0, successful: 0, failed: 0 };
    }
  }

  /**
   * Gather user context from various sources
   */
  private async gatherUserContext(userId: string): Promise<UserContext | null> {
    try {
      // Get user profile
      const userResult = await vectorSearchService.pool.query(
        `SELECT name, last_login FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      const user = userResult.rows[0];

      // Get recent journal entries (last 7 days)
      const journalResult = await vectorSearchService.pool.query(
        `SELECT content, created_at, category 
         FROM journal_entries 
         WHERE user_id = $1 
         AND created_at >= NOW() - INTERVAL '7 days'
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      );

      // Get current goals
      const goalsResult = await vectorSearchService.pool.query(
        `SELECT goal_text 
         FROM user_goals 
         WHERE user_id = $1 
         AND status = 'active'
         LIMIT 3`,
        [userId]
      );

      // Get recent behaviors
      const behaviorsResult = await vectorSearchService.pool.query(
        `SELECT DISTINCT to_behavior_id 
         FROM behavior_transitions 
         WHERE user_id = $1 
         AND timestamp >= NOW() - INTERVAL '3 days'
         LIMIT 5`,
        [userId]
      );

      // Get meditation streak
      const streakResult = await vectorSearchService.pool.query(
        `SELECT COUNT(DISTINCT DATE(completed_at)) as streak
         FROM meditation_sessions
         WHERE user_id = $1
         AND completed_at >= NOW() - INTERVAL '30 days'`,
        [userId]
      );

      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

      return {
        userId,
        userName: user.name || 'there',
        recentJournalEntries: journalResult.rows.map(row => ({
          content: row.content,
          date: row.created_at,
          category: row.category,
        })),
        currentGoals: goalsResult.rows.map(row => row.goal_text),
        recentBehaviors: behaviorsResult.rows.map(row => row.to_behavior_id),
        meditationStreak: streakResult.rows[0]?.streak || 0,
        lastLoginDate: user.last_login,
        timeOfDay,
        dayOfWeek,
      };
    } catch (error) {
      console.error('Error gathering user context:', error);
      return null;
    }
  }

  /**
   * Generate personalized letter content using LLM
   */
  private async generateLetter(context: UserContext): Promise<LetterContent> {
    try {
      const tone = this.selectLetterTone(context);
      const prompt = this.buildLetterPrompt(context, tone);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are Ora, a warm and empathetic AI wellness companion. You write daily letters to users as part of their wellness journey.

Your letters should:
- Be personal and reference specific details from their recent activity
- Be warm but not overly effusive
- Be 2-3 short paragraphs (150-250 words)
- Feel like a note from a supportive friend, not a therapist
- End with gentle encouragement or a thoughtful question
- Use natural, conversational language

Respond in JSON format:
{
  "subject": "Letter subject line (4-8 words)",
  "body": "Letter content (2-3 paragraphs)"
}`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8, // Higher temp for more natural, varied writing
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        subject: result.subject || `Good ${context.timeOfDay}, ${context.userName}`,
        body: result.body || this.getFallbackLetter(context),
        tone,
      };
    } catch (error) {
      console.error('Error generating letter with LLM:', error);
      
      // Fallback letter
      return {
        subject: `Good ${context.timeOfDay}, ${context.userName}`,
        body: this.getFallbackLetter(context),
        tone: 'supportive',
      };
    }
  }

  /**
   * Select appropriate tone based on user context
   */
  private selectLetterTone(
    context: UserContext
  ): 'supportive' | 'encouraging' | 'reflective' | 'celebratory' {
    // Celebratory: streak milestone
    if (context.meditationStreak >= 7) {
      return 'celebratory';
    }

    // Encouraging: user has been active recently
    const daysSinceLogin = Math.floor(
      (Date.now() - context.lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLogin <= 1 && context.recentJournalEntries.length > 0) {
      return 'encouraging';
    }

    // Reflective: user has journal entries to reflect on
    if (context.recentJournalEntries.length >= 3) {
      return 'reflective';
    }

    // Default: supportive
    return 'supportive';
  }

  /**
   * Build prompt for LLM letter generation
   */
  private buildLetterPrompt(
    context: UserContext,
    tone: string
  ): string {
    let prompt = `Write a ${tone} daily letter to ${context.userName}.

## Context

Time: ${context.timeOfDay}, ${context.dayOfWeek}
`;

    if (context.recentJournalEntries.length > 0) {
      prompt += `\nRecent journal reflections (last 7 days):\n`;
      context.recentJournalEntries.slice(0, 3).forEach((entry, i) => {
        const snippet = entry.content.slice(0, 150);
        prompt += `- ${snippet}${entry.content.length > 150 ? '...' : ''}\n`;
      });
    }

    if (context.currentGoals.length > 0) {
      prompt += `\nCurrent goals:\n`;
      context.currentGoals.forEach(goal => {
        prompt += `- ${goal}\n`;
      });
    }

    if (context.meditationStreak > 0) {
      prompt += `\nMeditation streak: ${context.meditationStreak} days\n`;
    }

    if (context.recentBehaviors.length > 0) {
      prompt += `\nRecent activities: ${context.recentBehaviors.join(', ')}\n`;
    }

    prompt += `\n## Tone: ${tone}

Write a letter that acknowledges where they are, offers support or insight, and provides gentle encouragement.`;

    return prompt;
  }

  /**
   * Fallback letter when LLM fails
   */
  private getFallbackLetter(context: UserContext): string {
    return `Hi ${context.userName},

I wanted to check in with you this ${context.timeOfDay}. ${
      context.recentJournalEntries.length > 0
        ? "I've been reflecting on what you've shared recently, and I'm grateful you're taking time for yourself."
        : "I'm here whenever you're ready to reflect or chat."
    }

${
      context.meditationStreak > 0
        ? `Your ${context.meditationStreak}-day meditation streak is wonderful—keep going! `
        : ""
    }Remember, small steps forward are still progress.

Take care,
Ora`;
  }

  /**
   * Check if user should receive a daily letter today
   */
  async shouldSendLetterToday(userId: string): Promise<boolean> {
    try {
      // Check if they've already received a letter today
      const result = await vectorSearchService.pool.query(
        `SELECT COUNT(*) as count 
         FROM letters 
         WHERE recipient_id = $1 
         AND sender_id = $2
         AND sent_at >= CURRENT_DATE
         AND is_ai_generated = true`,
        [userId, this.SYSTEM_USER_ID]
      );

      const alreadySentToday = result.rows[0]?.count > 0;
      
      if (alreadySentToday) {
        return false;
      }

      // Check if user has daily letters enabled
      const userResult = await vectorSearchService.pool.query(
        `SELECT daily_letter_enabled FROM users WHERE id = $1`,
        [userId]
      );

      return userResult.rows[0]?.daily_letter_enabled !== false; // Default true
    } catch (error) {
      console.error('Error checking letter eligibility:', error);
      return false;
    }
  }

  /**
   * Schedule daily letter generation (to be called by cron job)
   */
  static async scheduledGeneration(): Promise<void> {
    const service = new DailyLetterService();
    const result = await service.generateDailyLettersForAllUsers();
    
    console.log(`[DailyLetter] Scheduled generation complete:`, result);
  }
}

// Singleton instance
export const dailyLetterService = new DailyLetterService();
