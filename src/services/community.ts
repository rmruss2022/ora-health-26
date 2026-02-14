import { api } from './api';

export interface CommunityPost {
  id: string;
  userId: string;
  author: {
    name: string;
    avatar: string;
    isAnonymous: boolean;
  };
  type: 'progress' | 'prompt' | 'resource' | 'support' | 'gratitude';
  content: string;
  promptText?: string;
  tags: string[];
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  createdAt: string;
}

export interface PostComment {
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
}

export interface CreatePostData {
  type: string;
  content: string;
  promptText?: string;
  tags?: string[];
  isAnonymous?: boolean;
  authorName?: string;
  authorAvatar?: string;
}

export const communityApi = {
  // Get community posts
  async getPosts(userId: string = 'default-user', limit: number = 20, offset: number = 0): Promise<CommunityPost[]> {
    const response = await api.get('/community/posts', {
      params: { userId, limit, offset },
    });
    return response.data.posts;
  },

  // Create a new post
  async createPost(data: CreatePostData, userId: string = 'default-user'): Promise<CommunityPost> {
    const response = await api.post('/community/posts', {
      ...data,
      userId,
    });
    return response.data.post;
  },

  // Like or unlike a post
  async likePost(postId: string, userId: string = 'default-user'): Promise<{ liked: boolean; likesCount: number }> {
    const response = await api.post(`/community/posts/${postId}/like`, { userId });
    return response.data;
  },

  // Get comments for a post
  async getComments(postId: string, limit: number = 50): Promise<PostComment[]> {
    const response = await api.get(`/community/posts/${postId}/comments`, {
      params: { limit },
    });
    return response.data.comments;
  },

  // Add a comment to a post
  async addComment(
    postId: string,
    content: string,
    userId: string = 'default-user',
    isAnonymous: boolean = false,
    authorName: string = 'User',
    authorAvatar: string = '👤'
  ): Promise<PostComment> {
    const response = await api.post(`/community/posts/${postId}/comments`, {
      userId,
      content,
      isAnonymous,
      authorName,
      authorAvatar,
    });
    return response.data.comment;
  },
};
