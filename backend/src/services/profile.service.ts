// Profile Service
// Business logic for user profile and quiz operations

import { profileModel, QuizData, UserProfile, ProfileWithUser, QuizResponses } from '../models/profile.model';

interface PersonalizationSettings {
  suggested_behaviors: string[];
  notification_frequency: string;
  preferred_check_in_time: string;
  content_difficulty_level: number;
  primary_goals: string[];
  focus_area: string;
  reflection_styles: string[];
  motivation_drivers: string[];
  stress_baseline: number;
}

export class ProfileService {
  // ===== QUIZ OPERATIONS =====

  /**
   * Save quiz responses and compute personalization settings
   */
  async saveQuizResponses(userId: string, quizData: QuizData): Promise<UserProfile> {
    // Validate quiz data
    this.validateQuizData(quizData);

    // Compute personalization settings from quiz responses
    const personalizationSettings = this.computePersonalizationSettings(quizData.responses);

    // Save to database
    const profile = await profileModel.saveQuizResponses(
      userId,
      quizData,
      personalizationSettings
    );

    return profile;
  }

  /**
   * Validate quiz data structure
   */
  private validateQuizData(quizData: QuizData): void {
    if (!quizData.user_id) {
      throw new Error('user_id is required');
    }

    if (!quizData.quiz_version) {
      throw new Error('quiz_version is required');
    }

    if (!quizData.completed_at) {
      throw new Error('completed_at is required');
    }

    if (!quizData.responses) {
      throw new Error('responses object is required');
    }

    const responses = quizData.responses;

    // Validate required questions
    if (!responses.q1_goals?.selected || responses.q1_goals.selected.length === 0) {
      throw new Error('Q1 (goals) is required');
    }

    if (!responses.q2_focus_area?.selected) {
      throw new Error('Q2 (focus_area) is required');
    }

    if (!responses.q3_reflection_style?.selected || responses.q3_reflection_style.selected.length === 0) {
      throw new Error('Q3 (reflection_style) is required');
    }

    if (!responses.q5_checkin_frequency?.selected) {
      throw new Error('Q5 (checkin_frequency) is required');
    }

    if (!responses.q6_preferred_time?.selected) {
      throw new Error('Q6 (preferred_time) is required');
    }

    if (!responses.q7_therapy_background?.selected) {
      throw new Error('Q7 (therapy_background) is required');
    }

    if (responses.q8_stress_level?.value === undefined) {
      throw new Error('Q8 (stress_level) is required');
    }

    if (!responses.q9_motivation_drivers?.selected || responses.q9_motivation_drivers.selected.length === 0) {
      throw new Error('Q9 (motivation_drivers) is required');
    }
  }

  /**
   * Compute personalization settings from quiz responses
   */
  private computePersonalizationSettings(responses: QuizResponses): PersonalizationSettings {
    return {
      suggested_behaviors: this.mapGoalsToBehaviors(responses.q1_goals?.selected || []),
      notification_frequency: this.mapCheckInFrequency(responses.q5_checkin_frequency?.selected || 'when_i_want'),
      preferred_check_in_time: this.mapPreferredTime(responses.q6_preferred_time?.selected || 'varies'),
      content_difficulty_level: this.mapStressLevelToDifficulty(responses.q8_stress_level?.value || 5),
      primary_goals: responses.q1_goals?.selected || [],
      focus_area: responses.q2_focus_area?.selected || 'emotional_wellbeing',
      reflection_styles: responses.q3_reflection_style?.selected || [],
      motivation_drivers: responses.q9_motivation_drivers?.selected || [],
      stress_baseline: responses.q8_stress_level?.value || 5,
    };
  }

  /**
   * Map Q1 goals to suggested behaviors
   */
  private mapGoalsToBehaviors(goals: string[]): string[] {
    const behaviorMap: { [key: string]: string[] } = {
      stress_anxiety: ['breathing_exercises', 'meditation', 'body_scan', 'grounding_techniques'],
      personal_growth: ['journaling', 'self_reflection', 'goal_setting', 'values_clarification'],
      building_habits: ['habit_tracking', 'routine_building', 'progress_monitoring', 'accountability'],
      relationships: ['communication_exercises', 'empathy_practice', 'boundary_setting', 'active_listening'],
      difficult_emotions: ['emotion_labeling', 'acceptance_practice', 'self_compassion', 'emotion_regulation'],
      wellness_mindfulness: ['meditation', 'mindful_breathing', 'present_moment_awareness', 'body_awareness'],
      other: ['exploration', 'open_journaling', 'guided_discovery'],
    };

    const behaviors = new Set<string>();
    goals.forEach(goal => {
      const mapped = behaviorMap[goal] || [];
      mapped.forEach(behavior => behaviors.add(behavior));
    });

    return Array.from(behaviors);
  }

  /**
   * Map Q5 check-in frequency to notification schedule
   */
  private mapCheckInFrequency(frequency: string): string {
    const frequencyMap: { [key: string]: string } = {
      daily: 'daily',
      few_times_week: 'three_times_weekly',
      weekly: 'weekly',
      when_i_want: 'opt_in',
    };

    return frequencyMap[frequency] || 'opt_in';
  }

  /**
   * Map Q6 preferred time to notification time
   */
  private mapPreferredTime(time: string): string {
    const timeMap: { [key: string]: string } = {
      morning: '08:00',
      afternoon: '14:00',
      evening: '19:00',
      varies: 'flexible',
    };

    return timeMap[time] || 'flexible';
  }

  /**
   * Map Q8 stress level to content difficulty
   * Higher stress = easier, more supportive content
   * Lower stress = more challenging growth content
   */
  private mapStressLevelToDifficulty(stressLevel: number): number {
    // Stress level 1-10 -> Difficulty 10-1 (inverted)
    // Stress 1 (calm) -> Difficulty 9 (challenging)
    // Stress 5 (moderate) -> Difficulty 5 (balanced)
    // Stress 10 (overwhelmed) -> Difficulty 1 (gentle/supportive)
    return Math.max(1, Math.min(10, 11 - stressLevel));
  }

  // ===== PROFILE OPERATIONS =====

  /**
   * Get user profile with full details
   */
  async getUserProfile(userId: string): Promise<ProfileWithUser | null> {
    const profile = await profileModel.getProfileWithUserDetails(userId);
    return profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: {
      notification_frequency?: string;
      preferred_check_in_time?: string;
      suggested_behaviors?: string[];
      content_difficulty_level?: number;
    }
  ): Promise<UserProfile> {
    // Validate updates
    if (updates.content_difficulty_level !== undefined) {
      if (updates.content_difficulty_level < 1 || updates.content_difficulty_level > 10) {
        throw new Error('content_difficulty_level must be between 1 and 10');
      }
    }

    // Check if profile exists
    const existingProfile = await profileModel.getProfileByUserId(userId);
    if (!existingProfile) {
      throw new Error('Profile not found. Please complete the quiz first.');
    }

    // Update profile
    const profile = await profileModel.updateProfile(userId, updates);
    return profile;
  }

  /**
   * Get profile statistics (for analytics)
   */
  async getProfileStats(): Promise<{
    total_profiles: number;
    completed_quizzes: number;
    average_stress_level: number;
  }> {
    return profileModel.getProfileStats();
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    return profileModel.deleteProfile(userId);
  }

  // ===== PERSONALIZATION HELPERS =====

  /**
   * Get personalized recommendations based on profile
   */
  async getPersonalizedRecommendations(userId: string): Promise<{
    behaviors: string[];
    exercises: string[];
    content_tags: string[];
    check_in_schedule: string;
  }> {
    const profile = await profileModel.getProfileByUserId(userId);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      behaviors: profile.suggested_behaviors,
      exercises: this.getExercisesFromBehaviors(profile.suggested_behaviors),
      content_tags: [...profile.primary_goals, profile.focus_area || ''],
      check_in_schedule: profile.notification_frequency || 'opt_in',
    };
  }

  /**
   * Map behaviors to specific exercises
   */
  private getExercisesFromBehaviors(behaviors: string[]): string[] {
    const exerciseMap: { [key: string]: string } = {
      breathing_exercises: 'Box Breathing (4-4-4-4)',
      meditation: 'Guided Body Scan Meditation',
      body_scan: 'Progressive Muscle Relaxation',
      grounding_techniques: '5-4-3-2-1 Grounding Exercise',
      journaling: 'Reflective Journaling Prompts',
      self_reflection: 'Daily Self-Check Questions',
      goal_setting: 'SMART Goal Framework',
      values_clarification: 'Personal Values Assessment',
      habit_tracking: 'Daily Habit Checklist',
      routine_building: 'Morning/Evening Routine Builder',
      communication_exercises: 'Active Listening Practice',
      empathy_practice: 'Perspective-Taking Exercise',
      emotion_labeling: 'Emotion Wheel Exercise',
      acceptance_practice: 'Acceptance & Commitment Practice',
      self_compassion: 'Self-Compassion Break',
      mindful_breathing: 'Mindful Breathing (Count of 5)',
    };

    return behaviors
      .map(behavior => exerciseMap[behavior])
      .filter(exercise => exercise !== undefined);
  }
}

export const profileService = new ProfileService();
