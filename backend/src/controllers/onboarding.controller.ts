// Onboarding Controller
// Handles saving the AI intake chat transcript from the onboarding flow

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { profileModel } from '../models/profile.model';

class OnboardingController {
  // POST /api/users/:id/onboarding
  async saveTranscript(req: AuthRequest, res: Response) {
    try {
      const { id: userId } = req.params;

      if (req.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only save your own onboarding data',
        });
      }

      const { transcript } = req.body;

      if (!Array.isArray(transcript)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'transcript must be an array',
        });
      }

      const quizData = {
        user_id: userId,
        quiz_version: 'onboarding-intake-v1',
        completed_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        responses: {
          onboarding_transcript: transcript,
        } as any,
      };

      await profileModel.saveQuizResponses(userId, quizData, {
        suggested_behaviors: [],
        notification_frequency: 'daily',
        preferred_check_in_time: 'morning',
        content_difficulty_level: 5,
        primary_goals: [],
        focus_area: 'general',
        reflection_styles: [],
        motivation_drivers: [],
        stress_baseline: 5,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[OnboardingController] saveTranscript error:', error);
      return res.status(200).json({ success: true });
    }
  }
}

export const onboardingController = new OnboardingController();
