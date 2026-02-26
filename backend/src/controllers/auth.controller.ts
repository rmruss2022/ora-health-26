// Auth Controller
// Request handlers for authentication endpoints

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

class AuthController {
  // ===== POST /auth/register =====
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Email and password are required' 
        });
      }

      if (!name) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Name is required' 
        });
      }

      // Register user
      const { user, tokens } = await authService.register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
      });

      // Return user data and tokens (excluding password hash)
      const { password_hash, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        user: userWithoutPassword,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error: any) {
      console.error('Register Error:', error);
      
      if (error.message === 'User already exists') {
        return res.status(409).json({ 
          error: 'User already exists',
          message: 'An account with this email already exists' 
        });
      }

      if (error.message.includes('Password') || error.message.includes('email')) {
        return res.status(400).json({ 
          error: 'Validation error',
          message: error.message 
        });
      }

      res.status(500).json({ 
        error: 'Registration failed',
        message: 'An error occurred during registration' 
      });
    }
  }

  // ===== POST /auth/login =====
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Email and password are required' 
        });
      }

      // Get IP and user agent for token tracking
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Login user
      const { user, tokens } = await authService.login({
        email: email.toLowerCase().trim(),
        password,
        ipAddress,
        userAgent,
      });

      // Return user data and tokens (excluding password hash)
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: userWithoutPassword,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error: any) {
      console.error('Login Error:', error);
      
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          message: 'Email or password is incorrect' 
        });
      }

      res.status(500).json({ 
        error: 'Login failed',
        message: 'An error occurred during login' 
      });
    }
  }

  // ===== POST /auth/refresh =====
  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ 
          error: 'Missing refresh token',
          message: 'Refresh token is required' 
        });
      }

      // Get IP and user agent for new token tracking
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Refresh tokens
      const tokens = await authService.refresh({
        refreshToken,
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error: any) {
      console.error('Refresh Token Error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(401).json({ 
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired' 
        });
      }

      res.status(500).json({ 
        error: 'Token refresh failed',
        message: 'An error occurred while refreshing token' 
      });
    }
  }

  // ===== POST /auth/forgot-password =====
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: 'Missing email',
          message: 'Email is required' 
        });
      }

      // Get IP for tracking
      const ipAddress = req.ip || req.socket.remoteAddress;

      // Request password reset
      const result = await authService.forgotPassword({
        email: email.toLowerCase().trim(),
        ipAddress,
      });

      // Always return success (don't reveal if email exists)
      // In production, the token would be sent via email
      // For development/testing, we return it in the response
      const response: any = {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      };

      // Only include token in development mode
      if (process.env.NODE_ENV === 'development' && result.token) {
        response.resetToken = result.token;
        response.devNote = 'Token included for development only. In production, this would be sent via email.';
      }

      res.json(response);
    } catch (error: any) {
      console.error('Forgot Password Error:', error);
      res.status(500).json({ 
        error: 'Request failed',
        message: 'An error occurred while processing your request' 
      });
    }
  }

  // ===== POST /auth/reset-password =====
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Reset token and new password are required' 
        });
      }

      // Reset password
      await authService.resetPassword({
        token,
        newPassword,
      });

      res.json({
        success: true,
        message: 'Password has been reset successfully. Please login with your new password.',
      });
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(400).json({ 
          error: 'Invalid reset token',
          message: 'Reset token is invalid or expired' 
        });
      }

      if (error.message.includes('Password')) {
        return res.status(400).json({ 
          error: 'Validation error',
          message: error.message 
        });
      }

      res.status(500).json({ 
        error: 'Password reset failed',
        message: 'An error occurred while resetting password' 
      });
    }
  }

  // ===== GET /auth/me (Protected) =====
  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User ID not found in request' 
        });
      }

      // Get user profile
      const userProfile = await authService.getUserProfile(req.userId);

      res.json({
        success: true,
        user: userProfile,
      });
    } catch (error: any) {
      console.error('Get Profile Error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'User profile not found' 
        });
      }

      res.status(500).json({ 
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching user profile' 
      });
    }
  }

  // ===== POST /auth/logout (Optional - for future token blacklisting) =====
  async logout(req: AuthRequest, res: Response) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // If you want to implement token blacklisting, add it here
      // For now, we can revoke the refresh token if provided

      const { refreshToken } = req.body;

      if (refreshToken) {
        // Revoke the refresh token
        const { userModel } = await import('../models/user.model');
        await userModel.revokeRefreshToken(refreshToken, 'user_logout');
      }

      res.json({ 
        success: true,
        message: 'Logged out successfully' 
      });
    } catch (error: any) {
      console.error('Logout Error:', error);
      res.status(500).json({ 
        error: 'Logout failed',
        message: 'An error occurred during logout' 
      });
    }
  }
}

export const authController = new AuthController();
