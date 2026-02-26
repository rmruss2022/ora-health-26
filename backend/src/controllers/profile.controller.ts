// Profile Controller
// Request handlers for user profile and quiz endpoints

import { Response } from 'express';
import { profileService } from '../services/profile.service';
import { AuthRequest } from '../middleware/auth.middleware';

class ProfileController {
  // ===== POST /api/users/:id/quiz =====
  // Save quiz responses and generate personalization settings
  async saveQuiz(req: AuthRequest, res: Response) {
    try {
      const { id: userId } = req.params;

      // Verify user is authorized to update this profile
      if (req.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own quiz responses',
        });
      }

      const quizData = req.body;

      // Ensure user_id matches
      if (!quizData.user_id) {
        quizData.user_id = userId;
      } else if (quizData.user_id !== userId) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'user_id in request body must match URL parameter',
        });
      }

      // Save quiz responses
      const profile = await profileService.saveQuizResponses(userId, quizData);

      res.status(200).json({
        success: true,
        message: 'Quiz responses saved successfully',
        profile: {
          id: profile.id,
          user_id: profile.user_id,
          quiz_completed_at: profile.quiz_completed_at,
          suggested_behaviors: profile.suggested_behaviors,
          notification_frequency: profile.notification_frequency,
          preferred_check_in_time: profile.preferred_check_in_time,
          content_difficulty_level: profile.content_difficulty_level,
          primary_goals: profile.primary_goals,
          focus_area: profile.focus_area,
        },
      });
    } catch (error: any) {
      console.error('Save Quiz Error:', error);

      if (error.message.includes('required') || error.message.includes('Validation')) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Failed to save quiz',
        message: 'An error occurred while saving quiz responses',
      });
    }
  }

  // ===== GET /api/users/:id/profile =====
  // Get user profile with quiz data and personalization settings
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const { id: userId } = req.params;

      // Verify user is authorized to view this profile
      if (req.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own profile',
        });
      }

      // Get profile
      const profile = await profileService.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'User profile does not exist. Please complete the quiz first.',
        });
      }

      res.json({
        success: true,
        profile: {
          id: profile.id,
          user: {
            id: profile.user_id,
            email: profile.email,
            name: profile.name,
            avatar_url: profile.avatar_url,
          },
          quiz_data: {
            responses: profile.quiz_responses,
            completed_at: profile.quiz_completed_at,
            started_at: profile.quiz_started_at,
            version: profile.quiz_version,
            revision_count: profile.revision_count,
          },
          personalization: {
            suggested_behaviors: profile.suggested_behaviors,
            notification_frequency: profile.notification_frequency,
            preferred_check_in_time: profile.preferred_check_in_time,
            content_difficulty_level: profile.content_difficulty_level,
            primary_goals: profile.primary_goals,
            focus_area: profile.focus_area,
            reflection_styles: profile.reflection_styles,
            motivation_drivers: profile.motivation_drivers,
            stress_baseline: profile.stress_baseline,
          },
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
      });
    } catch (error: any) {
      console.error('Get Profile Error:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching user profile',
      });
    }
  }

  // ===== PATCH /api/users/:id/profile =====
  // Update user profile settings
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { id: userId } = req.params;

      // Verify user is authorized to update this profile
      if (req.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own profile',
        });
      }

      const updates = req.body;

      // Update profile
      const profile = await profileService.updateProfile(userId, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          id: profile.id,
          user_id: profile.user_id,
          notification_frequency: profile.notification_frequency,
          preferred_check_in_time: profile.preferred_check_in_time,
          suggested_behaviors: profile.suggested_behaviors,
          content_difficulty_level: profile.content_difficulty_level,
          updated_at: profile.updated_at,
        },
      });
    } catch (error: any) {
      console.error('Update Profile Error:', error);

      if (error.message === 'Profile not found. Please complete the quiz first.') {
        return res.status(404).json({
          error: 'Profile not found',
          message: error.message,
        });
      }

      if (error.message.includes('must be between')) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating profile',
      });
    }
  }

  // ===== GET /api/users/:id/recommendations =====
  // Get personalized recommendations based on profile
  async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const { id: userId } = req.params;

      // Verify user is authorized
      if (req.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own recommendations',
        });
      }

      // Get recommendations
      const recommendations = await profileService.getPersonalizedRecommendations(userId);

      res.json({
        success: true,
        recommendations,
      });
    } catch (error: any) {
      console.error('Get Recommendations Error:', error);

      if (error.message === 'Profile not found') {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'Please complete the quiz first to get personalized recommendations',
        });
      }

      res.status(500).json({
        error: 'Failed to fetch recommendations',
        message: 'An error occurred while fetching recommendations',
      });
    }
  }

  // ===== DELETE /api/users/:id/profile =====
  // Delete user profile (quiz data and settings)
  async deleteProfile(req: AuthRequest, res: Response) {
    try {
      const { id: userId } = req.params;

      // Verify user is authorized
      if (req.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own profile',
        });
      }

      // Delete profile
      const deleted = await profileService.deleteProfile(userId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'No profile found to delete',
        });
      }

      res.json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete Profile Error:', error);
      res.status(500).json({
        error: 'Failed to delete profile',
        message: 'An error occurred while deleting profile',
      });
    }
  }
}

export const profileController = new ProfileController();
