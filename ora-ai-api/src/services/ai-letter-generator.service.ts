/**
 * AI Letter Generator Service
 * Generates personalized daily letters for users using LLM
 */

import OpenAI from 'openai';
import { query } from '../config/database';

interface LetterGenerationContext {
  userId: string;
  userName?: string;
  recentJournalEntries?: Array<{ content: string; date: Date }>;
  currentGoals?: string[];
  userMood?: string;
  recentActivity?: string;
  conversationSummary?: string;
  preferences?: {
    preferredTone?: 'supportive' | 'encouraging' | 'reflective' | 'energizing';
    topics?: string[];
  };
}

interface GeneratedLetter {
  subject: string;
  body: string;
  category: string;
  tone: string;
}

export class AILetterGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a personalized daily letter for a user
   */
  async generateDailyLetter(context: LetterGenerationContext): Promise<GeneratedLetter> {
    try {
      const prompt = this.buildLetterPrompt(context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Ora, a warm and supportive AI wellness companion. You write personalized letters to users each morning to encourage, support, and inspire them. Your letters should be:
- Warm and personal (like a letter from a caring friend)
- 150-250 words in length
- Reflective of their recent experiences and goals
- Encouraging without being overly cheerful
- Authentic and thoughtful
- Inclusive and non-judgmental

Format your response as JSON:
{
  "subject": "A warm, engaging subject line (5-10 words)",
  "body": "The full letter text",
  "category": "one of: support, reflection, encouragement, insight, gratitude",
  "tone": "one of: supportive, encouraging, reflective, energizing"
}`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      const letter = JSON.parse(content);

      return {
        subject: letter.subject || 'A Morning Note from Ora',
        body: letter.body || 'Good morning! Wishing you a peaceful day ahead.',
        category: letter.category || 'support',
        tone: letter.tone || 'supportive',
      };
    } catch (error) {
      console.error('Error generating AI letter:', error);
      // Fallback to template
      return this.getFallbackLetter(context);
    }
  }

  /**
   * Build the prompt for letter generation
   */
  private buildLetterPrompt(context: LetterGenerationContext): string {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = this.getTimeOfDay();

    let prompt = `Write a personalized morning letter for ${context.userName || 'the user'}.
Today is ${dayOfWeek} ${timeOfDay}.

`;

    if (context.recentJournalEntries && context.recentJournalEntries.length > 0) {
      prompt += `Recent journal reflections:\n`;
      context.recentJournalEntries.slice(0, 3).forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        const preview = entry.content.substring(0, 150);
        prompt += `- ${date}: "${preview}${entry.content.length > 150 ? '...' : ''}"\n`;
      });
      prompt += '\n';
    }

    if (context.currentGoals && context.currentGoals.length > 0) {
      prompt += `Current goals/intentions:\n`;
      context.currentGoals.forEach(goal => {
        prompt += `- ${goal}\n`;
      });
      prompt += '\n';
    }

    if (context.userMood) {
      prompt += `Recent mood/state: ${context.userMood}\n\n`;
    }

    if (context.conversationSummary) {
      prompt += `Recent conversation context: ${context.conversationSummary}\n\n`;
    }

    prompt += `Preferred tone: ${context.preferences?.preferredTone || 'supportive'}\n\n`;

    prompt += `Write a warm, personal letter that:
1. Acknowledges where they are right now
2. Offers gentle encouragement or insight based on their recent reflections
3. Suggests a small intention or question for the day ahead
4. Feels authentic and caring, not generic

Write the letter now.`;

    return prompt;
  }

  /**
   * Get fallback letter when AI generation fails
   */
  private getFallbackLetter(context: LetterGenerationContext): GeneratedLetter {
    const userName = context.userName || 'friend';
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    return {
      subject: `Good Morning, ${userName}`,
      body: `Good morning, ${userName},

I hope this ${dayOfWeek} finds you well. I've been thinking about your journey, and I want you to know that every step you're taking matters—even the small ones that might not feel significant in the moment.

Today, I encourage you to be gentle with yourself. Notice the moments of peace, however brief. Pay attention to what brings you comfort or clarity.

If you'd like to share what's on your mind, I'm here to listen.

Warmly,
Ora`,
      category: 'support',
      tone: 'supportive',
    };
  }

  /**
   * Get time of day context
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'early morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Gather context for a user to generate their daily letter
   */
  async gatherUserContext(userId: string): Promise<LetterGenerationContext> {
    try {
      // Get user profile
      const userResult = await query(
        `SELECT name FROM users WHERE id = $1`,
        [userId]
      );
      const userName = userResult.rows[0]?.name;

      // Get recent journal entries (last 7 days)
      const journalResult = await query(
        `SELECT content, created_at as date
         FROM journal_entries
         WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      );

      const recentJournalEntries = journalResult.rows.map(row => ({
        content: row.content,
        date: row.date,
      }));

      // Get current goals/intentions
      const goalsResult = await query(
        `SELECT goal_text
         FROM user_goals
         WHERE user_id = $1
         AND is_active = true
         ORDER BY created_at DESC
         LIMIT 3`,
        [userId]
      );

      const currentGoals = goalsResult.rows.map(row => row.goal_text);

      // Get user preferences
      const prefsResult = await query(
        `SELECT daily_letter_enabled, preferred_delivery_time, preferred_categories, metadata
         FROM user_letter_preferences
         WHERE user_id = $1`,
        [userId]
      );

      const prefs = prefsResult.rows[0];

      // Get recent conversation state
      const stateResult = await query(
        `SELECT active_behavior_id, last_user_message, metadata
         FROM conversation_state
         WHERE user_id = $1`,
        [userId]
      );

      const state = stateResult.rows[0];

      return {
        userId,
        userName,
        recentJournalEntries,
        currentGoals,
        conversationSummary: state?.last_user_message,
        preferences: {
          preferredTone: prefs?.metadata?.preferred_tone || 'supportive',
          topics: prefs?.preferred_categories,
        },
      };
    } catch (error) {
      console.error('Error gathering user context:', error);
      return { userId };
    }
  }

  /**
   * Send a daily letter to a user
   */
  async sendDailyLetterToUser(userId: string): Promise<{ success: boolean; letterId?: string }> {
    try {
      // Check if user has daily letters enabled
      const prefsResult = await query(
        `SELECT daily_letter_enabled, max_daily_letters
         FROM user_letter_preferences
         WHERE user_id = $1`,
        [userId]
      );

      const prefs = prefsResult.rows[0];
      if (prefs && !prefs.daily_letter_enabled) {
        return { success: false };
      }

      // Check if user already received a letter today
      const todayResult = await query(
        `SELECT COUNT(*) as count
         FROM letters
         WHERE recipient_id = $1
         AND is_ai_generated = true
         AND sent_at >= DATE_TRUNC('day', NOW())`,
        [userId]
      );

      const todayCount = parseInt(todayResult.rows[0]?.count || '0');
      const maxDaily = prefs?.max_daily_letters || 1;

      if (todayCount >= maxDaily) {
        console.log(`User ${userId} already received ${todayCount} letters today`);
        return { success: false };
      }

      // Gather context and generate letter
      const context = await this.gatherUserContext(userId);
      const letter = await this.generateDailyLetter(context);

      // Insert letter into database
      const result = await query(
        `INSERT INTO letters
         (sender_id, recipient_id, subject, body, is_ai_generated, ai_category, metadata, sent_at)
         VALUES (NULL, $1, $2, $3, true, $4, $5, NOW())
         RETURNING id`,
        [
          userId,
          letter.subject,
          letter.body,
          letter.category,
          JSON.stringify({ tone: letter.tone, auto_generated: true }),
        ]
      );

      const letterId = result.rows[0]?.id;

      // Send push notification
      try {
        const { pushNotificationService } = await import('./push-notification.service');
        const shouldNotify = await pushNotificationService.shouldSendNotification(
          userId,
          'letter'
        );

        if (shouldNotify) {
          await pushNotificationService.sendLetterNotification(
            userId,
            'Ora AI',
            letter.subject,
            letterId
          );
        }
      } catch (error) {
        console.error('Error sending letter notification:', error);
      }

      console.log(`Sent daily letter to user ${userId}: ${letterId}`);
      return { success: true, letterId };
    } catch (error) {
      console.error(`Error sending daily letter to user ${userId}:`, error);
      return { success: false };
    }
  }

  /**
   * Send daily letters to all eligible users
   */
  async sendDailyLettersToAllUsers(): Promise<{
    sent: number;
    failed: number;
    skipped: number;
  }> {
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Get all users with daily letters enabled
      const usersResult = await query(
        `SELECT DISTINCT u.id
         FROM users u
         INNER JOIN user_letter_preferences ulp ON u.id = ulp.user_id
         WHERE ulp.daily_letter_enabled = true`
      );

      const users = usersResult.rows;
      console.log(`Sending daily letters to ${users.length} users...`);

      for (const user of users) {
        const result = await this.sendDailyLetterToUser(user.id);
        if (result.success) {
          sent++;
        } else if (result.letterId) {
          skipped++;
        } else {
          failed++;
        }
      }

      console.log(`Daily letter batch complete: ${sent} sent, ${skipped} skipped, ${failed} failed`);

      return { sent, failed, skipped };
    } catch (error) {
      console.error('Error in daily letter batch:', error);
      return { sent, failed: 999, skipped };
    }
  }
}

// Singleton instance
export const aiLetterGeneratorService = new AILetterGeneratorService();
