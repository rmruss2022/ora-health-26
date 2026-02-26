import { api } from './api';

export interface ReactionCounts {
  '❤️': number;
  '👍': number;
  '🤗': number;
  '💡': number;
  '🔥': number;
}

export interface ReactionSummary {
  counts: ReactionCounts;
  userReactions: string[];
  total: number;
}

export interface Reaction {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  emoji: string;
  createdAt: string;
}

/**
 * Reactions API Service
 */
export const reactionsApi = {
  /**
   * Add a reaction to a post or comment
   */
  addReaction: async (
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment',
    emoji: string
  ): Promise<Reaction> => {
    const response = await api.post('/api/reactions', {
      userId,
      targetId,
      targetType,
      emoji,
    });
    return response.data.reaction;
  },

  /**
   * Remove a reaction
   */
  removeReaction: async (
    userId: string,
    targetId: string,
    emoji: string
  ): Promise<void> => {
    await api.delete('/api/reactions', {
      data: { userId, targetId, emoji },
    });
  },

  /**
   * Get reaction summary for a target
   */
  getReactions: async (
    targetId: string,
    userId?: string
  ): Promise<ReactionSummary> => {
    const params = userId ? `?userId=${userId}` : '';
    const response = await api.get(`/api/reactions/${targetId}${params}`);
    return response.data;
  },

  /**
   * Get reactions for multiple targets (bulk)
   */
  getReactionsBulk: async (
    targetIds: string[],
    userId?: string
  ): Promise<Map<string, ReactionSummary>> => {
    const response = await api.post('/api/reactions/bulk', {
      targetIds,
      userId,
    });
    return new Map(Object.entries(response.data.summaries));
  },
};
