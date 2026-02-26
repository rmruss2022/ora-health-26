import { query } from '../config/database';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type_id: string;
  type_name?: string;
  type_icon?: string;
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: {
    steps: Array<{
      title: string;
      prompt: string;
      duration: number;
    }>;
  };
  is_active: boolean;
  tags: string[];
  is_favorited?: boolean;
  completion_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ExerciseCompletion {
  id: string;
  user_id: string;
  exercise_id: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  rating?: number;
  created_at: Date;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  reflections?: any;
  intentions: string[];
  focus_areas: string[];
  goals?: any;
  created_at: Date;
  updated_at: Date;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  weekly_plan_id?: string;
  week_start_date: string;
  week_end_date: string;
  intention_ratings?: Record<string, number>;
  wins: string[];
  challenges: string[];
  learnings: string[];
  gratitude?: string;
  shared_to_community: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ExerciseModel {
  // ===== EXERCISE OPERATIONS =====

  async getAllExercises(userId?: string): Promise<Exercise[]> {
    const sql = `
      SELECT 
        e.*,
        et.name as type_name,
        et.icon as type_icon,
        ${userId ? 'EXISTS(SELECT 1 FROM user_favorite_exercises WHERE user_id = $1 AND exercise_id = e.id) as is_favorited,' : ''}
        (SELECT COUNT(*) FROM exercise_completions WHERE exercise_id = e.id ${userId ? 'AND user_id = $1' : ''}) as completion_count
      FROM exercises e
      LEFT JOIN exercise_types et ON e.type_id = et.id
      WHERE e.is_active = true
      ORDER BY e.created_at DESC
    `;

    const result = userId 
      ? await query(sql, [userId])
      : await query(sql);

    return result.rows;
  }

  async getExerciseById(id: string, userId?: string): Promise<Exercise | null> {
    const sql = `
      SELECT 
        e.*,
        et.name as type_name,
        et.icon as type_icon,
        ${userId ? 'EXISTS(SELECT 1 FROM user_favorite_exercises WHERE user_id = $1 AND exercise_id = e.id) as is_favorited,' : ''}
        (SELECT COUNT(*) FROM exercise_completions WHERE exercise_id = e.id ${userId ? 'AND user_id = $1' : ''}) as completion_count
      FROM exercises e
      LEFT JOIN exercise_types et ON e.type_id = et.id
      WHERE e.id = ${userId ? '$2' : '$1'}
    `;

    const result = userId
      ? await query(sql, [userId, id])
      : await query(sql, [id]);

    return result.rows[0] || null;
  }

  async getExercisesByType(typeId: string, userId?: string): Promise<Exercise[]> {
    const sql = `
      SELECT 
        e.*,
        et.name as type_name,
        et.icon as type_icon,
        ${userId ? 'EXISTS(SELECT 1 FROM user_favorite_exercises WHERE user_id = $1 AND exercise_id = e.id) as is_favorited,' : ''}
        (SELECT COUNT(*) FROM exercise_completions WHERE exercise_id = e.id ${userId ? 'AND user_id = $1' : ''}) as completion_count
      FROM exercises e
      LEFT JOIN exercise_types et ON e.type_id = et.id
      WHERE e.type_id = ${userId ? '$2' : '$1'} AND e.is_active = true
      ORDER BY e.created_at DESC
    `;

    const result = userId
      ? await query(sql, [userId, typeId])
      : await query(sql, [typeId]);

    return result.rows;
  }

  async getExercisesByTag(tag: string, userId?: string): Promise<Exercise[]> {
    const sql = `
      SELECT 
        e.*,
        et.name as type_name,
        et.icon as type_icon,
        ${userId ? 'EXISTS(SELECT 1 FROM user_favorite_exercises WHERE user_id = $1 AND exercise_id = e.id) as is_favorited,' : ''}
        (SELECT COUNT(*) FROM exercise_completions WHERE exercise_id = e.id ${userId ? 'AND user_id = $1' : ''}) as completion_count
      FROM exercises e
      LEFT JOIN exercise_types et ON e.type_id = et.id
      WHERE ${userId ? '$2' : '$1'} = ANY(e.tags) AND e.is_active = true
      ORDER BY e.created_at DESC
    `;

    const result = userId
      ? await query(sql, [userId, tag])
      : await query(sql, [tag]);

    return result.rows;
  }

  async getUserFavorites(userId: string): Promise<Exercise[]> {
    const sql = `
      SELECT 
        e.*,
        et.name as type_name,
        et.icon as type_icon,
        true as is_favorited,
        (SELECT COUNT(*) FROM exercise_completions WHERE exercise_id = e.id AND user_id = $1) as completion_count
      FROM exercises e
      LEFT JOIN exercise_types et ON e.type_id = et.id
      INNER JOIN user_favorite_exercises ufe ON e.id = ufe.exercise_id
      WHERE ufe.user_id = $1 AND e.is_active = true
      ORDER BY ufe.created_at DESC
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }

  // ===== EXERCISE COMPLETION OPERATIONS =====

  async startExercise(data: {
    userId: string;
    exerciseId: string;
    moodBefore?: string;
  }): Promise<ExerciseCompletion> {
    const sql = `
      INSERT INTO exercise_completions (user_id, exercise_id, started_at, mood_before)
      VALUES ($1, $2, NOW(), $3)
      RETURNING *
    `;

    const result = await query(sql, [
      data.userId,
      data.exerciseId,
      data.moodBefore || null,
    ]);

    return result.rows[0];
  }

  async completeExercise(completionId: string, data: {
    durationSeconds?: number;
    moodAfter?: string;
    rating?: number;
    notes?: string;
  }): Promise<ExerciseCompletion> {
    const sql = `
      UPDATE exercise_completions
      SET 
        completed_at = NOW(),
        duration_seconds = $2,
        mood_after = $3,
        rating = $4,
        notes = $5
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [
      completionId,
      data.durationSeconds || null,
      data.moodAfter || null,
      data.rating || null,
      data.notes || null,
    ]);

    return result.rows[0];
  }

  async getUserCompletions(userId: string, limit: number = 20): Promise<ExerciseCompletion[]> {
    const sql = `
      SELECT ec.*, e.title as exercise_title, e.duration_minutes
      FROM exercise_completions ec
      LEFT JOIN exercises e ON ec.exercise_id = e.id
      WHERE ec.user_id = $1
      ORDER BY ec.started_at DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }

  async getUserStats(userId: string): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_completions,
        COUNT(DISTINCT exercise_id) as unique_exercises,
        SUM(duration_seconds) as total_seconds,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN completed_at > NOW() - INTERVAL '7 days' THEN 1 END) as completions_this_week,
        COUNT(CASE WHEN completed_at > NOW() - INTERVAL '30 days' THEN 1 END) as completions_this_month
      FROM exercise_completions
      WHERE user_id = $1 AND completed_at IS NOT NULL
    `;

    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  // ===== FAVORITES OPERATIONS =====

  async addFavorite(userId: string, exerciseId: string): Promise<void> {
    const sql = `
      INSERT INTO user_favorite_exercises (user_id, exercise_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, exercise_id) DO NOTHING
    `;

    await query(sql, [userId, exerciseId]);
  }

  async removeFavorite(userId: string, exerciseId: string): Promise<void> {
    const sql = `
      DELETE FROM user_favorite_exercises
      WHERE user_id = $1 AND exercise_id = $2
    `;

    await query(sql, [userId, exerciseId]);
  }

  // ===== WEEKLY PLANNING OPERATIONS =====

  async createWeeklyPlan(data: {
    userId: string;
    weekStartDate: string;
    weekEndDate: string;
    reflections?: any;
    intentions: string[];
    focusAreas: string[];
    goals?: any;
  }): Promise<WeeklyPlan> {
    const sql = `
      INSERT INTO weekly_plans 
        (user_id, week_start_date, week_end_date, reflections, intentions, focus_areas, goals)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, week_start_date) 
      DO UPDATE SET
        reflections = $4,
        intentions = $5,
        focus_areas = $6,
        goals = $7,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(sql, [
      data.userId,
      data.weekStartDate,
      data.weekEndDate,
      data.reflections ? JSON.stringify(data.reflections) : null,
      data.intentions,
      data.focusAreas,
      data.goals ? JSON.stringify(data.goals) : null,
    ]);

    return result.rows[0];
  }

  async getWeeklyPlan(userId: string, weekStartDate: string): Promise<WeeklyPlan | null> {
    const sql = `
      SELECT * FROM weekly_plans
      WHERE user_id = $1 AND week_start_date = $2
    `;

    const result = await query(sql, [userId, weekStartDate]);
    return result.rows[0] || null;
  }

  async getCurrentWeekPlan(userId: string): Promise<WeeklyPlan | null> {
    const sql = `
      SELECT * FROM weekly_plans
      WHERE user_id = $1 
        AND week_start_date <= CURRENT_DATE
        AND week_end_date >= CURRENT_DATE
      ORDER BY week_start_date DESC
      LIMIT 1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  async getUserWeeklyPlans(userId: string, limit: number = 10): Promise<WeeklyPlan[]> {
    const sql = `
      SELECT * FROM weekly_plans
      WHERE user_id = $1
      ORDER BY week_start_date DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }

  // ===== WEEKLY REVIEW OPERATIONS =====

  async createWeeklyReview(data: {
    userId: string;
    weeklyPlanId?: string;
    weekStartDate: string;
    weekEndDate: string;
    intentionRatings?: Record<string, number>;
    wins: string[];
    challenges: string[];
    learnings: string[];
    gratitude?: string;
    sharedToCommunity?: boolean;
  }): Promise<WeeklyReview> {
    const sql = `
      INSERT INTO weekly_reviews 
        (user_id, weekly_plan_id, week_start_date, week_end_date, intention_ratings, wins, challenges, learnings, gratitude, shared_to_community)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await query(sql, [
      data.userId,
      data.weeklyPlanId || null,
      data.weekStartDate,
      data.weekEndDate,
      data.intentionRatings ? JSON.stringify(data.intentionRatings) : null,
      data.wins,
      data.challenges,
      data.learnings,
      data.gratitude || null,
      data.sharedToCommunity || false,
    ]);

    return result.rows[0];
  }

  async getWeeklyReview(userId: string, weekStartDate: string): Promise<WeeklyReview | null> {
    const sql = `
      SELECT * FROM weekly_reviews
      WHERE user_id = $1 AND week_start_date = $2
    `;

    const result = await query(sql, [userId, weekStartDate]);
    return result.rows[0] || null;
  }

  async getUserWeeklyReviews(userId: string, limit: number = 10): Promise<WeeklyReview[]> {
    const sql = `
      SELECT wr.*, wp.intentions, wp.focus_areas
      FROM weekly_reviews wr
      LEFT JOIN weekly_plans wp ON wr.weekly_plan_id = wp.id
      WHERE wr.user_id = $1
      ORDER BY wr.week_start_date DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }

  async getExerciseTypes(): Promise<Array<{ id: string; name: string; description: string; icon: string }>> {
    const sql = `SELECT * FROM exercise_types ORDER BY name`;
    const result = await query(sql);
    return result.rows;
  }
}

export const exerciseModel = new ExerciseModel();
