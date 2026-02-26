// Auth Middleware
// JWT verification and rate limiting

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authService } from '../services/auth.service';
import { authConfig } from '../config/auth.config';

// Extend Express Request type to include user data
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

// ===== JWT AUTHENTICATION MIDDLEWARE =====

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No token provided' 
    });
  }

  try {
    const decoded = authService.verifyAccessToken(token);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or expired' 
    });
  }
};

// ===== RATE LIMITING MIDDLEWARE =====

// Rate limiter for login endpoint
export const loginRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.login.windowMs,
  max: authConfig.rateLimit.login.maxAttempts,
  message: {
    error: 'Too many login attempts',
    message: `Please try again later. Maximum ${authConfig.rateLimit.login.maxAttempts} attempts per minute.`,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: `Maximum ${authConfig.rateLimit.login.maxAttempts} attempts per minute. Please try again later.`,
    });
  },
});

// Rate limiter for registration endpoint
export const registerRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.register.windowMs,
  max: authConfig.rateLimit.register.maxAttempts,
  message: {
    error: 'Too many registration attempts',
    message: `Please try again later. Maximum ${authConfig.rateLimit.register.maxAttempts} attempts per minute.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many registration attempts',
      message: `Maximum ${authConfig.rateLimit.register.maxAttempts} attempts per minute. Please try again later.`,
    });
  },
});

// Rate limiter for forgot password endpoint
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.forgotPassword.windowMs,
  max: authConfig.rateLimit.forgotPassword.maxAttempts,
  message: {
    error: 'Too many password reset attempts',
    message: `Please try again later. Maximum ${authConfig.rateLimit.forgotPassword.maxAttempts} attempts per hour.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many password reset attempts',
      message: `Maximum ${authConfig.rateLimit.forgotPassword.maxAttempts} attempts per hour. Please try again later.`,
    });
  },
});

// Optional: IP-based rate limiter for general auth endpoints
export const authGeneralRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== EXPORT DEFAULT =====
export default authenticateToken;
