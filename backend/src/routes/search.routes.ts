/**
 * Search Routes
 * API endpoints for forum post search and sort functionality
 */

import { Router } from 'express';
import { searchService } from '../services/search.service';

const router = Router();

/**
 * Search forum posts
 * GET /api/search/posts?q=query&category=&author=&sort=
 */
router.get('/posts', async (req, res) => {
  try {
    const {
      q,
      category,
      author,
      sort = 'recent',
      limit = 20,
      offset = 0,
    } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
      });
    }

    const results = await searchService.searchPosts({
      query: q.trim(),
      category: category as string | undefined,
      author: author as string | undefined,
      sortBy: sort as 'recent' | 'responses' | 'reactions',
      limit: Math.min(Number(limit), 50),
      offset: Number(offset),
    });

    res.json(results);
  } catch (error: any) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: error.message || 'Failed to search posts' });
  }
});

/**
 * Search users (for mentions, etc.)
 * GET /api/search/users?q=query
 */
router.get('/users', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
      });
    }

    const results = await searchService.searchUsers({
      query: q.trim(),
      limit: Math.min(Number(limit), 20),
    });

    res.json(results);
  } catch (error: any) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message || 'Failed to search users' });
  }
});

/**
 * Get trending search queries
 * GET /api/search/trending
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trending = await searchService.getTrendingSearches(Number(limit));

    res.json(trending);
  } catch (error: any) {
    console.error('Error fetching trending searches:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch trending searches' });
  }
});

export default router;
