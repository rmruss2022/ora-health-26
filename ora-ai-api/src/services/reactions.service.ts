import { query } from '../config/database';
import { randomUUID } from 'crypto';

export interface Reaction {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  emoji: '❤️' | '👍' | '🤗' | '💡' | '🔥';
  createdAt: Date;
}

export interface ReactionCounts {
  '❤️': number;
  '👍': number;
  '🤗': number;
  '💡': number;
  '🔥': number;
}

export interface ReactionSummary {
  counts: ReactionCounts;
  userReactions: string[]; // emojis the current user has reacted with
  total: number;
}

export class ReactionsService {
  // Add a reaction
  async addReaction(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment',
    emoji: string
  ): Promise<Reaction> {
    const validEmojis = ['❤️', '👍', '🤗', '💡', '🔥'];
    
    if (!validEmojis.includes(emoji)) {
      throw new Error('Invalid emoji');
    }

    const reactionId = randomUUID();
    
    try {
      // Insert reaction (will fail if duplicate due to unique constraint)
      const result = await query(
        `INSERT INTO reactions (id, user_id, target_id, target_type, emoji)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [reactionId, userId, targetId, targetType, emoji]
      );

      // Update denormalized count
      await this.updateReactionCount(targetId, targetType);

      return result.rows[0];
    } catch (error: any) {
      // If it's a duplicate key error, that's fine - user already reacted
      if (error.code === '23505') { // Unique violation
        const existing = await query(
          'SELECT * FROM reactions WHERE user_id = $1 AND target_id = $2 AND emoji = $3',
          [userId, targetId, emoji]
        );
        return existing.rows[0];
      }
      throw error;
    }
  }

  // Remove a reaction
  async removeReaction(
    userId: string,
    targetId: string,
    emoji: string
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM reactions
       WHERE user_id = $1 AND target_id = $2 AND emoji = $3
       RETURNING target_type`,
      [userId, targetId, emoji]
    );

    if (result.rows.length > 0) {
      // Update denormalized count
      await this.updateReactionCount(targetId, result.rows[0].target_type);
      return true;
    }

    return false;
  }

  // Get reaction summary for a target
  async getReactionSummary(
    targetId: string,
    userId?: string
  ): Promise<ReactionSummary> {
    // Get all reactions for this target
    const result = await query(
      'SELECT emoji, user_id FROM reactions WHERE target_id = $1',
      [targetId]
    );

    // Initialize counts
    const counts: ReactionCounts = {
      '❤️': 0,
      '👍': 0,
      '🤗': 0,
      '💡': 0,
      '🔥': 0,
    };

    const userReactions: string[] = [];
    let total = 0;

    // Process reactions
    for (const row of result.rows) {
      counts[row.emoji as keyof ReactionCounts]++;
      total++;
      
      if (userId && row.user_id === userId) {
        userReactions.push(row.emoji);
      }
    }

    return { counts, userReactions, total };
  }

  // Get multiple reaction summaries at once (for list views)
  async getReactionSummaries(
    targetIds: string[],
    userId?: string
  ): Promise<Map<string, ReactionSummary>> {
    if (targetIds.length === 0) {
      return new Map();
    }

    const result = await query(
      'SELECT target_id, emoji, user_id FROM reactions WHERE target_id = ANY($1)',
      [targetIds]
    );

    // Group by target_id
    const summaries = new Map<string, ReactionSummary>();

    // Initialize all targets
    for (const targetId of targetIds) {
      summaries.set(targetId, {
        counts: { '❤️': 0, '👍': 0, '🤗': 0, '💡': 0, '🔥': 0 },
        userReactions: [],
        total: 0,
      });
    }

    // Process reactions
    for (const row of result.rows) {
      const summary = summaries.get(row.target_id)!;
      summary.counts[row.emoji as keyof ReactionCounts]++;
      summary.total++;

      if (userId && row.user_id === userId) {
        summary.userReactions.push(row.emoji);
      }
    }

    return summaries;
  }

  // Update denormalized reaction count
  private async updateReactionCount(targetId: string, targetType: 'post' | 'comment'): Promise<void> {
    const countResult = await query(
      'SELECT COUNT(*) as count FROM reactions WHERE target_id = $1',
      [targetId]
    );

    const count = parseInt(countResult.rows[0].count);

    if (targetType === 'post') {
      await query(
        'UPDATE community_posts SET reactions_count = $1 WHERE id = $2',
        [count, targetId]
      );
    } else if (targetType === 'comment') {
      await query(
        'UPDATE post_comments SET reactions_count = $1 WHERE id = $2',
        [count, targetId]
      );
    }
  }
}

export const reactionsService = new ReactionsService();
