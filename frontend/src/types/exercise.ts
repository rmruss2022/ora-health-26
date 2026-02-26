export interface ExerciseType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ExerciseStep {
  title: string;
  prompt: string;
  duration: number; // seconds
}

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
    steps: ExerciseStep[];
  };
  is_active: boolean;
  tags: string[];
  is_favorited?: boolean;
  completion_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseCompletion {
  id: string;
  user_id: string;
  exercise_id: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  rating?: number;
  created_at: string;
  exercise_title?: string;
  duration_minutes?: number;
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  intentions?: string[];
  focus_areas?: string[];
}

export interface ExerciseStats {
  total_completions: number;
  unique_exercises: number;
  total_seconds: number;
  total_time_display: string;
  average_rating: string;
  completions_this_week: number;
  completions_this_month: number;
}
