# Architecture - Shadow AI

## System Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              UI Layer (Components)                 │  │
│  │  - ChatScreen                                      │  │
│  │  - CommunityScreen                                 │  │
│  │  - ProfileScreen                                   │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │         State Management (Context/Redux)          │  │
│  │  - User state                                      │  │
│  │  - Chat state                                      │  │
│  │  - Behavior state                                  │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │              Service Layer                         │  │
│  │  - AIService (OpenAI)                             │  │
│  │  - StorageService                                  │  │
│  │  - AuthService                                     │  │
│  │  - CommunityService                                │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
└───────────────────────┼──────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼─────┐   ┌────▼─────┐
   │ OpenAI  │    │ Firebase │   │  Local   │
   │   API   │    │ Backend  │   │ Storage  │
   └─────────┘    └──────────┘   └──────────┘
```

## Application Structure

### Folder Organization
```
shadow-ai/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── chat/
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatBubble.tsx
│   │   ├── community/
│   │   │   ├── PostCard.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   └── PromptResponse.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── screens/              # Screen components
│   │   ├── ChatScreen.tsx
│   │   ├── CommunityScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── OnboardingScreen.tsx
│   │
│   ├── services/             # External service integrations
│   │   ├── ai/
│   │   │   ├── AIService.ts
│   │   │   ├── behaviorManager.ts
│   │   │   └── promptBuilder.ts
│   │   ├── storage/
│   │   │   ├── StorageService.ts
│   │   │   └── localStorage.ts
│   │   ├── auth/
│   │   │   └── AuthService.ts
│   │   └── community/
│   │       └── CommunityService.ts
│   │
│   ├── behaviors/            # Behavior definitions
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── journalPrompt.ts
│   │   ├── freeFormChat.ts
│   │   ├── progressAnalysis.ts
│   │   ├── weeklyPlanning.ts
│   │   └── guidedExercise.ts
│   │
│   ├── context/              # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ChatContext.tsx
│   │   └── BehaviorContext.tsx
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAI.ts
│   │   ├── useChat.ts
│   │   ├── useBehavior.ts
│   │   └── useStorage.ts
│   │
│   ├── types/                # TypeScript type definitions
│   │   ├── chat.ts
│   │   ├── behavior.ts
│   │   ├── user.ts
│   │   └── community.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── dateHelpers.ts
│   │   ├── textFormatting.ts
│   │   └── validators.ts
│   │
│   └── config/               # Configuration
│       ├── api.ts
│       └── constants.ts
│
├── __tests__/                # Test files (mirrors src/)
│   ├── services/
│   ├── behaviors/
│   ├── components/
│   └── hooks/
│
├── assets/                   # Images, fonts, etc.
├── docs/                     # Additional documentation
│   └── context/              # Context files for development
│       ├── CLAUDE.md
│       ├── BEHAVIORS.md
│       ├── ARCHITECTURE.md
│       ├── TESTING.md
│       └── COMMUNITY.md
│
├── App.tsx                   # Root component
├── package.json
└── tsconfig.json
```

## Core Systems

### 1. AI Service Layer

**Purpose:** Manage all interactions with OpenAI API

**Key Components:**
- `AIService.ts` - Main service class
- `behaviorManager.ts` - Handles behavior state and transitions
- `promptBuilder.ts` - Constructs prompts with context

**Responsibilities:**
- Send messages to OpenAI
- Manage conversation history
- Build context-aware prompts
- Handle behavior switching
- Stream responses (optional)

**Interface:**
```typescript
interface IAIService {
  sendMessage(message: string, userId: string): Promise<AIResponse>;
  switchBehavior(behaviorId: string, context: any): void;
  getCurrentBehavior(): Behavior;
  buildContext(userId: string): Promise<string>;
  getConversationHistory(limit?: number): Message[];
}
```

### 2. Behavior System

**Purpose:** Define and manage AI behavior states

**Key Components:**
- Behavior definitions (one file per behavior)
- Behavior manager for transitions
- Context builder for each behavior

**Behavior Structure:**
```typescript
interface Behavior {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;

  // Build context specific to this behavior
  buildContext(userData: UserData): Promise<string>;

  // Determine if we should exit this behavior
  shouldExit(message: string, context: any): boolean;

  // Suggest next behavior if exiting
  suggestTransition(context: any): string | null;

  // Validate user input for this behavior
  validateInput?(input: string): boolean;
}
```

**State Management:**
- Current behavior stored in app state
- Behavior history tracked for analytics
- Smooth transitions with context preservation

### 3. Storage Layer

**Purpose:** Persist user data locally and to cloud

**Storage Types:**
1. **Local Storage** (AsyncStorage/SQLite)
   - Cached messages
   - Draft entries
   - User preferences
   - Offline data

2. **Cloud Storage** (Firebase/Similar)
   - Journal entries
   - User profile
   - Community posts
   - Sync state

**Interface:**
```typescript
interface IStorageService {
  // Journal entries
  saveJournalEntry(entry: JournalEntry): Promise<void>;
  getJournalEntries(dateRange?: DateRange): Promise<JournalEntry[]>;

  // User data
  saveUserProfile(profile: UserProfile): Promise<void>;
  getUserProfile(): Promise<UserProfile>;

  // Chat history
  saveChatMessage(message: ChatMessage): Promise<void>;
  getChatHistory(limit?: number): Promise<ChatMessage[]>;

  // Sync
  syncToCloud(): Promise<void>;
  syncFromCloud(): Promise<void>;
}
```

### 4. State Management

**Approach:** React Context API (can migrate to Redux if needed)

**Contexts:**
1. **AuthContext** - User authentication state
2. **ChatContext** - Chat messages and state
3. **BehaviorContext** - Current behavior and history
4. **UserContext** - User profile and preferences
5. **CommunityContext** - Community feed and interactions

### 5. Navigation

**Library:** React Navigation (v6+)

**Structure:**
```typescript
- Tab Navigator (Main)
  ├── Chat Stack
  │   ├── Chat Screen
  │   └── Journal History
  ├── Community Stack
  │   ├── Feed
  │   ├── Post Detail
  │   └── Group Detail
  └── Profile Stack
      ├── Profile
      ├── Settings
      └── Progress Dashboard
```

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
}
```

### Journal Entry
```typescript
interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  behaviorId: string;
  mood?: string;
  tags?: string[];
  createdAt: Date;
  isShared: boolean;
  metadata?: Record<string, any>;
}
```

### Chat Message
```typescript
interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  behaviorId: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    cost?: number;
    [key: string]: any;
  };
}
```

### Community Post
```typescript
interface CommunityPost {
  id: string;
  userId: string;
  content: string;
  promptId?: string; // If responding to group prompt
  likes: number;
  comments: Comment[];
  createdAt: Date;
  tags?: string[];
}
```

## API Integration

### OpenAI API

**Configuration:**
```typescript
const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview', // or 'gpt-4o'
  temperature: 0.7,
  maxTokens: 1000,
};
```

**Usage Pattern:**
```typescript
const response = await openai.chat.completions.create({
  model: config.model,
  messages: [
    { role: 'system', content: behavior.systemPrompt },
    { role: 'system', content: contextString },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ],
  temperature: config.temperature,
  max_tokens: config.maxTokens,
});
```

**Cost Management:**
- Track token usage per request
- Set monthly budget limits
- Implement request throttling
- Cache common responses

### Firebase (Recommended Backend)

**Services Used:**
- **Authentication** - Email/password, social login
- **Firestore** - User data, journal entries, community posts
- **Storage** - User avatars, meditation audio files
- **Cloud Functions** - Background processing, moderation
- **Analytics** - Usage tracking

**Alternative:** Supabase (open source alternative)

## Security Considerations

1. **API Key Protection**
   - Never expose keys in client code
   - Use environment variables
   - Proxy requests through backend if needed

2. **User Data Privacy**
   - Encrypt sensitive data
   - Journal entries are private by default
   - Clear privacy controls for community sharing

3. **Content Moderation**
   - Community posts moderated
   - Report/flag system
   - AI safety guardrails

4. **Authentication**
   - Secure token storage
   - Session management
   - Logout on sensitive screens

## Performance Optimization

1. **Chat Response Time**
   - Implement streaming for long responses
   - Show typing indicators
   - Cache recent messages

2. **Offline Support**
   - Local storage for drafts
   - Queue operations when offline
   - Sync when connection restored

3. **Image/Asset Loading**
   - Lazy load community images
   - Compress uploads
   - CDN for static assets

4. **Database Queries**
   - Pagination for long lists
   - Index common queries
   - Limit data fetched per request

## Deployment Strategy

### Development
- Local development with Expo Go
- Test data in development Firebase project
- Mock OpenAI responses for testing

### Staging
- TestFlight (iOS) / Internal testing (Android)
- Staging Firebase environment
- Limited OpenAI usage

### Production
- App Store & Google Play
- Production Firebase
- Monitoring and analytics
- Error tracking (Sentry)

## Next Steps

1. Set up Firebase project
2. Implement authentication flow
3. Build AIService with basic chat
4. Implement first behavior (Journal Prompt)
5. Add local storage for journal entries
6. Build chat UI
7. Add more behaviors iteratively

See [TESTING.md](./TESTING.md) for testing strategy during implementation.
