export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  theme?: 'light' | 'dark' | 'auto';
  privacyLevel?: 'private' | 'friends' | 'public';
}

export interface UserStats {
  journalEntries: number;
  exercisesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  communityPosts: number;
}
