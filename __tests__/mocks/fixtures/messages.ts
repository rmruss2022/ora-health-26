import type { ChatMessage } from '@/types';

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    userId: 'user-123',
    role: 'user',
    content: 'I want to journal about my day',
    behaviorId: 'free-form-chat',
    timestamp: '2024-01-01T10:00:00Z',
  },
  {
    id: 'msg-2',
    userId: 'user-123',
    role: 'assistant',
    content: "That's great! What would you like to write about?",
    behaviorId: 'journal-prompt',
    timestamp: '2024-01-01T10:00:05Z',
    metadata: {
      tokens: 150,
      model: 'gpt-4-turbo-preview',
    },
  },
  {
    id: 'msg-3',
    userId: 'user-123',
    role: 'user',
    content: 'Today was productive and I accomplished my goals',
    behaviorId: 'journal-prompt',
    timestamp: '2024-01-01T10:01:00Z',
  },
];
