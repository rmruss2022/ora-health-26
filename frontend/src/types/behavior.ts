export interface Behavior {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;

  buildContext(userData: UserData): Promise<string>;
  shouldExit(message: string, context: any): boolean;
  suggestTransition(context: any): string | null;
  validateInput?(input: string): boolean;
}

export interface UserData {
  userId: string;
  journalEntries?: JournalEntry[];
  preferences?: any;
  [key: string]: any;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  behaviorId: string;
  mood?: string;
  tags?: string[];
  createdAt: string;
  isShared: boolean;
  metadata?: Record<string, any>;
}

export interface BehaviorContext {
  lastMessage?: string;
  response?: string;
  history?: any[];
  [key: string]: any;
}

export type BehaviorId =
  | 'welcome'
  | 'journal-prompt'
  | 'free-form-chat'
  | 'progress-analysis'
  | 'weekly-planning'
  | 'guided-exercise'
  | 'meditation-guide'
  | 'community-prompt';
