// Profile Model
// Database queries for user profile operations

import { query } from '../config/database';
import { randomUUID } from 'crypto';

export interface QuizResponses {
  q1_goals?: {
    selected: string[];
    other_text?: string;
  };
  q2_focus_area?: {
    selected: string;
  };
  q3_reflection_style?: {
    selected: string[];
  };
  q4_biggest_challenge?: {
    text?: string;
    skipped?: boolean;
  };
  q5_checkin_frequency?: {
    selected: string;
  };
  q6_preferred_time?: {
    selected: string;
  };
  q7_therapy_background?: {
    selected: string;
  };
  q8_stress_level?: {
    value: number;
  };
  q9_motivation_drivers?: {
    selected: string[];
  };
  q10_additional_context?: {
    text?: string;
    skipped?: boolean;
  };
}

export interface QuizMetadata {
  time_to_complete_seconds?: number;
  device_type?: string;
  app_version?: string;
  revision_count?: number;
  last_revised_at?: string;
}

export interface QuizData {
  user_id: string;
  quiz_version: string;
  completed_at: string;
  started_at?: string;
  responses: QuizResponses;
  metadata?: QuizMetadata;
}

export interface UserProfile {
  id: string;
  user_id: string;
  quiz_responses: QuizData | null;
  quiz_version: string;
  quiz_completed_at: Date | null;
  quiz_started_at: Date | null;
  suggested_behaviors: string[];
  notification_frequency: string | null;
  preferred_check_in_time: string | null;
  content_difficulty_level: number;
  primary_goals: string[];
  focus_area: string | null;
  reflection_styles: string[];
  motivation_drivers: string[];
  stress_baseline: number | null;
  created_at: Date;
  updated_at: Date;
  revision_count: number;
}

export interface ProfileWithUser extends UserProfile {
  email: string;
  name: string;
  avatar_url?: string;
}

export class ProfileModel {
  // ===== PROFILE OPERATIONS =====

  async createProfile(data: {
    user_id: string;
    quiz_responses?: QuizData;
    suggested_behaviors?: string[];
    notification_frequency?: string;
    preferred_check_in_time?: string;
    content_difficulty_level?: number;
    primary_goals?: string[];
    focus_area?: string;
    reflection_styles?: string[];
    motivation_drivers?: string[];
    stress_baseline?: number;
  }): Promise<UserProfile> {
    const id = randomUUID();
    const result = await query(
      `INSERT INTO user_profiles (
        id, user_id, quiz_responses, suggested_behaviors, 
        notification_frequency, preferred_check_in_time, 
        content_difficulty_level, primary_goals, focus_area, 
        reflection_styles, motivation_drivers, stress_baseline,
        quiz_completed_at, quiz_started_at, quiz_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id,
        data.user_id,
        data.quiz_responses ? JSON.stringify(data.quiz_responses) : null,
        data.suggested_behaviors || [],
        data.notification_frequency || null,
        data.preferred_check_in_time || null,
        data.content_difficulty_level || 5,
        data.primary_goals || [],
        data.focus_area || null,
        data.reflection_styles || [],
        data.motivation_drivers || [],
        data.stress_baseline || null,
        data.quiz_responses?.completed_at || null,
        data.quiz_responses?.started_at || null,
        data.quiz_responses?.quiz_version || '1.0',
      ]
    );
    return result.rows[0];
  }

  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    const result = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async getProfileWithUserDetails(userId: string): Promise<ProfileWithUser | null> {
    const result = await query(
      `SELECT 
        up.*,
        u.email,
        u.name,
        u.avatar_url
      FROM user_profiles up
      JOIN users u ON u.id = up.user_id
      WHERE up.user_id = $1 AND u.is_active = true`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
        if (key === 'quiz_responses' && value !== null) {
          fields.push(`${key} = $${paramCount}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Increment revision count if quiz_responses is being updated
    if (updates.quiz_responses) {
      fields.push(`revision_count = revision_count + 1`);
    }

    values.push(userId);
    const result = await query(
      `UPDATE user_profiles 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Profile not found');
    }

    return result.rows[0];
  }

  async saveQuizResponses(
    userId: string,
    quizData: QuizData,
    personalizationSettings: {
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
  ): Promise<UserProfile> {
    // Check if profile exists
    const existingProfile = await this.getProfileByUserId(userId);

    if (existingProfile) {
      // Update existing profile
      return this.updateProfile(userId, {
        quiz_responses: quizData,
        quiz_completed_at: new Date(quizData.completed_at),
        quiz_started_at: quizData.started_at ? new Date(quizData.started_at) : null,
        quiz_version: quizData.quiz_version,
        ...personalizationSettings,
      });
    } else {
      // Create new profile
      return this.createProfile({
        user_id: userId,
        quiz_responses: quizData,
        ...personalizationSettings,
      });
    }
  }

  async deleteProfile(userId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM user_profiles WHERE user_id = $1 RETURNING id',
      [userId]
    );
    return result.rows.length > 0;
  }

  // ===== QUERY HELPERS =====

  async getProfilesByGoal(goal: string): Promise<UserProfile[]> {
    const result = await query(
      `SELECT * FROM user_profiles 
       WHERE $1 = ANY(primary_goals)
       ORDER BY created_at DESC`,
      [goal]
    );
    return result.rows;
  }

  async getProfilesByFocusArea(focusArea: string): Promise<UserProfile[]> {
    const result = await query(
      'SELECT * FROM user_profiles WHERE focus_area = $1 ORDER BY created_at DESC',
      [focusArea]
    );
    return result.rows;
  }

  async getProfileStats(): Promise<{
    total_profiles: number;
    completed_quizzes: number;
    average_stress_level: number;
  }> {
    const result = await query(
      `SELECT 
        COUNT(*) as total_profiles,
        COUNT(quiz_completed_at) as completed_quizzes,
        AVG(stress_baseline) as average_stress_level
      FROM user_profiles`
    );
    return result.rows[0];
  }
}

export const profileModel = new ProfileModel();
