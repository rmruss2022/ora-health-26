export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  behaviorId: string;
  timestamp: string;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  tokens?: number;
  cost?: number;
  model?: string;
  [key: string]: any;
}

export interface AIResponse {
  content: string;
  role: 'assistant';
  behaviorId: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}
