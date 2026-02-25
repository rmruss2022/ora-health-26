// AI Agent Controller
// Handles AI agent interaction endpoints

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiAgentService } from '../services/ai-agent.service';
import { communityService } from '../services/community.service';
import { query } from '../config/database';

class AgentController {
  /**
   * Generate an AI agent comment on a post
   * POST /api/agents/comment/:postId
   */
  async generateComment(req: AuthRequest, res: Response) {
    try {
      const postId = req.params.postId as string;
      const { agentId } = req.body;

      // Get post details
      const postQuery = await query(
        'SELECT * FROM community_posts WHERE id = $1',
        [postId]
      );

      if (postQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const post = postQuery.rows[0];

      // Check if agent should respond
      const shouldRespond = await aiAgentService.shouldAgentRespond(postId);
      if (!shouldRespond) {
        return res.status(400).json({ 
          error: 'Too many agent comments',
          message: 'This post already has enough AI agent comments'
        });
      }

      // Get user context if available
      const userId = Array.isArray(post.user_id) ? post.user_id[0] : post.user_id;
      const postContent = Array.isArray(post.content) ? post.content[0] : post.content;
      const postCategory = Array.isArray(post.category) ? post.category[0] : post.category;
      
      const userContext = userId 
        ? await aiAgentService.getUserContext(userId as string)
        : undefined;

      // Generate comment
      const result = await aiAgentService.generateAgentComment({
        postId,
        postContent: postContent as string,
        postCategory: postCategory as string,
        agentId,
        userContext,
      });

      // Add comment to database
      const comment = await communityService.addComment(
        postId as string,
        'system', // Use system as userId for agent comments
        result.comment,
        false,
        result.agentName as string,
        result.agentAvatar as string
      );

      // Mark as agent comment
      await query(
        'UPDATE post_comments SET agent_id = $1, is_agent_comment = true WHERE id = $2',
        [result.agentId, comment.id]
      );

      res.json({
        success: true,
        comment: {
          ...comment,
          agentId: result.agentId,
          isAgentComment: true,
        }
      });
    } catch (error: any) {
      console.error('Generate agent comment error:', error);
      res.status(500).json({
        error: 'Failed to generate comment',
        message: error.message
      });
    }
  }

  /**
   * Generate an AI agent post
   * POST /api/agents/post
   */
  async generatePost(req: AuthRequest, res: Response) {
    try {
      const { agentId, category, promptText } = req.body;

      if (!category) {
        return res.status(400).json({ error: 'Category is required' });
      }

      // Generate post
      const result = await aiAgentService.generateAgentPost({
        agentId,
        category,
        promptText,
      });

      // Create post in database
      const post = await communityService.createPost('system', {
        type: promptText ? 'prompt' : 'support',
        category,
        content: result.content,
        promptText,
        isAnonymous: false,
        authorName: result.agentName,
        authorAvatar: result.agentAvatar,
      });

      // Mark as agent post
      await query(
        'UPDATE community_posts SET agent_id = $1, is_agent_post = true WHERE id = $2',
        [result.agentId, post.id]
      );

      res.json({
        success: true,
        post: {
          ...post,
          agentId: result.agentId,
          isAgentPost: true,
        }
      });
    } catch (error: any) {
      console.error('Generate agent post error:', error);
      res.status(500).json({
        error: 'Failed to generate post',
        message: error.message
      });
    }
  }

  /**
   * Get all AI agents
   * GET /api/agents
   */
  async getAgents(req: AuthRequest, res: Response) {
    try {
      const result = await query('SELECT * FROM ai_agents WHERE is_active = true');

      res.json({
        success: true,
        agents: result.rows
      });
    } catch (error: any) {
      console.error('Get agents error:', error);
      res.status(500).json({
        error: 'Failed to get agents',
        message: error.message
      });
    }
  }

  /**
   * Get AI agent by ID
   * GET /api/agents/:agentId
   */
  async getAgent(req: AuthRequest, res: Response) {
    try {
      const { agentId } = req.params;

      const result = await query(
        'SELECT * FROM ai_agents WHERE id = $1',
        [agentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json({
        success: true,
        agent: result.rows[0]
      });
    } catch (error: any) {
      console.error('Get agent error:', error);
      res.status(500).json({
        error: 'Failed to get agent',
        message: error.message
      });
    }
  }

  /**
   * Get agent interactions with a user
   * GET /api/agents/interactions/:userId
   */
  async getUserInteractions(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const result = await query(
        `SELECT 
          ai.*,
          a.name as agent_name,
          a.avatar as agent_avatar
         FROM agent_user_interactions ai
         JOIN ai_agents a ON ai.agent_id = a.id
         WHERE ai.user_id = $1
         ORDER BY ai.created_at DESC
         LIMIT 50`,
        [userId]
      );

      res.json({
        success: true,
        interactions: result.rows
      });
    } catch (error: any) {
      console.error('Get user interactions error:', error);
      res.status(500).json({
        error: 'Failed to get interactions',
        message: error.message
      });
    }
  }
}

export const agentController = new AgentController();
