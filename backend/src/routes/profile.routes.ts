// Profile Routes
// User profile and quiz endpoints

import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

// ===== QUIZ ENDPOINTS =====

// POST /api/users/:id/quiz - Save quiz responses
router.post('/:id/quiz', profileController.saveQuiz.bind(profileController));

// ===== PROFILE ENDPOINTS =====

// GET /api/users/:id/profile - Get user profile with quiz data
router.get('/:id/profile', profileController.getProfile.bind(profileController));

// PATCH /api/users/:id/profile - Update profile settings
router.patch('/:id/profile', profileController.updateProfile.bind(profileController));

// DELETE /api/users/:id/profile - Delete user profile
router.delete('/:id/profile', profileController.deleteProfile.bind(profileController));

// ===== RECOMMENDATION ENDPOINTS =====

// GET /api/users/:id/recommendations - Get personalized recommendations
router.get('/:id/recommendations', profileController.getRecommendations.bind(profileController));

export default router;
