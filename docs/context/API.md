# API Integration - Shadow AI

## Overview

This document details how Shadow AI integrates with external APIs, primarily OpenAI for the chat functionality, and the backend services for data persistence and community features.

## OpenAI Integration

### Configuration

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

**Models to Consider:**
- `gpt-4-turbo-preview` - Best reasoning, most expensive
- `gpt-4o` - Balanced performance and cost
- `gpt-3.5-turbo` - Fastest, cheapest (for simple tasks)

### API Service Architecture

```typescript
// src/services/ai/AIService.ts

import OpenAI from 'openai';
import { BehaviorManager } from './behaviorManager';
import { ContextBuilder } from './contextBuilder';

export class AIService {
  private openai: OpenAI;
  private behaviorManager: BehaviorManager;
  private contextBuilder: ContextBuilder;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.behaviorManager = new BehaviorManager();
    this.contextBuilder = new ContextBuilder();
  }

  async sendMessage(
    message: string,
    userId: string
  ): Promise<AIResponse> {
    try {
      // Get current behavior
      const behavior = this.behaviorManager.getCurrentBehavior();

      // Build context for this behavior
      const context = await this.contextBuilder.build(
        userId,
        behavior,
        this.conversationHistory
      );

      // Prepare messages array
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: behavior.systemPrompt },
        { role: 'system', content: context },
        ...this.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
      });

      const responseContent = completion.choices[0].message.content || '';

      // Update conversation history
      this.addToHistory({ role: 'user', content: message });
      this.addToHistory({ role: 'assistant', content: responseContent });

      // Check if we should transition to different behavior
      const shouldTransition = behavior.shouldExit(message, {
        response: responseContent,
        history: this.conversationHistory
      });

      if (shouldTransition) {
        const nextBehavior = behavior.suggestTransition({
          lastMessage: message,
          response: responseContent
        });
        if (nextBehavior) {
          await this.switchBehavior(nextBehavior);
        }
      }

      return {
        content: responseContent,
        role: 'assistant',
        behaviorId: behavior.id,
        timestamp: new Date(),
        metadata: {
          tokens: completion.usage?.total_tokens,
          model: completion.model
        }
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async switchBehavior(behaviorId: string, context?: any): Promise<void> {
    const newBehavior = this.behaviorManager.getBehavior(behaviorId);

    // Summarize current conversation if switching
    if (this.conversationHistory.length > 0) {
      const summary = await this.summarizeConversation();
      this.conversationHistory = [
        { role: 'system', content: `Previous context: ${summary}` }
      ];
    }

    this.behaviorManager.setCurrentBehavior(behaviorId);
  }

  private addToHistory(message: ChatMessage): void {
    this.conversationHistory.push(message);

    // Keep history manageable (last 20 messages)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  private async summarizeConversation(): Promise<string> {
    // Use OpenAI to summarize long conversations
    const messages = this.conversationHistory
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation in 2-3 sentences, focusing on key topics and emotional themes.'
        },
        { role: 'user', content: messages }
      ],
      max_tokens: 150,
    });

    return completion.choices[0].message.content || '';
  }
}
```

### Context Builder

```typescript
// src/services/ai/contextBuilder.ts

export class ContextBuilder {
  constructor(private storageService: StorageService) {}

  async build(
    userId: string,
    behavior: Behavior,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    // Get behavior-specific context
    const behaviorContext = await behavior.buildContext({
      userId,
      storage: this.storageService
    });

    // Add temporal context
    const timeContext = this.buildTimeContext();

    // Add recent history summary if relevant
    const historyContext = this.buildHistoryContext(conversationHistory);

    return `
${timeContext}

${behaviorContext}

${historyContext}
    `.trim();
  }

  private buildTimeContext(): string {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = this.getTimeOfDay(now.getHours());

    return `Current time: ${dayOfWeek}, ${timeOfDay}`;
  }

  private getTimeOfDay(hour: number): string {
    if (hour < 6) return 'late night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private buildHistoryContext(history: ChatMessage[]): string {
    if (history.length === 0) return '';

    const recentMessages = history.slice(-5);
    const summary = recentMessages
      .map(m => `${m.role}: ${m.content.slice(0, 100)}`)
      .join('\n');

    return `Recent conversation:\n${summary}`;
  }
}
```

### Streaming Responses (Optional Enhancement)

For better UX, implement streaming responses:

```typescript
async sendMessageStream(
  message: string,
  userId: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const behavior = this.behaviorManager.getCurrentBehavior();
  const context = await this.contextBuilder.build(userId, behavior, this.conversationHistory);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: behavior.systemPrompt },
    { role: 'system', content: context },
    ...this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  const stream = await this.openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullResponse += content;
    onChunk(content);
  }

  this.addToHistory({ role: 'user', content: message });
  this.addToHistory({ role: 'assistant', content: fullResponse });
}
```

## Cost Management

### Token Tracking

```typescript
interface TokenUsage {
  userId: string;
  date: Date;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

class CostTracker {
  private readonly COST_PER_1K_PROMPT = 0.01;   // $0.01 per 1K tokens
  private readonly COST_PER_1K_COMPLETION = 0.03; // $0.03 per 1K tokens

  calculateCost(usage: OpenAI.CompletionUsage): number {
    const promptCost = (usage.prompt_tokens / 1000) * this.COST_PER_1K_PROMPT;
    const completionCost = (usage.completion_tokens / 1000) * this.COST_PER_1K_COMPLETION;
    return promptCost + completionCost;
  }

  async trackUsage(userId: string, usage: OpenAI.CompletionUsage): Promise<void> {
    const cost = this.calculateCost(usage);
    await this.storageService.saveTokenUsage({
      userId,
      date: new Date(),
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost
    });
  }

  async getUserMonthlyCost(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.storageService.getTokenUsage(userId, startOfMonth);
    return usage.reduce((sum, u) => sum + u.cost, 0);
  }
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private readonly MAX_REQUESTS_PER_MINUTE = 10;
  private readonly MAX_REQUESTS_PER_HOUR = 50;

  private userRequestCounts = new Map<string, number[]>();

  async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const timestamps = this.userRequestCounts.get(userId) || [];

    // Remove timestamps older than 1 hour
    const recentTimestamps = timestamps.filter(t => now - t < 3600000);

    // Check hourly limit
    if (recentTimestamps.length >= this.MAX_REQUESTS_PER_HOUR) {
      throw new Error('Hourly request limit exceeded');
    }

    // Check per-minute limit
    const lastMinute = recentTimestamps.filter(t => now - t < 60000);
    if (lastMinute.length >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded. Please wait a moment.');
    }

    recentTimestamps.push(now);
    this.userRequestCounts.set(userId, recentTimestamps);

    return true;
  }
}
```

## Backend API (Firebase)

### Authentication

```typescript
// src/services/auth/AuthService.ts

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

export class AuthService {
  private auth = getAuth();

  async signUp(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    // Create user profile in Firestore
    await this.createUserProfile(credential.user.uid, email);

    return this.mapFirebaseUser(credential.user);
  }

  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    return this.mapFirebaseUser(credential.user);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  onAuthStateChanged(callback: (user: User | null) => void): void {
    this.auth.onAuthStateChanged((firebaseUser) => {
      callback(firebaseUser ? this.mapFirebaseUser(firebaseUser) : null);
    });
  }

  private async createUserProfile(userId: string, email: string): Promise<void> {
    const db = getFirestore();
    await setDoc(doc(db, 'users', userId), {
      email,
      createdAt: new Date(),
      preferences: {},
      stats: {
        journalEntries: 0,
        exercisesCompleted: 0
      }
    });
  }
}
```

### Data Storage

```typescript
// src/services/storage/StorageService.ts

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

export class StorageService {
  private db = getFirestore();

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    await addDoc(collection(this.db, 'journalEntries'), {
      ...entry,
      createdAt: new Date()
    });
  }

  async getJournalEntries(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<JournalEntry[]> {
    let q = query(
      collection(this.db, 'journalEntries'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (dateRange) {
      q = query(q,
        where('createdAt', '>=', dateRange.start),
        where('createdAt', '<=', dateRange.end)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));
  }

  async saveChatMessage(message: ChatMessage): Promise<void> {
    await addDoc(collection(this.db, 'chatMessages'), {
      ...message,
      timestamp: new Date()
    });
  }

  async getChatHistory(userId: string, limit = 50): Promise<ChatMessage[]> {
    const q = query(
      collection(this.db, 'chatMessages'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));
  }
}
```

## Error Handling

### AI Service Errors

```typescript
class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// In AIService
async sendMessage(message: string, userId: string): Promise<AIResponse> {
  try {
    // ... existing code
  } catch (error) {
    if (error.status === 429) {
      throw new AIServiceError(
        'Too many requests. Please try again in a moment.',
        'RATE_LIMIT',
        true
      );
    }

    if (error.status === 500) {
      throw new AIServiceError(
        'OpenAI service temporarily unavailable.',
        'SERVICE_ERROR',
        true
      );
    }

    throw new AIServiceError(
      'Failed to process your message.',
      'UNKNOWN_ERROR',
      false
    );
  }
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error instanceof AIServiceError && !error.retryable) {
        throw error;
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}

// Usage
const response = await withRetry(() =>
  aiService.sendMessage(message, userId)
);
```

## Testing API Integration

See [TESTING.md](./TESTING.md) for detailed testing strategies.

```typescript
// __tests__/services/AIService.test.ts

describe('AIService with OpenAI', () => {
  it('should handle API errors gracefully', async () => {
    // Mock OpenAI to throw error
    mockOpenAI.chat.completions.create.mockRejectedValue(
      new Error('Rate limit exceeded')
    );

    await expect(
      aiService.sendMessage('Hello', 'user123')
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

## Security Best Practices

1. **Never expose API keys in client code**
   - Store in environment variables
   - Access through secure backend proxy if needed

2. **Sanitize user input**
   - Validate message length
   - Filter inappropriate content
   - Prevent prompt injection

3. **Implement authentication**
   - Verify user identity for all requests
   - Use Firebase Auth tokens

4. **Monitor usage**
   - Track API costs per user
   - Alert on unusual patterns
   - Implement spending limits

## Future Enhancements

- Function calling for structured data extraction
- Fine-tuned models for specific behaviors
- Embeddings for semantic search in journal entries
- Image analysis (if adding photo journals)
