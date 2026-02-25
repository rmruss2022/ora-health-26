import { exerciseModel, Exercise, ExerciseCompletion, WeeklyPlan, WeeklyReview } from '../models/exercise.model';

export class ExerciseService {
  // ===== EXERCISE OPERATIONS =====

  async getAllExercises(userId?: string): Promise<Exercise[]> {
    return await exerciseModel.getAllExercises(userId);
  }

  async getExerciseById(id: string, userId?: string): Promise<Exercise | null> {
    return await exerciseModel.getExerciseById(id, userId);
  }

  async getExercisesByType(typeId: string, userId?: string): Promise<Exercise[]> {
    return await exerciseModel.getExercisesByType(typeId, userId);
  }

  async getExercisesByTag(tag: string, userId?: string): Promise<Exercise[]> {
    return await exerciseModel.getExercisesByTag(tag, userId);
  }

  async getUserFavorites(userId: string): Promise<Exercise[]> {
    return await exerciseModel.getUserFavorites(userId);
  }

  async getExerciseTypes() {
    return await exerciseModel.getExerciseTypes();
  }

  // ===== EXERCISE COMPLETION OPERATIONS =====

  async startExercise(userId: string, exerciseId: string, moodBefore?: string): Promise<ExerciseCompletion> {
    // Verify exercise exists
    const exercise = await exerciseModel.getExerciseById(exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    return await exerciseModel.startExercise({
      userId,
      exerciseId,
      moodBefore,
    });
  }

  async completeExercise(
    completionId: string,
    data: {
      durationSeconds?: number;
      moodAfter?: string;
      rating?: number;
      notes?: string;
    }
  ): Promise<ExerciseCompletion> {
    return await exerciseModel.completeExercise(completionId, data);
  }

  async getUserCompletions(userId: string, limit: number = 20): Promise<ExerciseCompletion[]> {
    return await exerciseModel.getUserCompletions(userId, limit);
  }

  async getUserStats(userId: string): Promise<any> {
    const stats = await exerciseModel.getUserStats(userId);
    
    // Convert total seconds to hours/minutes for display
    const totalMinutes = Math.floor(stats.total_seconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return {
      ...stats,
      total_time_display: `${totalHours}h ${remainingMinutes}m`,
      average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : null,
    };
  }

  // ===== FAVORITES OPERATIONS =====

  async toggleFavorite(userId: string, exerciseId: string): Promise<{ isFavorited: boolean }> {
    // Check if already favorited
    const exercise = await exerciseModel.getExerciseById(exerciseId, userId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    if (exercise.is_favorited) {
      await exerciseModel.removeFavorite(userId, exerciseId);
      return { isFavorited: false };
    } else {
      await exerciseModel.addFavorite(userId, exerciseId);
      return { isFavorited: true };
    }
  }

  // ===== WEEKLY PLANNING OPERATIONS =====

  async createWeeklyPlan(
    userId: string,
    data: {
      weekStartDate: string;
      weekEndDate: string;
      reflections?: any;
      intentions: string[];
      focusAreas: string[];
      goals?: any;
    }
  ): Promise<WeeklyPlan> {
    return await exerciseModel.createWeeklyPlan({
      userId,
      ...data,
    });
  }

  async getWeeklyPlan(userId: string, weekStartDate: string): Promise<WeeklyPlan | null> {
    return await exerciseModel.getWeeklyPlan(userId, weekStartDate);
  }

  async getCurrentWeekPlan(userId: string): Promise<WeeklyPlan | null> {
    return await exerciseModel.getCurrentWeekPlan(userId);
  }

  async getUserWeeklyPlans(userId: string, limit: number = 10): Promise<WeeklyPlan[]> {
    return await exerciseModel.getUserWeeklyPlans(userId, limit);
  }

  // ===== WEEKLY REVIEW OPERATIONS =====

  async createWeeklyReview(
    userId: string,
    data: {
      weeklyPlanId?: string;
      weekStartDate: string;
      weekEndDate: string;
      intentionRatings?: Record<string, number>;
      wins: string[];
      challenges: string[];
      learnings: string[];
      gratitude?: string;
      sharedToCommunity?: boolean;
    }
  ): Promise<WeeklyReview> {
    // If weeklyPlanId not provided, try to find it
    if (!data.weeklyPlanId) {
      const plan = await exerciseModel.getWeeklyPlan(userId, data.weekStartDate);
      if (plan) {
        data.weeklyPlanId = plan.id;
      }
    }

    return await exerciseModel.createWeeklyReview({
      userId,
      ...data,
    });
  }

  async getWeeklyReview(userId: string, weekStartDate: string): Promise<WeeklyReview | null> {
    return await exerciseModel.getWeeklyReview(userId, weekStartDate);
  }

  async getUserWeeklyReviews(userId: string, limit: number = 10): Promise<WeeklyReview[]> {
    return await exerciseModel.getUserWeeklyReviews(userId, limit);
  }

  // Helper to get the current week's start date (Sunday)
  getCurrentWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek; // Days since Sunday
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - diff);
    return sunday.toISOString().split('T')[0];
  }

  // Helper to get the current week's end date (Saturday)
  getCurrentWeekEnd(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSaturday = 6 - dayOfWeek;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    return saturday.toISOString().split('T')[0];
  }
}

export const exerciseService = new ExerciseService();
