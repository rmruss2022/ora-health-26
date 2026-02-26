import { Request, Response, NextFunction } from 'express';
import { moderationService } from '../services/moderation/moderation.service';

/**
 * Moderation middleware for Express routes
 * Validates content before allowing it through
 */

export interface ModerationMiddlewareOptions {
  field?: string; // req.body field to check (default: 'content')
  autoClean?: boolean; // Auto-clean profanity instead of blocking
  required?: boolean; // Whether field is required
}

/**
 * Moderate text content in request body
 * 
 * Usage:
 * ```ts
 * router.post('/posts',
 *   authenticateToken,
 *   moderateContent({ field: 'content', autoClean: false }),
 *   createPostHandler
 * );
 * ```
 */
export function moderateContent(options: ModerationMiddlewareOptions = {}) {
  const { field = 'content', autoClean = false, required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!moderationService.isEnabled()) {
      return next();
    }

    const text = req.body[field];

    // Check if field exists
    if (!text) {
      if (required) {
        return res.status(400).json({
          error: 'ValidationError',
          message: `Field '${field}' is required`,
        });
      }
      return next();
    }

    // Check if it's a string
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Field '${field}' must be a string`,
      });
    }

    // Check length
    if (text.length === 0) {
      if (required) {
        return res.status(400).json({
          error: 'ValidationError',
          message: `Field '${field}' cannot be empty`,
        });
      }
      return next();
    }

    if (text.length > 10000) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Field '${field}' is too long (max 10,000 characters)`,
      });
    }

    try {
      // Moderate content
      const result = await moderationService.moderateText(text, { autoClean });

      if (!result.approved) {
        return res.status(400).json({
          error: 'ModerationError',
          message: result.reason || 'Content did not pass moderation',
          flags: result.flags,
        });
      }

      // If auto-cleaned, replace with cleaned version
      if (result.cleanedText) {
        req.body[field] = result.cleanedText;
      }

      next();
    } catch (error) {
      console.error('Moderation middleware error:', error);
      // Fail open - allow content through if moderation fails
      next();
    }
  };
}

/**
 * Moderate multiple fields in request body
 * 
 * Usage:
 * ```ts
 * router.post('/posts',
 *   moderateMultipleFields(['title', 'content', 'tags']),
 *   createPostHandler
 * );
 * ```
 */
export function moderateMultipleFields(fields: string[], autoClean = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!moderationService.isEnabled()) {
      return next();
    }

    try {
      for (const field of fields) {
        const text = req.body[field];

        if (!text || typeof text !== 'string') {
          continue;
        }

        const result = await moderationService.moderateText(text, { autoClean });

        if (!result.approved) {
          return res.status(400).json({
            error: 'ModerationError',
            message: `${field}: ${result.reason}`,
            field,
            flags: result.flags,
          });
        }

        if (result.cleanedText) {
          req.body[field] = result.cleanedText;
        }
      }

      next();
    } catch (error) {
      console.error('Multi-field moderation error:', error);
      next();
    }
  };
}

/**
 * Moderate user profile updates
 * 
 * Usage:
 * ```ts
 * router.patch('/users/me',
 *   authenticateToken,
 *   moderateProfile,
 *   updateProfileHandler
 * );
 * ```
 */
export async function moderateProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!moderationService.isEnabled()) {
    return next();
  }

  try {
    const { name, bio, website } = req.body;

    const result = await moderationService.moderateProfile({
      name,
      bio,
      website,
    });

    if (!result.approved) {
      return res.status(400).json({
        error: 'ModerationError',
        message: 'Profile contains inappropriate content',
        issues: result.issues,
      });
    }

    next();
  } catch (error) {
    console.error('Profile moderation error:', error);
    next();
  }
}

/**
 * Rate limit + moderation combo
 * For high-abuse endpoints (comments, posts)
 */
export function strictModeration(field = 'content') {
  return [
    // Could add rate limiting here if implemented
    moderateContent({ field, autoClean: false, required: true }),
  ];
}

export default {
  moderateContent,
  moderateMultipleFields,
  moderateProfile,
  strictModeration,
};
