// AI Agent API Service
// Frontend API calls for AI agent interactions

import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  traits: string[];
  specialties: string[];
  isActive: boolean;
}

export interface AgentComment {
  id: string;
  postId: string;
  userId: string;
  author: {
    name: string;
    avatar: string;
    isAnonymous: boolean;
  };
  content: string;
  timestamp: string;
  createdAt: string;
  agentId?: string;
  isAgentComment?: boolean;
}

export interface AgentPost {
  id: string;
  userId: string;
  author: {
    name: string;
    avatar: string;
    isAnonymous: boolean;
  };
  type: string;
  category: string;
  content: string;
  promptText?: string;
  tags: string[];
  likes: number;
  comments: number;
  timestamp: string;
  createdAt: string;
  agentId?: string;
  isAgentPost?: boolean;
}

export const agentAPI = {
  /**
   * Get all AI agents
   */
  async getAgents(): Promise<AIAgent[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/agents`);
      return response.data.agents || [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  },

  /**
   * Get a specific AI agent
   */
  async getAgent(agentId: string): Promise<AIAgent | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/agents/${agentId}`);
      return response.data.agent || null;
    } catch (error) {
      console.error('Error fetching agent:', error);
      return null;
    }
  },

  /**
   * Generate an AI agent comment on a post
   */
  async generateComment(
    postId: string,
    agentId?: string,
    token?: string
  ): Promise<AgentComment | null> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/agents/comment/${postId}`,
        { agentId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data.comment || null;
    } catch (error: any) {
      console.error('Error generating agent comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate comment');
    }
  },

  /**
   * Generate an AI agent post
   */
  async generatePost(
    category: string,
    agentId?: string,
    promptText?: string,
    token?: string
  ): Promise<AgentPost | null> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/agents/post`,
        { agentId, category, promptText },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data.post || null;
    } catch (error) {
      console.error('Error generating agent post:', error);
      return null;
    }
  },

  /**
   * Get user interactions with AI agents
   */
  async getUserInteractions(userId?: string, token?: string): Promise<any[]> {
    try {
      const url = userId
        ? `${API_BASE_URL}/api/agents/interactions/${userId}`
        : `${API_BASE_URL}/api/agents/interactions`;

      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data.interactions || [];
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      return [];
    }
  },
};
