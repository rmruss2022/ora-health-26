import api from '../config/api';
import {
  Exercise,
  ExerciseType,
  ExerciseCompletion,
  WeeklyPlan,
  WeeklyReview,
  ExerciseStats,
} from '../types/exercise';

export const exerciseService = {
  // ===== EXERCISE OPERATIONS =====

  async getAllExercises(): Promise<Exercise[]> {
    const response = await api.get('/api/exercises');
    return response.data.exercises;
  },

  async getExerciseById(id: string): Promise<Exercise> {
    const response = await api.get(`/api/exercises/${id}`);
    return response.data.exercise;
  },

  async getExerciseTypes(): Promise<ExerciseType[]> {
    const response = await api.get('/api/exercises/types');
    return response.data.types;
  },

  async getExercisesByType(typeId: string): Promise<Exercise[]> {
    const response = await api.get(`/api/exercises/type/${typeId}`);
    return response.data.exercises;
  },

  async getExercisesByTag(tag: string): Promise<Exercise[]> {
    const response = await api.get(`/api/exercises/tag/${tag}`);
    return response.data.exercises;
  },

  async getUserFavorites(): Promise<Exercise[]> {
    const response = await api.get('/api/exercises/favorites/mine');
    return response.data.exercises;
  },

  async toggleFavorite(exerciseId: string): Promise<{ isFavorited: boolean }> {
    const response = await api.post(`/api/exercises/${exerciseId}/favorite`);
    return response.data;
  },

  // ===== COMPLETION OPERATIONS =====

  async startExercise(exerciseId: string, moodBefore?: string): Promise<ExerciseCompletion> {
    const response = await api.post(`/api/exercises/${exerciseId}/start`, { moodBefore });
    return response.data.completion;
  },

  async completeExercise(
    completionId: string,
    data: {
      durationSeconds?: number;
      moodAfter?: string;
      rating?: number;
      notes?: string;
    }
  ): Promise<ExerciseCompletion> {
    const response = await api.post(`/api/exercises/completions/${completionId}/complete`, data);
    return response.data.completion;
  },

  async getUserCompletions(limit: number = 20): Promise<ExerciseCompletion[]> {
    const response = await api.get('/api/exercises/completions/mine', { params: { limit } });
    return response.data.completions;
  },

  async getUserStats(): Promise<ExerciseStats> {
    const response = await api.get('/api/exercises/stats/mine');
    return response.data.stats;
  },

  // ===== WEEKLY PLANNING OPERATIONS =====

  async createWeeklyPlan(data: {
    weekStartDate: string;
    weekEndDate: string;
    reflections?: any;
    intentions: string[];
    focusAreas: string[];
    goals?: any;
  }): Promise<WeeklyPlan> {
    const response = await api.post('/api/exercises/weekly-plans', data);
    return response.data.plan;
  },

  async getWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan> {
    const response = await api.get(`/api/exercises/weekly-plans/${weekStartDate}`);
    return response.data.plan;
  },

  async getCurrentWeekPlan(): Promise<{ plan: WeeklyPlan | null; currentWeek: { weekStart: string; weekEnd: string } }> {
    const response = await api.get('/api/exercises/weekly-plans/current/mine');
    return response.data;
  },

  async getUserWeeklyPlans(limit: number = 10): Promise<WeeklyPlan[]> {
    const response = await api.get('/api/exercises/weekly-plans/mine/all', { params: { limit } });
    return response.data.plans;
  },

  // ===== WEEKLY REVIEW OPERATIONS =====

  async createWeeklyReview(data: {
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
    const response = await api.post('/api/exercises/weekly-reviews', data);
    return response.data.review;
  },

  async getWeeklyReview(weekStartDate: string): Promise<WeeklyReview> {
    const response = await api.get(`/api/exercises/weekly-reviews/${weekStartDate}`);
    return response.data.review;
  },

  async getUserWeeklyReviews(limit: number = 10): Promise<WeeklyReview[]> {
    const response = await api.get('/api/exercises/weekly-reviews/mine/all', { params: { limit } });
    return response.data.reviews;
  },
};
