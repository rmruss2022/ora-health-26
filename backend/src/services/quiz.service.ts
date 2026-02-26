import { Pool } from 'pg';
import pool from '../config/database';

interface QuizQuestion {
  id: string;
  type: 'scale' | 'multiple_choice' | 'text';
  question: string;
  scale?: {
    min: number;
    max: number;
    labels: string[];
  };
  emoji?: string[];
  options?: Array<{
    value: string;
    label: string;
    emoji?: string;
  }>;
  multiple?: boolean;
  maxSelections?: number;
  placeholder?: string;
  optional?: boolean;
}

interface DailyQuiz {
  id: string;
  quiz_date: string;
  template_id: string | null;
  questions: {
    questions: QuizQuestion[];
  };
  created_at: string;
}

interface QuizResponse {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, any>;
  mood_score: number | null;
  energy_score: number | null;
  intentions: string[] | null;
  completed_at: string;
  time_taken_seconds: number | null;
}

interface QuizStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_completed: number;
}

class QuizService {
  /**
   * Get or create today's quiz
   */
  async getTodaysQuiz(): Promise<DailyQuiz> {
    const today = new Date().toISOString().split('T')[0];

    // Check if today's quiz exists
    let result = await pool.query(
      'SELECT * FROM daily_quizzes WHERE quiz_date = $1',
      [today]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create today's quiz from the active template
    const templateResult = await pool.query(
      'SELECT * FROM quiz_templates WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );

    if (templateResult.rows.length === 0) {
      throw new Error('No active quiz template found');
    }

    const template = templateResult.rows[0];

    const insertResult = await pool.query(
      `INSERT INTO daily_quizzes (quiz_date, template_id, questions)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [today, template.id, template.question_set]
    );

    return insertResult.rows[0];
  }

  /**
   * Get quiz by date
   */
  async getQuizByDate(date: string): Promise<DailyQuiz | null> {
    const result = await pool.query(
      'SELECT * FROM daily_quizzes WHERE quiz_date = $1',
      [date]
    );

    return result.rows[0] || null;
  }

  /**
   * Submit quiz response
   */
  async submitQuizResponse(
    userId: string,
    quizId: string,
    answers: Record<string, any>,
    timeTakenSeconds?: number
  ): Promise<QuizResponse> {
    // Extract key metrics from answers
    const moodScore = answers.mood || null;
    const energyScore = answers.energy || null;
    const intentions = answers.intention || null;

    const result = await pool.query(
      `INSERT INTO quiz_responses (user_id, quiz_id, answers, mood_score, energy_score, intentions, time_taken_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, quiz_id) 
       DO UPDATE SET 
         answers = EXCLUDED.answers,
         mood_score = EXCLUDED.mood_score,
         energy_score = EXCLUDED.energy_score,
         intentions = EXCLUDED.intentions,
         time_taken_seconds = EXCLUDED.time_taken_seconds,
         completed_at = NOW()
       RETURNING *`,
      [userId, quizId, JSON.stringify(answers), moodScore, energyScore, intentions, timeTakenSeconds]
    );

    // Update streak
    await this.updateStreak(userId);

    return result.rows[0];
  }

  /**
   * Get user's response for a specific quiz
   */
  async getUserQuizResponse(userId: string, quizId: string): Promise<QuizResponse | null> {
    const result = await pool.query(
      'SELECT * FROM quiz_responses WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get user's quiz history
   */
  async getUserQuizHistory(userId: string, limit: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
         qr.*,
         dq.quiz_date
       FROM quiz_responses qr
       JOIN daily_quizzes dq ON qr.quiz_id = dq.id
       WHERE qr.user_id = $1
       ORDER BY qr.completed_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Update user's quiz streak
   */
  async updateStreak(userId: string): Promise<QuizStreak> {
    const today = new Date().toISOString().split('T')[0];

    // Get current streak
    let streakResult = await pool.query(
      'SELECT * FROM quiz_streaks WHERE user_id = $1',
      [userId]
    );

    let streak: any;

    if (streakResult.rows.length === 0) {
      // Create new streak
      const insertResult = await pool.query(
        `INSERT INTO quiz_streaks (user_id, current_streak, longest_streak, last_completed_date, total_completed)
         VALUES ($1, 1, 1, $2, 1)
         RETURNING *`,
        [userId, today]
      );
      streak = insertResult.rows[0];
    } else {
      streak = streakResult.rows[0];
      const lastDate = streak.last_completed_date;

      if (lastDate === today) {
        // Already completed today
        return streak;
      }

      // Check if yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = streak.current_streak;

      if (lastDate === yesterdayStr) {
        // Continuing streak
        newStreak += 1;
      } else {
        // Streak broken, restart
        newStreak = 1;
      }

      const newLongestStreak = Math.max(newStreak, streak.longest_streak);

      const updateResult = await pool.query(
        `UPDATE quiz_streaks
         SET current_streak = $1,
             longest_streak = $2,
             last_completed_date = $3,
             total_completed = total_completed + 1,
             updated_at = NOW()
         WHERE user_id = $4
         RETURNING *`,
        [newStreak, newLongestStreak, today, userId]
      );

      streak = updateResult.rows[0];
    }

    return streak;
  }

  /**
   * Get user's streak
   */
  async getUserStreak(userId: string): Promise<QuizStreak | null> {
    const result = await pool.query(
      'SELECT * FROM quiz_streaks WHERE user_id = $1',
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get quiz statistics for user
   */
  async getUserQuizStats(userId: string, days: number = 30): Promise<any> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_quizzes,
         AVG(mood_score) as avg_mood,
         AVG(energy_score) as avg_energy,
         AVG(time_taken_seconds) as avg_time_seconds
       FROM quiz_responses
       WHERE user_id = $1 AND completed_at >= $2`,
      [userId, dateFrom.toISOString()]
    );

    const stats = result.rows[0];

    // Get most common intentions
    const intentionsResult = await pool.query(
      `SELECT UNNEST(intentions) as intention, COUNT(*) as count
       FROM quiz_responses
       WHERE user_id = $1 AND completed_at >= $2 AND intentions IS NOT NULL
       GROUP BY intention
       ORDER BY count DESC
       LIMIT 5`,
      [userId, dateFrom.toISOString()]
    );

    return {
      ...stats,
      top_intentions: intentionsResult.rows,
    };
  }

  /**
   * Generate AI insight from quiz response
   */
  async generateInsight(userId: string, quizResponseId: string): Promise<any> {
    // Get the quiz response
    const responseResult = await pool.query(
      'SELECT * FROM quiz_responses WHERE id = $1',
      [quizResponseId]
    );

    if (responseResult.rows.length === 0) {
      throw new Error('Quiz response not found');
    }

    const response = responseResult.rows[0];

    // Simple insight generation (can be enhanced with AI)
    const insights: any[] = [];

    // Mood insight
    if (response.mood_score !== null) {
      let insightText = '';
      let insightType = 'mood';

      if (response.mood_score >= 4) {
        insightText = "You're feeling great today! Keep up the positive momentum.";
      } else if (response.mood_score === 3) {
        insightText = "You're in a balanced state. Consider a mindful moment to center yourself.";
      } else {
        insightText = "It's okay to have difficult days. Be gentle with yourself and consider reaching out to someone you trust.";
      }

      const moodInsight = await pool.query(
        `INSERT INTO quiz_insights (user_id, quiz_response_id, insight_text, insight_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, quizResponseId, insightText, insightType]
      );

      insights.push(moodInsight.rows[0]);
    }

    // Energy insight
    if (response.energy_score !== null) {
      let insightText = '';
      let insightType = 'energy';

      if (response.energy_score <= 2) {
        insightText = "Your energy is low. Consider taking breaks, staying hydrated, and getting some movement.";
      } else if (response.energy_score >= 4) {
        insightText = "You're feeling energized! This is a great time to tackle important tasks or enjoy activities you love.";
      }

      if (insightText) {
        const energyInsight = await pool.query(
          `INSERT INTO quiz_insights (user_id, quiz_response_id, insight_text, insight_type)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [userId, quizResponseId, insightText, insightType]
        );

        insights.push(energyInsight.rows[0]);
      }
    }

    return insights;
  }

  /**
   * Get insights for a quiz response
   */
  async getQuizInsights(quizResponseId: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM quiz_insights WHERE quiz_response_id = $1 ORDER BY created_at ASC',
      [quizResponseId]
    );

    return result.rows;
  }
}

export const quizService = new QuizService();
