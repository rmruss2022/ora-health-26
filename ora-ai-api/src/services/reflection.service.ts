import { query } from '../config/database';
import { communityService } from './community.service';

export interface DailyPrompt {
  id: string;
  date: string;
  question: string;
  category: string;
  createdAt: Date;
}

export interface ReflectionResponse {
  id: string;
  userId: string;
  promptId: string;
  response: string;
  isPublic: boolean;
  createdAt: Date;
}

// Prompt bank - in production, these would be in the database
const PROMPT_BANK = [
  {
    question: 'What are you carrying today that is not yours?',
    category: 'introspection',
  },
  {
    question: 'Where did you feel most alive this week?',
    category: 'introspection',
  },
  {
    question: 'What would you do if you were not afraid?',
    category: 'intention',
  },
  {
    question: 'What made you smile today?',
    category: 'gratitude',
  },
  {
    question: 'What do you need to forgive yourself for?',
    category: 'introspection',
  },
  {
    question: 'What small moment brought you peace today?',
    category: 'gratitude',
  },
  {
    question: 'What truth are you avoiding?',
    category: 'introspection',
  },
  {
    question: 'Who do you want to become?',
    category: 'intention',
  },
  {
    question: 'What are you grateful for right now?',
    category: 'gratitude',
  },
  {
    question: 'What boundary do you need to set?',
    category: 'intention',
  },
];

export class ReflectionService {
  /**
   * Get or create the daily prompt for a given date
   */
  async getDailyPrompt(date?: Date): Promise<DailyPrompt> {
    const targetDate = date || new Date();
    const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if prompt exists for this date
    const checkQuery = `
      SELECT 
        id,
        date,
        question,
        category,
        created_at as "createdAt"
      FROM daily_prompts
      WHERE date = $1
    `;

    const existing = await query(checkQuery, [dateString]);

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new prompt for this date
    // Use date to deterministically select a prompt (same prompt each day)
    const dayOfYear = Math.floor(
      (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const promptIndex = dayOfYear % PROMPT_BANK.length;
    const selectedPrompt = PROMPT_BANK[promptIndex];

    const insertQuery = `
      INSERT INTO daily_prompts (date, question, category)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        date,
        question,
        category,
        created_at as "createdAt"
    `;

    const result = await query(insertQuery, [
      dateString,
      selectedPrompt.question,
      selectedPrompt.category,
    ]);

    return result.rows[0];
  }

  /**
   * Save a user's reflection response
   */
  async saveReflectionResponse(
    userId: string,
    promptId: string,
    response: string,
    isPublic: boolean = false
  ): Promise<ReflectionResponse> {
    const insertQuery = `
      INSERT INTO reflection_responses (user_id, prompt_id, response, is_public)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, prompt_id) 
      DO UPDATE SET 
        response = EXCLUDED.response,
        is_public = EXCLUDED.is_public,
        created_at = NOW()
      RETURNING 
        id,
        user_id as "userId",
        prompt_id as "promptId",
        response,
        is_public as "isPublic",
        created_at as "createdAt"
    `;

    const result = await query(insertQuery, [userId, promptId, response, isPublic]);
    const reflectionResponse = result.rows[0];

    // If public, create a community post
    if (isPublic) {
      try {
        // Get the prompt text
        const promptQuery = `
          SELECT question FROM daily_prompts WHERE id = $1
        `;
        const promptResult = await query(promptQuery, [promptId]);
        const promptText = promptResult.rows[0]?.question;

        if (promptText) {
          await communityService.createReflectionPost(
            userId,
            promptText,
            response
          );
        }
      } catch (error) {
        console.error('Error creating reflection community post:', error);
        // Don't fail the save if community post fails
      }
    }

    return reflectionResponse;
  }

  /**
   * Get a user's reflection for a specific prompt
   */
  async getUserReflection(userId: string, promptId: string): Promise<ReflectionResponse | null> {
    const selectQuery = `
      SELECT 
        id,
        user_id as "userId",
        prompt_id as "promptId",
        response,
        is_public as "isPublic",
        created_at as "createdAt"
      FROM reflection_responses
      WHERE user_id = $1 AND prompt_id = $2
    `;

    const result = await query(selectQuery, [userId, promptId]);
    return result.rows[0] || null;
  }

  /**
   * Get random public reflections for a prompt (exclude current user)
   */
  async getPublicReflections(
    promptId: string,
    limit: number = 5,
    excludeUserId?: string
  ): Promise<Omit<ReflectionResponse, 'userId'>[]> {
    let selectQuery = `
      SELECT 
        id,
        response,
        created_at as "createdAt"
      FROM reflection_responses
      WHERE prompt_id = $1 AND is_public = true
    `;

    const params: any[] = [promptId];

    if (excludeUserId) {
      selectQuery += ` AND user_id != $2`;
      params.push(excludeUserId);
    }

    selectQuery += `
      ORDER BY RANDOM()
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await query(selectQuery, params);
    return result.rows;
  }

  /**
   * Get count of public reflections for a prompt
   */
  async getPublicReflectionCount(promptId: string): Promise<number> {
    const countQuery = `
      SELECT COUNT(*) as count
      FROM reflection_responses
      WHERE prompt_id = $1 AND is_public = true
    `;

    const result = await query(countQuery, [promptId]);
    return parseInt(result.rows[0].count);
  }
}

export const reflectionService = new ReflectionService();
