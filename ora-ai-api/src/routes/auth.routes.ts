// Auth Routes
// Authentication endpoints with rate limiting

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
  authenticateToken,
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
} from '../middleware/auth.middleware';

const router = Router();

// ===== PUBLIC ROUTES =====

// POST /auth/register - Create new user account
router.post('/register', registerRateLimiter, authController.register.bind(authController));

// POST /auth/login - Login with email and password
router.post('/login', loginRateLimiter, authController.login.bind(authController));

// POST /auth/refresh - Refresh access token using refresh token
router.post('/refresh', authController.refresh.bind(authController));

// POST /auth/forgot-password - Request password reset
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword.bind(authController));

// POST /auth/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword.bind(authController));

// ===== PROTECTED ROUTES =====

// GET /auth/me - Get current user profile (requires authentication)
router.get('/me', authenticateToken, authController.getProfile.bind(authController));

// POST /auth/logout - Logout (optional - revokes refresh token)
router.post('/logout', authenticateToken, authController.logout.bind(authController));

// ===== LEGACY ROUTES (for backward compatibility) =====

// Alias for /register
router.post('/signup', registerRateLimiter, authController.register.bind(authController));

// Alias for /login
router.post('/signin', loginRateLimiter, authController.login.bind(authController));

// Alias for /logout
router.post('/signout', authenticateToken, authController.logout.bind(authController));

// Alias for /refresh
router.post('/refreshToken', authController.refresh.bind(authController));

export default router;
