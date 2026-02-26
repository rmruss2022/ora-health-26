/**
 * Comment Controller
 * 
 * Note: This project uses route-level handlers instead of traditional controllers.
 * The actual request handling logic is in src/routes/comment.routes.ts
 * 
 * This file is provided for architectural documentation and future refactoring.
 * If you want to extract business logic from routes, implement controller methods here
 * and call them from the route handlers.
 */

import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class CommentController {
  /**
   * Get all threaded comments for a post
   */
  async getPostComments(req: Request, res: Response): Promise<void> {
    try {
      const { id: postId } = req.params;
      const userId = req.query.userId as string || 'default-user';
      const limit = parseInt(req.query.limit as string) || 100;

      const comments = await commentService.getPostComments(postId, userId, limit);
      res.json({ comments });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  /**
   * Add a top-level comment to a post
   */
  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { id: postId } = req.params;
      const userId = req.body.userId || 'default-user';
      const {
        content,
        isAnonymous = false,
        authorName = 'User',
        authorAvatar = '👤'
      } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ error: 'Comment content is required' });
        return;
      }

      if (content.length > 2000) {
        res.status(400).json({ error: 'Comment is too long (max 2000 characters)' });
        return;
      }

      const comment = await commentService.addComment(
        postId,
        userId,
        content,
        isAnonymous,
        authorName,
        authorAvatar
      );

      res.status(201).json({ comment });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  /**
   * Reply to an existing comment (creates nested comment)
   */
  async replyToComment(req: Request, res: Response): Promise<void> {
    try {
      const { id: commentId } = req.params;
      const userId = req.body.userId || 'default-user';
      const {
        content,
        isAnonymous = false,
        authorName = 'User',
        authorAvatar = '👤'
      } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ error: 'Reply content is required' });
        return;
      }

      if (content.length > 2000) {
        res.status(400).json({ error: 'Reply is too long (max 2000 characters)' });
        return;
      }

      const reply = await commentService.replyToComment(
        commentId,
        userId,
        content,
        isAnonymous,
        authorName,
        authorAvatar
      );

      res.status(201).json({ comment: reply });
    } catch (error) {
      console.error('Error adding reply:', error);
      if (error instanceof Error && error.message === 'Parent comment not found') {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }
      res.status(500).json({ error: 'Failed to add reply' });
    }
  }

  /**
   * React to a comment (like, support, insightful)
   */
  async reactToComment(req: Request, res: Response): Promise<void> {
    try {
      const { id: commentId } = req.params;
      const userId = req.body.userId || 'default-user';
      const { reactionType } = req.body;

      if (!reactionType) {
        res.status(400).json({ error: 'Reaction type is required' });
        return;
      }

      const validReactions = ['like', 'support', 'insightful'];
      if (!validReactions.includes(reactionType)) {
        res.status(400).json({
          error: `Invalid reaction type. Must be one of: ${validReactions.join(', ')}`
        });
        return;
      }

      const result = await commentService.reactToComment(
        commentId,
        userId,
        reactionType
      );

      res.json(result);
    } catch (error) {
      console.error('Error reacting to comment:', error);
      res.status(500).json({ error: 'Failed to react to comment' });
    }
  }

  /**
   * Soft delete a comment
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { id: commentId } = req.params;
      const userId = req.body.userId || req.query.userId as string || 'default-user';

      const deleted = await commentService.deleteComment(commentId, userId);

      if (deleted) {
        res.json({ success: true, message: 'Comment deleted' });
      } else {
        res.status(500).json({ error: 'Failed to delete comment' });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message.includes('Unauthorized')) {
          res.status(403).json({ error: error.message });
          return;
        }
      }
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }

  /**
   * Get full thread context for a comment
   */
  async getCommentThread(req: Request, res: Response): Promise<void> {
    try {
      const { id: commentId } = req.params;
      const userId = req.query.userId as string || 'default-user';

      const thread = await commentService.getCommentThread(commentId, userId);
      res.json(thread);
    } catch (error) {
      console.error('Error fetching comment thread:', error);
      if (error instanceof Error && error.message === 'Comment not found') {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch comment thread' });
    }
  }
}

export const commentController = new CommentController();
