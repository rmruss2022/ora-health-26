# Testing Strategy - Shadow AI

## Overview

Shadow AI follows Test-Driven Development (TDD) principles. Write tests first based on requirements, then implement features to pass those tests.

## TDD Workflow

### The Red-Green-Refactor Cycle

1. **Red** - Write a failing test that defines desired behavior
2. **Green** - Write minimal code to make the test pass
3. **Refactor** - Improve code quality while keeping tests green

### Before Implementation Checklist

Before writing any feature code:
- [ ] Review CLAUDE.md and related docs for requirements
- [ ] Write test cases that define success criteria
- [ ] Ensure tests fail initially (Red)
- [ ] Only then implement the feature (Green)
- [ ] Refactor with confidence (tests protect you)

## Testing Stack

### Core Libraries
```json
{
  "jest": "^29.x",
  "react-test-renderer": "^19.x",
  "@testing-library/react-native": "^12.x",
  "@testing-library/jest-native": "^5.x",
  "jest-expo": "^52.x"
}
```

### Additional Tools
- **MSW (Mock Service Worker)** - Mock API requests
- **Jest mocks** - Mock services and dependencies
- **React Native Testing Library** - Component testing
- **Detox** (optional) - E2E testing

## Test Structure

### Directory Layout
```
__tests__/
├── unit/                     # Unit tests
│   ├── services/
│   │   ├── AIService.test.ts
│   │   ├── StorageService.test.ts
│   │   └── behaviorManager.test.ts
│   ├── behaviors/
│   │   ├── journalPrompt.test.ts
│   │   ├── progressAnalysis.test.ts
│   │   └── weeklyPlanning.test.ts
│   └── utils/
│       ├── dateHelpers.test.ts
│       └── validators.test.ts
│
├── integration/              # Integration tests
│   ├── chatFlow.test.ts
│   ├── behaviorTransitions.test.ts
│   └── dataSync.test.ts
│
├── components/               # Component tests
│   ├── ChatMessage.test.tsx
│   ├── ChatInput.test.tsx
│   └── CommunityPost.test.tsx
│
├── e2e/                      # End-to-end tests (optional)
│   ├── onboarding.e2e.ts
│   ├── journaling.e2e.ts
│   └── community.e2e.ts
│
├── mocks/                    # Mock data and services
│   ├── mockAIService.ts
│   ├── mockStorage.ts
│   └── fixtures/
│       ├── users.ts
│       ├── journalEntries.ts
│       └── messages.ts
│
└── setup.ts                  # Test setup and global mocks
```

## Testing Patterns by Layer

### 1. Service Layer Tests

**AIService Example:**
```typescript
// __tests__/unit/services/AIService.test.ts

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAI: MockOpenAI;

  beforeEach(() => {
    mockOpenAI = new MockOpenAI();
    aiService = new AIService(mockOpenAI);
  });

  describe('sendMessage', () => {
    it('should send user message and return AI response', async () => {
      // Arrange
      const userId = 'user123';
      const message = 'I want to journal';
      mockOpenAI.setResponse('Great! What would you like to write about?');

      // Act
      const response = await aiService.sendMessage(message, userId);

      // Assert
      expect(response.content).toBe('Great! What would you like to write about?');
      expect(response.role).toBe('assistant');
      expect(mockOpenAI.requests).toHaveLength(1);
    });

    it('should include behavior context in request', async () => {
      // Arrange
      const userId = 'user123';
      const behaviorId = 'journal-prompt';
      await aiService.switchBehavior(behaviorId, {});

      // Act
      await aiService.sendMessage('Hello', userId);

      // Assert
      const request = mockOpenAI.requests[0];
      expect(request.messages[0].role).toBe('system');
      expect(request.messages[0].content).toContain('journal prompt');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      mockOpenAI.setError(new Error('API rate limit'));

      // Act & Assert
      await expect(
        aiService.sendMessage('Hello', 'user123')
      ).rejects.toThrow('Failed to get AI response');
    });
  });
});
```

### 2. Behavior Tests

**Journal Prompt Behavior Example:**
```typescript
// __tests__/unit/behaviors/journalPrompt.test.ts

import { JournalPromptBehavior } from '@/behaviors/journalPrompt';

describe('JournalPromptBehavior', () => {
  let behavior: JournalPromptBehavior;
  let mockUserData: UserData;

  beforeEach(() => {
    behavior = new JournalPromptBehavior();
    mockUserData = {
      userId: 'user123',
      journalEntries: [],
      preferences: {}
    };
  });

  describe('buildContext', () => {
    it('should build context for new user', async () => {
      // Act
      const context = await behavior.buildContext(mockUserData);

      // Assert
      expect(context).toContain('This is a new user');
      expect(context).toContain('no previous entries');
    });

    it('should include recent journal themes in context', async () => {
      // Arrange
      mockUserData.journalEntries = [
        { content: 'I feel anxious about work', date: '2024-01-01' },
        { content: 'Work stress continues', date: '2024-01-02' }
      ];

      // Act
      const context = await behavior.buildContext(mockUserData);

      // Assert
      expect(context).toContain('recent themes');
      expect(context).toContain('work');
      expect(context).toContain('anxious');
    });
  });

  describe('shouldExit', () => {
    it('should exit when user completes journal entry', () => {
      // Arrange
      const message = "That's all for now, thanks";
      const context = { entrySaved: true };

      // Act
      const shouldExit = behavior.shouldExit(message, context);

      // Assert
      expect(shouldExit).toBe(true);
    });

    it('should not exit during active journaling', () => {
      // Arrange
      const message = "I also want to write about...";
      const context = { entrySaved: false };

      // Act
      const shouldExit = behavior.shouldExit(message, context);

      // Assert
      expect(shouldExit).toBe(false);
    });
  });

  describe('suggestTransition', () => {
    it('should suggest progress analysis after 5 entries', () => {
      // Arrange
      const context = { entryCount: 5, daysSinceAnalysis: 7 };

      // Act
      const suggestion = behavior.suggestTransition(context);

      // Assert
      expect(suggestion).toBe('progress-analysis');
    });

    it('should return null when no transition needed', () => {
      // Arrange
      const context = { entryCount: 2, daysSinceAnalysis: 1 };

      // Act
      const suggestion = behavior.suggestTransition(context);

      // Assert
      expect(suggestion).toBeNull();
    });
  });
});
```

### 3. Component Tests

**ChatMessage Component Example:**
```typescript
// __tests__/components/ChatMessage.test.tsx

import { render, screen } from '@testing-library/react-native';
import { ChatMessage } from '@/components/chat/ChatMessage';

describe('ChatMessage', () => {
  it('should render user message with correct styling', () => {
    // Arrange
    const message = {
      id: '1',
      role: 'user' as const,
      content: 'Hello AI',
      timestamp: new Date()
    };

    // Act
    render(<ChatMessage message={message} />);

    // Assert
    expect(screen.getByText('Hello AI')).toBeTruthy();
    const messageContainer = screen.getByTestId('user-message');
    expect(messageContainer).toHaveStyle({ alignSelf: 'flex-end' });
  });

  it('should render assistant message with correct styling', () => {
    // Arrange
    const message = {
      id: '2',
      role: 'assistant' as const,
      content: 'Hello! How can I help?',
      timestamp: new Date()
    };

    // Act
    render(<ChatMessage message={message} />);

    // Assert
    expect(screen.getByText('Hello! How can I help?')).toBeTruthy();
    const messageContainer = screen.getByTestId('assistant-message');
    expect(messageContainer).toHaveStyle({ alignSelf: 'flex-start' });
  });

  it('should format timestamp correctly', () => {
    // Arrange
    const timestamp = new Date('2024-01-15T10:30:00');
    const message = {
      id: '3',
      role: 'user' as const,
      content: 'Test',
      timestamp
    };

    // Act
    render(<ChatMessage message={message} />);

    // Assert
    expect(screen.getByText('10:30 AM')).toBeTruthy();
  });
});
```

### 4. Integration Tests

**Behavior Transition Integration Test:**
```typescript
// __tests__/integration/behaviorTransitions.test.ts

describe('Behavior Transitions', () => {
  let aiService: AIService;
  let behaviorManager: BehaviorManager;
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new MockStorageService();
    behaviorManager = new BehaviorManager();
    aiService = new AIService(mockOpenAI, behaviorManager, storageService);
  });

  it('should transition from chat to journal prompt when user wants to journal', async () => {
    // Arrange
    const userId = 'user123';
    await aiService.switchBehavior('free-form-chat', {});

    // Act
    const response = await aiService.sendMessage(
      'I want to journal about my day',
      userId
    );

    // Assert
    expect(behaviorManager.getCurrentBehavior().id).toBe('journal-prompt');
    expect(response.content).toContain('What would you like to write about');
  });

  it('should maintain context across behavior transitions', async () => {
    // Arrange
    const userId = 'user123';
    await aiService.sendMessage('I feel stressed about work', userId);

    // Act - Transition to journal prompt
    await aiService.sendMessage('I want to journal about it', userId);

    // Assert - Should reference previous context
    const messages = aiService.getConversationHistory();
    const contextMessage = messages.find(m => m.role === 'system');
    expect(contextMessage?.content).toContain('stressed about work');
  });
});
```

### 5. Hook Tests

**useChat Hook Example:**
```typescript
// __tests__/hooks/useChat.test.ts

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChat } from '@/hooks/useChat';

describe('useChat', () => {
  it('should send message and update state', async () => {
    // Arrange
    const { result } = renderHook(() => useChat());

    // Act
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    // Assert
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2); // User + AI
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[1].role).toBe('assistant');
    });
  });

  it('should handle loading state', async () => {
    // Arrange
    const { result } = renderHook(() => useChat());

    // Act & Assert
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

## Mock Patterns

### Mock AIService
```typescript
// __tests__/mocks/mockAIService.ts

export class MockAIService implements IAIService {
  private responses: string[] = [];
  private currentBehavior: Behavior = defaultBehavior;

  setResponse(response: string) {
    this.responses.push(response);
  }

  async sendMessage(message: string, userId: string): Promise<AIResponse> {
    const response = this.responses.shift() || 'Mock response';
    return {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };
  }

  switchBehavior(behaviorId: string, context: any): void {
    this.currentBehavior = getBehaviorById(behaviorId);
  }

  getCurrentBehavior(): Behavior {
    return this.currentBehavior;
  }
}
```

### Mock Storage
```typescript
// __tests__/mocks/mockStorage.ts

export class MockStorageService implements IStorageService {
  private store: Map<string, any> = new Map();

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    this.store.set(entry.id, entry);
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    return Array.from(this.store.values());
  }

  // ... other methods
}
```

## Test Coverage Goals

### Minimum Coverage Targets
- **Overall**: 80%
- **Services**: 90%
- **Behaviors**: 95%
- **Utils**: 90%
- **Components**: 75%
- **Hooks**: 85%

### Critical Paths (100% Coverage)
- AI behavior selection logic
- Data persistence
- Authentication flow
- Payment processing (if applicable)

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test AIService.test.ts

# Run integration tests only
npm test -- --testPathPattern=integration

# Update snapshots
npm test -- -u
```

### CI/CD Integration
- Tests run on every commit
- PR requires passing tests
- Coverage reports on PRs
- Block merge if coverage drops

## Testing Best Practices

### Do's
- ✅ Write tests before implementation (TDD)
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests isolated and independent
- ✅ Mock external dependencies
- ✅ Test edge cases and error conditions
- ✅ Use fixtures for complex test data

### Don'ts
- ❌ Test implementation details
- ❌ Write tests after feature is "done"
- ❌ Skip tests for "simple" code
- ❌ Use real API calls in tests
- ❌ Share state between tests
- ❌ Write massive test files
- ❌ Ignore failing tests

## Behavior-Specific Test Checklist

For each new behavior, ensure tests cover:
- [ ] System prompt construction
- [ ] Context building with various user states
- [ ] Exit condition detection
- [ ] Transition suggestions
- [ ] Error handling
- [ ] Input validation (if applicable)
- [ ] Integration with AIService
- [ ] OpenAI API interaction (mocked)

## Example TDD Session

### Feature: Weekly Planning Behavior

**Step 1: Write failing test**
```typescript
it('should generate weekly plan based on previous week', async () => {
  const behavior = new WeeklyPlanningBehavior();
  const context = await behavior.buildContext(mockUserWithHistory);
  expect(context).toContain('Last week you focused on');
});
```

**Step 2: Run test (should fail)**
```bash
npm test weeklyPlanning.test.ts
# FAIL: buildContext is not implemented
```

**Step 3: Implement minimal code**
```typescript
async buildContext(userData: UserData): Promise<string> {
  const lastWeekEntries = getEntriesFromLastWeek(userData);
  return `Last week you focused on ${extractThemes(lastWeekEntries)}`;
}
```

**Step 4: Run test (should pass)**
```bash
npm test weeklyPlanning.test.ts
# PASS
```

**Step 5: Refactor**
```typescript
async buildContext(userData: UserData): Promise<string> {
  const lastWeekEntries = this.getLastWeekEntries(userData);
  const themes = this.extractThemes(lastWeekEntries);
  return this.formatContextString(themes);
}
```

**Step 6: Verify tests still pass**
```bash
npm test weeklyPlanning.test.ts
# PASS (all green)
```

## Resources

- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TDD Principles](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
