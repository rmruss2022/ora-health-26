import { api } from './api';

export interface QuizQuestion {
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

export interface DailyQuiz {
  id: string;
  quiz_date: string;
  template_id: string | null;
  questions: {
    questions: QuizQuestion[];
  };
  created_at: string;
}

export interface QuizResponse {
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

export interface QuizStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_completed: number;
}

export interface QuizInsight {
  id: string;
  user_id: string;
  quiz_response_id: string;
  insight_text: string;
  insight_type: string;
  created_at: string;
}

class QuizService {
  /**
   * Get today's quiz
   */
  async getTodaysQuiz(): Promise<DailyQuiz> {
    const response = await api.get('/api/quiz/daily');
    return response.data;
  }

  /**
   * Get quiz for specific date
   */
  async getQuizByDate(date: string): Promise<DailyQuiz> {
    const response = await api.get(`/api/quiz/date/${date}`);
    return response.data;
  }

  /**
   * Submit quiz answers
   */
  async submitQuizResponse(
    userId: string,
    quizId: string,
    answers: Record<string, any>,
    timeTakenSeconds?: number
  ): Promise<{ response: QuizResponse; insights: QuizInsight[] }> {
    const response = await api.post('/api/quiz/responses', {
      userId,
      quizId,
      answers,
      timeTakenSeconds,
    });
    return response.data;
  }

  /**
   * Get user's response for a quiz
   */
  async getUserQuizResponse(
    userId: string,
    quizId: string
  ): Promise<{ response: QuizResponse; insights: QuizInsight[] }> {
    const response = await api.get(`/api/quiz/responses/${quizId}`, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Get user's quiz history
   */
  async getUserQuizHistory(userId: string, limit: number = 30): Promise<any[]> {
    const response = await api.get('/api/quiz/history', {
      params: { userId, limit },
    });
    return response.data;
  }

  /**
   * Get user's streak
   */
  async getUserStreak(userId: string): Promise<QuizStreak> {
    const response = await api.get('/api/quiz/streak', {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Get user's quiz statistics
   */
  async getUserQuizStats(userId: string, days: number = 30): Promise<any> {
    const response = await api.get('/api/quiz/stats', {
      params: { userId, days },
    });
    return response.data;
  }
}

export const quizService = new QuizService();
