/**
 * Community Search Service
 * Full-text search for forum posts using PostgreSQL tsvector
 */

import { query } from '../config/database';

export type SortOption = 'recent' | 'most_responses' | 'most_supported';

interface SearchFilters {
  query?: string;
  category?: string;
  authorId?: string;
  sort?: SortOption;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  category: string;
  title: string;
  content: string;
  responseCount: number;
  supportCount: number;
  createdAt: Date;
  isAnonymous: boolean;
  // Search-specific fields
  rank?: number;
  headline?: string;
}

export class CommunitySearchService {
  /**
   * Search forum posts with full-text search
   */
  async searchPosts(filters: SearchFilters): Promise<{
    posts: SearchResult[];
    total: number;
  }> {
    const {
      query: searchQuery = '',
      category,
      authorId,
      sort = 'recent',
      limit = 20,
      offset = 0,
    } = filters;

    try {
      // Build WHERE clause
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Full-text search
      if (searchQuery && searchQuery.trim().length > 0) {
        // Use ts_query for full-text search
        whereConditions.push(
          `(
            to_tsvector('english', COALESCE(p.title, '')) ||
            to_tsvector('english', COALESCE(p.content, '')) ||
            to_tsvector('english', COALESCE(u.name, ''))
          ) @@ plainto_tsquery('english', $${paramIndex})`
        );
        queryParams.push(searchQuery);
        paramIndex++;
      }

      // Category filter
      if (category) {
        whereConditions.push(`p.category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      // Author filter
      if (authorId) {
        whereConditions.push(`p.user_id = $${paramIndex}`);
        queryParams.push(authorId);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      // Build ORDER BY clause
      let orderClause = '';
      switch (sort) {
        case 'most_responses':
          orderClause = 'ORDER BY response_count DESC, p.created_at DESC';
          break;
        case 'most_supported':
          orderClause = 'ORDER BY support_count DESC, p.created_at DESC';
          break;
        case 'recent':
        default:
          orderClause = 'ORDER BY p.created_at DESC';
          break;
      }

      // Add search rank if searching
      const rankSelect = searchQuery
        ? `, ts_rank(
            to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '')),
            plainto_tsquery('english', $1)
          ) as rank`
        : ', 0 as rank';

      // Build query
      const queryText = `
        SELECT
          p.id,
          p.user_id as "userId",
          u.name as "userName",
          u.avatar_url as "userAvatar",
          p.category,
          p.title,
          p.content,
          p.created_at as "createdAt",
          p.is_anonymous as "isAnonymous",
          COUNT(DISTINCT c.id) as "responseCount",
          COUNT(DISTINCT r.id) as "supportCount"
          ${rankSelect}
        FROM community_posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN reactions r ON p.id = r.target_id AND r.target_type = 'post'
        ${whereClause}
        GROUP BY p.id, u.id, u.name, u.avatar_url
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await query(queryText, queryParams);

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM community_posts p
        LEFT JOIN users u ON p.user_id = u.id
        ${whereClause}
      `;

      const countResult = await query(
        countQuery,
        queryParams.slice(0, queryParams.length - 2)
      );

      return {
        posts: result.rows.map(row => ({
          ...row,
          responseCount: parseInt(row.responseCount, 10),
          supportCount: parseInt(row.supportCount, 10),
        })),
        total: parseInt(countResult.rows[0]?.total || '0', 10),
      };
    } catch (error) {
      console.error('Error searching community posts:', error);
      throw error;
    }
  }

  /**
   * Create or update tsvector search index
   */
  async createSearchIndex(): Promise<void> {
    try {
      // Create tsvector column if it doesn't exist
      await query(`
        ALTER TABLE community_posts
        ADD COLUMN IF NOT EXISTS search_vector tsvector
        GENERATED ALWAYS AS (
          to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
        ) STORED;
      `);

      // Create GIN index for fast searching
      await query(`
        CREATE INDEX IF NOT EXISTS idx_community_posts_search_vector
        ON community_posts USING GIN (search_vector);
      `);

      console.log('Search index created successfully');
    } catch (error) {
      console.error('Error creating search index:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(
    partialQuery: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      if (!partialQuery || partialQuery.trim().length < 2) {
        return [];
      }

      const result = await query(
        `SELECT DISTINCT
          CASE
            WHEN title ILIKE $1 THEN title
            WHEN content ILIKE $1 THEN substring(content from 1 for 100)
          END as suggestion
         FROM community_posts
         WHERE title ILIKE $1 OR content ILIKE $1
         LIMIT $2`,
        [`%${partialQuery}%`, limit]
      );

      return result.rows
        .map(row => row.suggestion)
        .filter(s => s && s.trim().length > 0);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    try {
      // This would require a search_logs table to track queries
      // For now, return popular categories or tags
      const result = await query(
        `SELECT category, COUNT(*) as count
         FROM community_posts
         GROUP BY category
         ORDER BY count DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map(row => row.category);
    } catch (error) {
      console.error('Error getting popular search terms:', error);
      return [];
    }
  }
}

// Singleton instance
export const communitySearchService = new CommunitySearchService();
