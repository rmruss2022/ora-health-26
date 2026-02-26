import { query } from '../config/database';

export interface CommentReaction {
  type: 'like' | 'support' | 'insightful';
  count: number;
  userReacted: boolean;
}

export interface ThreadedComment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  userId: string;
  author: {
    name: string;
    avatar: string;
    isAnonymous: boolean;
  };
  content: string;
  reactions: CommentReaction[];
  reactionsCount: number;
  repliesCount: number;
  replies: ThreadedComment[];
  depth: number;
  isDeleted: boolean;
  timestamp: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentThread {
  comment: ThreadedComment;
  ancestors: ThreadedComment[];
  descendants: ThreadedComment[];
}

export class CommentService {
  /**
   * Get all threaded comments for a post
   */
  async getPostComments(
    postId: string,
    userId: string,
    limit = 100
  ): Promise<ThreadedComment[]> {
    // Fetch all comments for the post with reaction data
    const queryText = `
      WITH comment_reactions_agg AS (
        SELECT
          comment_id,
          reaction_type,
          COUNT(*) as count,
          BOOL_OR(user_id = $2) as user_reacted
        FROM comment_reactions
        GROUP BY comment_id, reaction_type
      )
      SELECT
        pc.id,
        pc.post_id as "postId",
        pc.parent_comment_id as "parentCommentId",
        pc.user_id as "userId",
        pc.author_name as "authorName",
        pc.author_avatar as "authorAvatar",
        pc.is_anonymous as "isAnonymous",
        pc.content,
        pc.reactions_count as "reactionsCount",
        pc.replies_count as "repliesCount",
        pc.deleted_at as "deletedAt",
        pc.created_at as "createdAt",
        pc.updated_at as "updatedAt",
        COALESCE(
          json_agg(
            json_build_object(
              'type', cra.reaction_type,
              'count', cra.count,
              'userReacted', cra.user_reacted
            )
          ) FILTER (WHERE cra.reaction_type IS NOT NULL),
          '[]'::json
        ) as reactions
      FROM post_comments pc
      LEFT JOIN comment_reactions_agg cra ON cra.comment_id = pc.id
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
      LIMIT $3
      GROUP BY pc.id
    `;

    const result = await query(queryText, [postId, userId, limit]);

    // Build a map of comments by ID for threading
    const commentsMap = new Map<string, ThreadedComment>();
    const rootComments: ThreadedComment[] = [];

    // First pass: create all comment objects
    result.rows.forEach(row => {
      const comment: ThreadedComment = {
        id: row.id,
        postId: row.postId,
        parentCommentId: row.parentCommentId,
        userId: row.userId,
        author: {
          name: row.isAnonymous ? 'Anonymous' : row.authorName,
          avatar: row.authorAvatar,
          isAnonymous: row.isAnonymous
        },
        content: row.deletedAt ? '[deleted]' : row.content,
        reactions: row.reactions || [],
        reactionsCount: row.reactionsCount,
        repliesCount: row.repliesCount,
        replies: [],
        depth: 0,
        isDeleted: !!row.deletedAt,
        timestamp: this.formatTimestamp(row.createdAt),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };

      commentsMap.set(comment.id, comment);

      // If no parent, it's a root comment
      if (!comment.parentCommentId) {
        rootComments.push(comment);
      }
    });

    // Second pass: build the tree structure
    commentsMap.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentsMap.get(comment.parentCommentId);
        if (parent) {
          comment.depth = parent.depth + 1;
          parent.replies.push(comment);
        }
      }
    });

    return rootComments;
  }

  /**
   * Add a top-level comment to a post
   */
  async addComment(
    postId: string,
    userId: string,
    content: string,
    isAnonymous = false,
    authorName = 'User',
    authorAvatar = '👤'
  ): Promise<ThreadedComment> {
    const queryText = `
      INSERT INTO post_comments (
        post_id, user_id, content, is_anonymous, author_name, author_avatar
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id, post_id as "postId", parent_comment_id as "parentCommentId",
        user_id as "userId", author_name as "authorName",
        author_avatar as "authorAvatar", is_anonymous as "isAnonymous",
        content, reactions_count as "reactionsCount",
        replies_count as "repliesCount", deleted_at as "deletedAt",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(queryText, [
      postId, userId, content, isAnonymous, authorName, authorAvatar
    ]);

    // Increment post's comment count
    await query(
      'UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      postId: row.postId,
      parentCommentId: row.parentCommentId,
      userId: row.userId,
      author: {
        name: row.isAnonymous ? 'Anonymous' : row.authorName,
        avatar: row.authorAvatar,
        isAnonymous: row.isAnonymous
      },
      content: row.content,
      reactions: [],
      reactionsCount: row.reactionsCount,
      repliesCount: row.repliesCount,
      replies: [],
      depth: 0,
      isDeleted: false,
      timestamp: this.formatTimestamp(row.createdAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * Reply to an existing comment (nested)
   */
  async replyToComment(
    commentId: string,
    userId: string,
    content: string,
    isAnonymous = false,
    authorName = 'User',
    authorAvatar = '👤'
  ): Promise<ThreadedComment> {
    // First verify the parent comment exists and get post_id
    const parentQuery = `
      SELECT post_id, deleted_at FROM post_comments WHERE id = $1
    `;
    const parentResult = await query(parentQuery, [commentId]);

    if (parentResult.rows.length === 0) {
      throw new Error('Parent comment not found');
    }

    const postId = parentResult.rows[0].post_id;

    const queryText = `
      INSERT INTO post_comments (
        post_id, parent_comment_id, user_id, content,
        is_anonymous, author_name, author_avatar
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, post_id as "postId", parent_comment_id as "parentCommentId",
        user_id as "userId", author_name as "authorName",
        author_avatar as "authorAvatar", is_anonymous as "isAnonymous",
        content, reactions_count as "reactionsCount",
        replies_count as "repliesCount", deleted_at as "deletedAt",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(queryText, [
      postId, commentId, userId, content, isAnonymous, authorName, authorAvatar
    ]);

    // Increment post's comment count
    await query(
      'UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );

    const row = result.rows[0];

    // Calculate depth by walking up parent chain
    const depth = await this.calculateCommentDepth(commentId) + 1;

    return {
      id: row.id,
      postId: row.postId,
      parentCommentId: row.parentCommentId,
      userId: row.userId,
      author: {
        name: row.isAnonymous ? 'Anonymous' : row.authorName,
        avatar: row.authorAvatar,
        isAnonymous: row.isAnonymous
      },
      content: row.content,
      reactions: [],
      reactionsCount: row.reactionsCount,
      repliesCount: row.repliesCount,
      replies: [],
      depth,
      isDeleted: false,
      timestamp: this.formatTimestamp(row.createdAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * React to a comment (toggle reaction)
   */
  async reactToComment(
    commentId: string,
    userId: string,
    reactionType: 'like' | 'support' | 'insightful'
  ): Promise<{ reacted: boolean; reactionsCount: number; reactions: CommentReaction[] }> {
    // Check if user already has this reaction
    const checkQuery = `
      SELECT id FROM comment_reactions
      WHERE comment_id = $1 AND user_id = $2 AND reaction_type = $3
    `;
    const checkResult = await query(checkQuery, [commentId, userId, reactionType]);

    if (checkResult.rows.length > 0) {
      // Remove reaction
      await query(
        'DELETE FROM comment_reactions WHERE comment_id = $1 AND user_id = $2 AND reaction_type = $3',
        [commentId, userId, reactionType]
      );
    } else {
      // Add reaction
      await query(
        'INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES ($1, $2, $3)',
        [commentId, userId, reactionType]
      );
    }

    // Get updated reaction counts
    const reactions = await this.getCommentReactions(commentId, userId);
    const reactionsCount = reactions.reduce((sum, r) => sum + r.count, 0);

    return {
      reacted: checkResult.rows.length === 0,
      reactionsCount,
      reactions
    };
  }

  /**
   * Get reactions for a comment
   */
  async getCommentReactions(
    commentId: string,
    userId: string
  ): Promise<CommentReaction[]> {
    const queryText = `
      SELECT
        reaction_type,
        COUNT(*) as count,
        BOOL_OR(user_id = $2) as user_reacted
      FROM comment_reactions
      WHERE comment_id = $1
      GROUP BY reaction_type
      ORDER BY reaction_type
    `;

    const result = await query(queryText, [commentId, userId]);

    return result.rows.map(row => ({
      type: row.reaction_type,
      count: parseInt(row.count),
      userReacted: row.user_reacted
    }));
  }

  /**
   * Soft delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    // Verify ownership
    const ownershipQuery = `
      SELECT user_id, post_id FROM post_comments WHERE id = $1 AND deleted_at IS NULL
    `;
    const ownershipResult = await query(ownershipQuery, [commentId]);

    if (ownershipResult.rows.length === 0) {
      throw new Error('Comment not found or already deleted');
    }

    if (ownershipResult.rows[0].user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own comments');
    }

    const postId = ownershipResult.rows[0].post_id;

    // Soft delete the comment
    const deleteQuery = `
      UPDATE post_comments
      SET deleted_at = CURRENT_TIMESTAMP, content = '[deleted]'
      WHERE id = $1
      RETURNING id
    `;
    const result = await query(deleteQuery, [commentId]);

    if (result.rows.length > 0) {
      // Decrement post's comment count
      await query(
        'UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = $1 AND comments_count > 0',
        [postId]
      );
      return true;
    }

    return false;
  }

  /**
   * Get full thread context for a comment (ancestors + descendants)
   */
  async getCommentThread(
    commentId: string,
    userId: string
  ): Promise<CommentThread> {
    // Get the target comment
    const commentQuery = `
      SELECT
        id, post_id as "postId", parent_comment_id as "parentCommentId",
        user_id as "userId", author_name as "authorName",
        author_avatar as "authorAvatar", is_anonymous as "isAnonymous",
        content, reactions_count as "reactionsCount",
        replies_count as "repliesCount", deleted_at as "deletedAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM post_comments
      WHERE id = $1
    `;
    const commentResult = await query(commentQuery, [commentId]);

    if (commentResult.rows.length === 0) {
      throw new Error('Comment not found');
    }

    const row = commentResult.rows[0];
    const comment = await this.rowToThreadedComment(row, userId);

    // Get ancestors (walk up the parent chain)
    const ancestors = await this.getCommentAncestors(commentId, userId);

    // Get descendants (all nested replies)
    const descendants = await this.getCommentDescendants(commentId, userId);

    return {
      comment,
      ancestors,
      descendants
    };
  }

  /**
   * Helper: Get all ancestor comments
   */
  private async getCommentAncestors(
    commentId: string,
    userId: string
  ): Promise<ThreadedComment[]> {
    const queryText = `
      WITH RECURSIVE ancestors AS (
        SELECT
          pc.id, pc.post_id, pc.parent_comment_id, pc.user_id,
          pc.author_name, pc.author_avatar, pc.is_anonymous,
          pc.content, pc.reactions_count, pc.replies_count,
          pc.deleted_at, pc.created_at, pc.updated_at,
          1 as depth
        FROM post_comments pc
        WHERE pc.id = (
          SELECT parent_comment_id FROM post_comments WHERE id = $1
        )
        
        UNION ALL
        
        SELECT
          pc.id, pc.post_id, pc.parent_comment_id, pc.user_id,
          pc.author_name, pc.author_avatar, pc.is_anonymous,
          pc.content, pc.reactions_count, pc.replies_count,
          pc.deleted_at, pc.created_at, pc.updated_at,
          a.depth + 1 as depth
        FROM post_comments pc
        INNER JOIN ancestors a ON a.parent_comment_id = pc.id
      )
      SELECT * FROM ancestors ORDER BY depth DESC
    `;

    const result = await query(queryText, [commentId]);

    return Promise.all(
      result.rows.map(row => this.rowToThreadedComment(row, userId))
    );
  }

  /**
   * Helper: Get all descendant comments
   */
  private async getCommentDescendants(
    commentId: string,
    userId: string
  ): Promise<ThreadedComment[]> {
    const queryText = `
      WITH RECURSIVE descendants AS (
        SELECT
          pc.id, pc.post_id, pc.parent_comment_id, pc.user_id,
          pc.author_name, pc.author_avatar, pc.is_anonymous,
          pc.content, pc.reactions_count, pc.replies_count,
          pc.deleted_at, pc.created_at, pc.updated_at,
          0 as depth
        FROM post_comments pc
        WHERE pc.parent_comment_id = $1
        
        UNION ALL
        
        SELECT
          pc.id, pc.post_id, pc.parent_comment_id, pc.user_id,
          pc.author_name, pc.author_avatar, pc.is_anonymous,
          pc.content, pc.reactions_count, pc.replies_count,
          pc.deleted_at, pc.created_at, pc.updated_at,
          d.depth + 1 as depth
        FROM post_comments pc
        INNER JOIN descendants d ON d.id = pc.parent_comment_id
      )
      SELECT * FROM descendants ORDER BY created_at ASC
    `;

    const result = await query(queryText, [commentId]);

    return Promise.all(
      result.rows.map(row => this.rowToThreadedComment(row, userId))
    );
  }

  /**
   * Helper: Convert DB row to ThreadedComment
   */
  private async rowToThreadedComment(row: any, userId: string): Promise<ThreadedComment> {
    const reactions = await this.getCommentReactions(row.id, userId);
    const depth = row.parent_comment_id ? await this.calculateCommentDepth(row.id) : 0;

    return {
      id: row.id,
      postId: row.post_id || row.postId,
      parentCommentId: row.parent_comment_id || row.parentCommentId,
      userId: row.user_id || row.userId,
      author: {
        name: row.is_anonymous || row.isAnonymous ? 'Anonymous' : row.author_name || row.authorName,
        avatar: row.author_avatar || row.authorAvatar,
        isAnonymous: row.is_anonymous || row.isAnonymous
      },
      content: row.deleted_at || row.deletedAt ? '[deleted]' : row.content,
      reactions,
      reactionsCount: row.reactions_count || row.reactionsCount || 0,
      repliesCount: row.replies_count || row.repliesCount || 0,
      replies: [],
      depth,
      isDeleted: !!(row.deleted_at || row.deletedAt),
      timestamp: this.formatTimestamp(row.created_at || row.createdAt),
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt
    };
  }

  /**
   * Helper: Calculate comment depth
   */
  private async calculateCommentDepth(commentId: string): Promise<number> {
    const queryText = `
      WITH RECURSIVE depth_calc AS (
        SELECT id, parent_comment_id, 0 as depth
        FROM post_comments
        WHERE id = $1
        
        UNION ALL
        
        SELECT pc.id, pc.parent_comment_id, dc.depth + 1
        FROM post_comments pc
        INNER JOIN depth_calc dc ON dc.parent_comment_id = pc.id
      )
      SELECT MAX(depth) as max_depth FROM depth_calc
    `;

    const result = await query(queryText, [commentId]);
    return result.rows[0]?.max_depth || 0;
  }

  /**
   * Helper: Format timestamp
   */
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return `${Math.floor(diffDays / 7)}w ago`;
    }
  }
}

export const commentService = new CommentService();
