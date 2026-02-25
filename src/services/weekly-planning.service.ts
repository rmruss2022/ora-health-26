/**
 * Weekly Planning Service (Frontend)
 */

import { apiClient } from './api/apiClient';

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  intentions: string;
  aiResponse?: string;
  goals?: any;
  createdAt: string;
}

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

export class WeeklyPlanningService {
  /**
   * Save weekly plan
   */
  async saveWeeklyPlan(intentions: string, goals?: any): Promise<WeeklyPlan | null> {
    try {
      const response = await apiClient.post('/api/weekly-planning', {
        intentions,
        goals,
      });
      return response.data.plan;
    } catch (error) {
      console.error('Error saving weekly plan:', error);
      return null;
    }
  }

  /**
   * Get weekly plans
   */
  async getWeeklyPlans(limit: number = 10): Promise<WeeklyPlan[]> {
    try {
      const response = await apiClient.get('/api/weekly-planning', {
        params: { limit },
      });
      return response.data.plans || [];
    } catch (error) {
      console.error('Error fetching weekly plans:', error);
      return [];
    }
  }

  /**
   * Get current week's plan
   */
  async getCurrentWeekPlan(): Promise<WeeklyPlan | null> {
    try {
      const response = await apiClient.get('/api/weekly-planning/current');
      return response.data.plan || null;
    } catch (error) {
      console.error('Error fetching current week plan:', error);
      return null;
    }
  }

  /**
   * Save weekly review
   */
  async saveWeeklyReview(
    reflection: string,
    options?: {
      learnings?: string;
      wins?: string;
      challenges?: string;
      moodScore?: number;
    }
  ): Promise<WeeklyReview | null> {
    try {
      const response = await apiClient.post('/api/weekly-review', {
        reflection,
        ...options,
      });
      return response.data.review;
    } catch (error) {
      console.error('Error saving weekly review:', error);
      return null;
    }
  }

  /**
   * Get weekly reviews
   */
  async getWeeklyReviews(limit: number = 10): Promise<WeeklyReview[]> {
    try {
      const response = await apiClient.get('/api/weekly-review', {
        params: { limit },
      });
      return response.data.reviews || [];
    } catch (error) {
      console.error('Error fetching weekly reviews:', error);
      return [];
    }
  }

  /**
   * Get current week's review
   */
  async getCurrentWeekReview(): Promise<WeeklyReview | null> {
    try {
      const response = await apiClient.get('/api/weekly-review/current');
      return response.data.review || null;
    } catch (error) {
      console.error('Error fetching current week review:', error);
      return null;
    }
  }

  /**
   * Request planning prompt (for testing)
   */
  async requestPlanningPrompt(): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/weekly-planning/send-prompt');
      return response.data.success;
    } catch (error) {
      console.error('Error requesting planning prompt:', error);
      return false;
    }
  }

  /**
   * Request review prompt (for testing)
   */
  async requestReviewPrompt(): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/weekly-review/send-prompt');
      return response.data.success;
    } catch (error) {
      console.error('Error requesting review prompt:', error);
      return false;
    }
  }
}

// Singleton instance
export const weeklyPlanningService = new WeeklyPlanningService();
