import { apiClient } from './apiClient';
import type { CommunityPost, Comment, CommunityPrompt } from '../../types';

export class CommunityAPI {
  // Posts
  async createPost(post: {
    content: string;
    type: string;
    category: string;
    tags?: string[];
    isAnonymous?: boolean;
    promptText?: string;
  }): Promise<CommunityPost> {
    const response = await apiClient.post<{ post: CommunityPost }>('/community/posts', post);
    return response.post;
  }

  async getPosts(params?: {
    limit?: number;
    offset?: number;
    category?: string;
  }): Promise<CommunityPost[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.category) queryParams.set('category', params.category);

    const query = queryParams.toString();
    const endpoint = `/community/posts${query ? `?${query}` : ''}`;

    const response = await apiClient.get<{ posts: CommunityPost[] }>(endpoint);
    return response.posts;
  }

  async getPost(postId: string): Promise<CommunityPost> {
    return apiClient.get<CommunityPost>(`/community/posts/${postId}`);
  }

  async likePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    return apiClient.post(`/community/posts/${postId}/like`, {});
  }

  async unlikePost(postId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/community/posts/${postId}/like`);
  }

  async deletePost(postId: string): Promise<void> {
    return apiClient.delete(`/community/posts/${postId}`);
  }

  // Comments
  async createComment(postId: string, comment: {
    content: string;
    isAnonymous?: boolean;
  }): Promise<Comment> {
    const response = await apiClient.post<{ comment: Comment }>(
      `/community/posts/${postId}/comments`,
      comment
    );
    return response.comment;
  }

  async getComments(postId: string): Promise<Comment[]> {
    const response = await apiClient.get<{ comments: Comment[] }>(`/community/posts/${postId}/comments`);
    return response.comments;
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    return apiClient.delete(`/community/posts/${postId}/comments/${commentId}`);
  }

  // Prompts
  async getActivePrompts(): Promise<CommunityPrompt[]> {
    return apiClient.get<CommunityPrompt[]>('/community/prompts/active');
  }

  async getPromptResponses(promptId: string): Promise<CommunityPost[]> {
    return apiClient.get<CommunityPost[]>(
      `/community/prompts/${promptId}/responses`
    );
  }
}

export const communityAPI = new CommunityAPI();
