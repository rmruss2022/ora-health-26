export interface CommunityPost {
  id: string;
  userId: string;
  author: {
    name: string;
    avatar: string;
    isAnonymous: boolean;
  };
  type: PostType;
  category: string;
  content: string;
  promptText?: string;
  tags: string[];
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  createdAt: Date | string;
}

export type PostType = 'progress' | 'prompt' | 'resource' | 'support' | 'gratitude';

export interface Comment {
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
  createdAt: Date | string;
}

export interface CommunityPrompt {
  id: string;
  question: string;
  description?: string;
  category: string;
  activeFrom: string;
  activeTo: string;
  responseCount: number;
  featured?: boolean;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  tags: string[];
  rules: string[];
  moderators: string[];
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  userId: string;
  messageType: 'prompt' | 'encouragement' | 'activity_suggestion' | 'insight' | 'community_highlight';
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  isArchived: boolean;
  readAt?: string;
  archivedAt?: string;
  timestamp: string;
  createdAt: Date | string;
}

export interface PostCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  displayOrder: number;
}
