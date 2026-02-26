import type { JournalEntry } from '@/types';

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'entry-1',
    userId: 'user-123',
    content: 'Today was a good day. I felt productive and accomplished my goals.',
    behaviorId: 'journal-prompt',
    mood: 'happy',
    tags: ['productivity', 'goals'],
    createdAt: '2024-01-01T10:00:00Z',
    isShared: false,
  },
  {
    id: 'entry-2',
    userId: 'user-123',
    content: 'Feeling anxious about the upcoming presentation at work.',
    behaviorId: 'journal-prompt',
    mood: 'anxious',
    tags: ['work', 'anxiety'],
    createdAt: '2024-01-02T14:30:00Z',
    isShared: false,
  },
  {
    id: 'entry-3',
    userId: 'user-123',
    content: 'Grateful for my supportive friends and family.',
    behaviorId: 'guided-exercise',
    mood: 'grateful',
    tags: ['gratitude', 'relationships'],
    createdAt: '2024-01-03T09:15:00Z',
    isShared: true,
  },
];
