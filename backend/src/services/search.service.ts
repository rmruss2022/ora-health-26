/**
 * Search Service
 * Full-text search for forum posts using PostgreSQL tsvector
 */

import { vectorSearchService } from './vector-search.service';

interface SearchPostsParams {
  query: string;
  category?: string;
  author?: string;
  sortBy?: 'recent' | 'responses' | 'reactions';
  limit?: number;
  offset?: number;
}

interface SearchUsersParams {
  query: string;
  limit?: number;
}

interface PostSearchResult {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  category: string;
  created_at: Date;
  response_count: number;
  reaction_count: number;
  rank: number; // Search relevance score
}

interface UserSearchResult {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
}

export class SearchService {
  /**
   * Search forum posts with full-text search
   */
  async searchPosts(params: SearchPostsParams): Promise<{
    results: PostSearchResult[];
    total: number;
    query: string;
  }> {
    const {
      query,
      category,
      author,
      sortBy = 'recent',
      limit = 20,
      offset = 0,
    } = params;

    try {
      // Build the search query using PostgreSQL tsvector
      let sqlQuery = `
        SELECT 
          p.id,
          p.title,
          p.content,
          p.author_id,
          u.name as author_name,
          p.category,
          p.created_at,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as response_count,
          (SELECT COUNT(*) FROM reactions r WHERE r.target_type = 'post' AND r.target_id = p.id::text) as reaction_count,
          ts_rank_cd(
            to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '')),
            plainto_tsquery('english', $1)
          ) as rank
        FROM community_posts p
        JOIN users u ON p.author_id = u.id
        WHERE to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '')) 
              @@ plainto_tsquery('english', $1)
      `;

      const queryParams: any[] = [query];
      let paramIndex = 2;

      // Add category filter
      if (category) {
        sqlQuery += ` AND p.category = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }

      // Add author filter
      if (author) {
        sqlQuery += ` AND (u.name ILIKE $${paramIndex} OR p.author_id = $${paramIndex})`;
        queryParams.push(`%${author}%`);
        paramIndex++;
      }

      // Add sorting
      switch (sortBy) {
        case 'responses':
          sqlQuery += ` ORDER BY response_count DESC, rank DESC`;
          break;
        case 'reactions':
          sqlQuery += ` ORDER BY reaction_count DESC, rank DESC`;
          break;
        case 'recent':
        default:
          sqlQuery += ` ORDER BY p.created_at DESC, rank DESC`;
      }

      // Add pagination
      sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      // Execute search
      const result = await vectorSearchService.pool.query(sqlQuery, queryParams);

      // Get total count (for pagination)
      let countQuery = `
        SELECT COUNT(*) as total
        FROM community_posts p
        JOIN users u ON p.author_id = u.id
        WHERE to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, ''))
              @@ plainto_tsquery('english', $1)
      `;

      const countParams: any[] = [query];
      let countParamIndex = 2;

      if (category) {
        countQuery += ` AND p.category = $${countParamIndex}`;
        countParams.push(category);
        countParamIndex++;
      }

      if (author) {
        countQuery += ` AND (u.name ILIKE $${countParamIndex} OR p.author_id = $${countParamIndex})`;
        countParams.push(`%${author}%`);
      }

      const countResult = await vectorSearchService.pool.query(countQuery, countParams);

      // Log search query for trending
      await this.logSearchQuery(query);

      return {
        results: result.rows,
        total: parseInt(countResult.rows[0]?.total || '0'),
        query,
      };
    } catch (error) {
      console.error('Error in searchPosts:', error);
      throw new Error('Failed to search posts');
    }
  }

  /**
   * Search users by name
   */
  async searchUsers(params: SearchUsersParams): Promise<UserSearchResult[]> {
    const { query, limit = 10 } = params;

    try {
      const result = await vectorSearchService.pool.query(
        `SELECT 
          id,
          name,
          avatar_url,
          bio
         FROM users
         WHERE name ILIKE $1
         ORDER BY 
           CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END, -- Exact matches first
           name
         LIMIT $3`,
        [`%${query}%`, query, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error in searchUsers:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get trending search queries
   */
  async getTrendingSearches(limit: number = 10): Promise<Array<{
    query: string;
    count: number;
  }>> {
    try {
      const result = await vectorSearchService.pool.query(
        `SELECT 
          query,
          COUNT(*) as count
         FROM search_queries
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY query
         ORDER BY count DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching trending searches:', error);
      return [];
    }
  }

  /**
   * Log a search query for analytics and trending
   */
  private async logSearchQuery(query: string): Promise<void> {
    try {
      await vectorSearchService.pool.query(
        `INSERT INTO search_queries (query, created_at) VALUES ($1, NOW())`,
        [query.toLowerCase().trim()]
      );
    } catch (error) {
      // Don't throw - logging is non-critical
      console.error('Error logging search query:', error);
    }
  }

  /**
   * Create full-text search index (run once during setup)
   */
  async createSearchIndexes(): Promise<void> {
    try {
      // Create GIN index for tsvector search
      await vectorSearchService.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_posts_search 
        ON community_posts 
        USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '')))
      `);

      // Create search_queries table if it doesn't exist
      await vectorSearchService.pool.query(`
        CREATE TABLE IF NOT EXISTS search_queries (
          id SERIAL PRIMARY KEY,
          query TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create index on search_queries for trending
      await vectorSearchService.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_search_queries_created 
        ON search_queries (created_at DESC)
      `);

      console.log('[SearchService] Search indexes created successfully');
    } catch (error) {
      console.error('Error creating search indexes:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSearchSuggestions(prefix: string, limit: number = 5): Promise<string[]> {
    try {
      // Get recent searches matching prefix
      const result = await vectorSearchService.pool.query(
        `SELECT DISTINCT query
         FROM search_queries
         WHERE query ILIKE $1
         AND created_at >= NOW() - INTERVAL '30 days'
         ORDER BY query
         LIMIT $2`,
        [`${prefix}%`, limit]
      );

      return result.rows.map(row => row.query);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
}

// Singleton instance
export const searchService = new SearchService();
