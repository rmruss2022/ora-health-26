import { Router } from 'express';
import { commentService } from '../services/comment.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/posts/:id/comments
 * Get all threaded comments for a post
 */
router.get('/posts/:id/comments', async (req, res) => {
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
});

/**
 * POST /api/posts/:id/comments
 * Add a top-level comment to a post
 */
router.post('/posts/:id/comments', async (req, res) => {
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
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Comment is too long (max 2000 characters)' });
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
});

/**
 * POST /api/comments/:id/reply
 * Reply to an existing comment (creates nested comment)
 */
router.post('/comments/:id/reply', async (req, res) => {
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
      return res.status(400).json({ error: 'Reply content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Reply is too long (max 2000 characters)' });
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
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

/**
 * POST /api/comments/:id/react
 * React to a comment (like, support, insightful)
 * Toggles the reaction if user already has it
 */
router.post('/comments/:id/react', async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.body.userId || 'default-user';
    const { reactionType } = req.body;

    if (!reactionType) {
      return res.status(400).json({ error: 'Reaction type is required' });
    }

    const validReactions = ['like', 'support', 'insightful'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({
        error: `Invalid reaction type. Must be one of: ${validReactions.join(', ')}`
      });
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
});

/**
 * DELETE /api/comments/:id
 * Soft delete a comment (user must own the comment)
 */
router.delete('/comments/:id', async (req, res) => {
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
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

/**
 * GET /api/comments/:id/thread
 * Get full thread context for a comment (ancestors + descendants)
 */
router.get('/comments/:id/thread', async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.query.userId as string || 'default-user';

    const thread = await commentService.getCommentThread(commentId, userId);
    res.json(thread);
  } catch (error) {
    console.error('Error fetching comment thread:', error);
    if (error instanceof Error && error.message === 'Comment not found') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(500).json({ error: 'Failed to fetch comment thread' });
  }
});

export default router;
