import type { User } from '@/types';

export const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  preferences: {
    notificationsEnabled: true,
    theme: 'auto',
    privacyLevel: 'private',
  },
  stats: {
    journalEntries: 10,
    exercisesCompleted: 5,
    currentStreak: 3,
    longestStreak: 7,
    communityPosts: 2,
  },
};

export const mockNewUser: User = {
  id: 'user-456',
  email: 'newuser@example.com',
  displayName: 'New User',
  createdAt: new Date().toISOString(),
  preferences: {
    notificationsEnabled: true,
  },
  stats: {
    journalEntries: 0,
    exercisesCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    communityPosts: 0,
  },
};
