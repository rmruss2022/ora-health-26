# Agentic Architecture - Shadow AI

## Overview

This document describes the technical architecture for implementing dynamic, autonomous behavior switching in Shadow AI. The system is inspired by advanced agentic AI frameworks that use conversational triggers and multi-vector analysis to adapt AI behavior in real-time.

## Core Concept

Shadow AI is NOT a traditional chatbot with fixed modes. It's an **agentic system** where:
- AI autonomously detects when to shift operational parameters
- Behaviors are runtime modifiers, not separate chat sessions
- Transitions are fluid and context-aware
- No manual mode switching required from users

## Architecture Components

### 1. Conversational Trigger Detection

**Purpose:** Detect when a behavior should activate based on conversation patterns

**Implementation Approach:**

```typescript
interface TriggerDetector {
  analyzeMessage(
    userMessage: string,
    agentResponse: string,
    conversationHistory: Message[],
    userContext: UserContext
  ): BehaviorScore[];
}

interface BehaviorScore {
  behaviorId: string;
  confidence: number; // 0.0 - 1.0
  triggerReason: string;
  vectors: {
    userMessageSimilarity: number;
    sentimentMatch: number;
    keywordMatch: number;
    contextualFit: number;
    toolUsagePattern: number;
    externalSignals: number;
  };
}
```

**Multi-Vector Analysis:**

1. **Embedding-Based Detection**
   - Generate embeddings for user message
   - Compare against behavior trigger embeddings
   - Use cosine similarity for matching

2. **Sentiment Analysis**
   - Detect emotional tone (distress, contemplation, motivation)
   - Map sentiment patterns to appropriate behaviors

3. **Keyword Pattern Matching**
   - Look for explicit behavior indicators
   - Consider context around keywords

4. **Conversation Flow Analysis**
   - Analyze message length, complexity
   - Detect shifts in topic or tone
   - Track question vs statement patterns

5. **Historical Context**
   - What behaviors has user engaged with before?
   - What time of day is it?
   - How long since last interaction?

6. **Tool Usage Signals**
   - Is user accessing journal history? → Analysis behavior
   - Creating new entry? → Journaling behavior
   - Setting reminders? → Planning behavior

### 2. Behavior Selection Engine

**Purpose:** Choose the most appropriate behavior given multiple candidates

**Selection Algorithm:**

```typescript
interface BehaviorSelector {
  selectBehavior(
    candidates: BehaviorScore[],
    currentBehavior: Behavior | null,
    conversationContext: ConversationContext
  ): SelectedBehavior;
}

interface SelectedBehavior {
  behavior: Behavior;
  confidence: number;
  transitionType: 'new' | 'persist' | 'blend';
  metadata: {
    previousBehavior?: string;
    reasonForSwitch: string;
    alternativeCandidates: BehaviorScore[];
  };
}
```

**Selection Logic:**

1. **Persistence Bias**
   - Current behavior gets +0.2 boost to confidence
   - Prevents frequent switching on minor signals
   - Maintains conversation coherence

2. **Top-K Candidate Ranking**
   - Take top 3 candidates by confidence
   - Use LLM to make final contextual decision
   - Consider conversation history

3. **Threshold-Based Activation**
   - Confidence > 0.7: Strong activation
   - 0.4 - 0.7: Consider if current is weak
   - < 0.4: Maintain current behavior

4. **Decay Calculation**
   ```typescript
   function calculateDecay(
     behavior: Behavior,
     messagesSinceTrigger: number
   ): number {
     const decayRate = 0.1; // 10% per message
     return Math.max(0, behavior.confidence - (messagesSinceTrigger * decayRate));
   }
   ```

### 3. Behavior State Management

**Purpose:** Track active behaviors and manage transitions

```typescript
interface BehaviorState {
  currentBehavior: Behavior | null;
  activationStrength: number; // 0.0 - 1.0
  messagesSinceActivation: number;
  activationTimestamp: Date;
  triggerContext: {
    userMessage: string;
    detectionReason: string;
  };
}

interface BehaviorHistory {
  userId: string;
  transitions: BehaviorTransition[];
  engagementStats: {
    [behaviorId: string]: {
      totalActivations: number;
      avgDuration: number;
      userSatisfaction: number;
    };
  };
}
```

### 4. System Prompt Injection

**Purpose:** Modify Claude's system prompt based on active behavior

**Implementation:**

```typescript
function buildSystemPrompt(
  behavior: Behavior,
  userContext: UserContext
): string {
  const basePrompt = behavior.systemPrompt;
  const contextualModifiers = buildContextModifiers(userContext);
  const constraintInjections = buildConstraints(behavior);

  return `${basePrompt}

ACTIVE BEHAVIOR: ${behavior.name}

CONTEXT:
${contextualModifiers}

CONSTRAINTS:
${constraintInjections}

Remember: Your responses should reflect the ${behavior.name} behavior's tone,
questioning style, and priorities. Transition naturally if the user's needs shift.`;
}
```

**Contextual Modifiers:**
- User's journal history (if relevant)
- Time of day
- Previous behavior that was active
- User preferences and patterns

## Implementation Phases

### Phase 1: Foundation (Current)
✅ Basic behavior definitions with system prompts
✅ Single chat interface
✅ Claude API integration
⏳ Manual behavior selection (temporary)

### Phase 2: Trigger Detection
- Implement embedding generation for messages
- Build keyword pattern matching
- Add basic sentiment analysis
- Create behavior confidence scoring

### Phase 3: Autonomous Switching
- Build behavior selection engine
- Implement persistence and decay logic
- Add LLM-based contextual ranking
- Remove manual behavior selection

### Phase 4: Multi-Vector Enhancement
- Add tool usage pattern detection
- Implement conversation flow analysis
- Add external signal integration
- Build behavior history tracking

### Phase 5: Learning & Personalization
- Track user engagement with behaviors
- Learn personalized trigger thresholds
- Adapt behavior prompts to user style
- Implement predictive behavior suggestions

## Technical Stack for Agentic Features

### Embedding Generation
```typescript
// Option 1: Use Claude's embeddings (if available)
// Option 2: Use OpenAI's embedding API
// Option 3: Use local embedding model (Sentence Transformers)

interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  cosineSimilarity(a: number[], b: number[]): number;
}
```

### Sentiment Analysis
```typescript
// Option 1: Use Claude to analyze sentiment
// Option 2: Use specialized sentiment API
// Option 3: Local sentiment model

interface SentimentAnalyzer {
  analyze(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    emotions: string[]; // ['stress', 'contemplation', 'motivation']
    intensity: number; // 0.0 - 1.0
  }>;
}
```

### Behavior Trigger Storage
```typescript
// Store pre-computed embeddings for behavior triggers
interface BehaviorTriggerStore {
  behaviorId: string;
  triggerEmbeddings: number[][]; // Multiple trigger patterns
  keywords: string[];
  sentimentPatterns: string[];
  contextualCues: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    dayOfWeek?: string[];
    userHistoryRequired?: boolean;
  };
}
```

## Data Flow

### Message Processing Pipeline

```
User sends message
    ↓
1. Store message in history
    ↓
2. Generate message embedding
    ↓
3. Extract keywords and sentiment
    ↓
4. Analyze conversation context
    ↓
5. Calculate behavior scores (all behaviors)
    ↓
6. Apply persistence bias to current behavior
    ↓
7. Rank top candidates
    ↓
8. Use LLM for final contextual selection
    ↓
9. Update behavior state
    ↓
10. Build context-aware system prompt
    ↓
11. Call Claude API with behavior-specific prompt
    ↓
12. Return response
    ↓
13. Log behavior transition (if occurred)
```

## UI Considerations

### Behavior Indicator (Subtle)
Show users which behavior is currently active without being intrusive:

```typescript
interface BehaviorIndicator {
  position: 'header' | 'footer' | 'floating';
  style: 'minimal' | 'descriptive';
  showTransitions: boolean;
}

// Example: Small chip in header
<View style={styles.behaviorChip}>
  <Text style={styles.behaviorIcon}>{behavior.icon}</Text>
  <Text style={styles.behaviorName}>{behavior.shortName}</Text>
</View>
```

**Design Principles:**
- Should not distract from conversation
- Optional - can be hidden if user prefers
- Shows transitions briefly then fades
- Tappable to see behavior description

### Override Control
Allow users to manually trigger behaviors when needed:

```typescript
interface BehaviorOverride {
  availableBehaviors: Behavior[];
  onSelect: (behaviorId: string) => void;
}

// Hidden menu accessible via gesture or button
// User can force a behavior if AI missed the cue
```

## Monitoring & Debugging

### Behavior Analytics
Track system performance:

```typescript
interface BehaviorAnalytics {
  transitionAccuracy: number; // How often user doesn't override
  avgMessagesPerBehavior: number;
  topTransitionPaths: [string, string][]; // [fromBehavior, toBehavior]
  behaviormissRate: number; // User manually selects vs. auto-detect
}
```

### Debug Mode
For development and testing:

```typescript
interface DebugInfo {
  allCandidateScores: BehaviorScore[];
  selectedBehavior: string;
  selectionReason: string;
  triggerDetails: {
    primaryVector: string;
    secondaryVectors: string[];
    confidencbreakdown: Record<string, number>;
  };
}
```

## Security & Privacy

### Sensitive Context Handling
- Behaviors should NOT access data they don't need
- Journal history only for Analysis behavior
- Clear user consent for data access
- Option to disable specific behaviors

### Behavior Constraints
- Never suggest medical advice (guide to professionals)
- Respect user boundaries
- Detect crisis situations and provide resources
- Privacy-preserving trigger detection

## Success Metrics

### System-Level
- Behavior detection accuracy (> 85% goal)
- Average messages before correct behavior (< 3 goal)
- User override rate (< 15% goal)
- Smooth transition rate (> 90% goal)

### User-Level
- Session duration (longer when behaviors work well)
- Return rate (users come back when AI feels smart)
- Explicit feedback ("This is helpful" vs "This is off")
- Feature awareness (do users understand behaviors?)

## References

- Amigo AI Dynamic Behaviors: https://docs.amigo.ai/agent/dynamic-behavior
- Anthropic Claude API: https://docs.anthropic.com/
- Embedding-based semantic search patterns
- Conversational AI state management

## Next Steps

1. **Immediate:** Document current manual behavior system as v0.1
2. **Short-term:** Build embedding and trigger detection infrastructure
3. **Medium-term:** Implement autonomous switching with simple rules
4. **Long-term:** Add learning and personalization layer

---

**Note:** This is an aspirational architecture document. Current implementation (Feb 2026) uses manual behavior selection as a prototype for testing different behavior prompts. The agentic system will be built iteratively.
