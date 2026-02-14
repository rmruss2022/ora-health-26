# Multi-Vector Embedding Architecture for Behavior Detection

## Executive Summary

This document specifies a complete architecture for replacing the current keyword-based behavior detection system with a sophisticated multi-vector embedding approach. The system uses 6 distinct vector types to capture different aspects of conversation context, enabling intelligent behavior selection that adapts to user intent, emotional state, conversation patterns, and contextual signals.

**Key Objectives:**
- Replace brittle keyword matching with semantic understanding
- Support 13 behavior types with nuanced triggering
- Achieve <2s end-to-end latency for behavior detection
- Enable continuous learning from user interactions
- Provide explainable behavior selection

**Current System Limitations:**
- Keyword/regex matching is brittle and misses semantic intent
- Cannot handle paraphrasing or novel expressions
- No understanding of conversation context or user state
- Limited to explicit triggers defined in code

**New System Capabilities:**
- Semantic understanding of user intent
- Context-aware behavior selection
- Learns from user interactions
- Handles paraphrasing and novel expressions
- Multi-dimensional analysis (message, emotion, context, tools, etc.)

---

## System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER MESSAGE ARRIVES                         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EMBEDDING GENERATION LAYER                       │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ User Msg    │  │ Agent Resp   │  │ Combined Agent+User     │   │
│  │ Vector      │  │ Vector       │  │ Vector                  │   │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘   │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Inner       │  │ External     │  │ Tool Call               │   │
│  │ Thought Vec │  │ Events Vec   │  │ Vector                  │   │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PARALLEL VECTOR SEARCH LAYER                      │
│                                                                       │
│  Each vector type searches against stored behavior trigger           │
│  embeddings using pgvector HNSW index (cosine similarity)            │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  pgvector: SELECT ... ORDER BY embedding <=> query_vec       │  │
│  │  Returns top 5 candidates per vector type                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RANKING & FUSION LAYER                          │
│                                                                       │
│  • Aggregate scores across vector types (weighted)                   │
│  • Apply behavior priority multipliers                               │
│  • Apply persistence bonus for active behavior                       │
│  • Generate top 20 candidate behaviors with scores                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LLM SELECTION LAYER                             │
│                                                                       │
│  Prompt: "Given conversation context and these 20 candidates,        │
│  select the most appropriate behavior and explain why"               │
│                                                                       │
│  Returns: { behaviorId, confidence, reasoning }                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BEHAVIOR ACTIVATION                           │
│                                                                       │
│  • Log transition to behavior_transitions table                      │
│  • Update conversation_state with new behavior                       │
│  • Return selected behavior to chat controller                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The 6 Vector Types

### 1. User Message Vector

**Purpose:** Captures semantic meaning of user's current message

**When Generated:** On every incoming user message

**Embedding Source:** Raw user message text

**Dimensions:** 1536 (OpenAI text-embedding-3-small)

**Storage:** `conversation_embeddings` table, `vector_type = 'user_message'`

**Use Cases:**
- Primary signal for behavior detection
- Matches against behavior trigger descriptions
- Captures explicit user intent ("I want to journal", "feeling overwhelmed")

**Example Embeddings:**
- "I'm feeling really anxious about work" → High similarity to difficult-emotion-processing
- "Let's plan my week" → High similarity to weekly-planning
- "I hate myself for messing this up" → High similarity to self-compassion-exercise

---

### 2. Agent Message Vector

**Purpose:** Captures semantic meaning of AI agent's previous response

**When Generated:** After agent sends a response (async, non-blocking)

**Embedding Source:** Most recent assistant message

**Dimensions:** 1536

**Storage:** `conversation_embeddings` table, `vector_type = 'agent_message'`

**Use Cases:**
- Detect when agent initiated a specific mode (e.g., started journaling prompts)
- Maintain behavior continuity ("if I just asked a follow-up question, keep that behavior")
- Pattern recognition across sessions

**Example Embeddings:**
- "What's been on your mind today?" → Suggests journal-prompting continuation
- "That sounds really hard. You're not alone." → Suggests difficult-emotion-processing active

---

### 3. Combined Agent+User Vector

**Purpose:** Captures the semantic relationship between user input and agent response as a conversational pair

**When Generated:** After agent response is sent (combines last user msg + agent response)

**Embedding Source:** Concatenated: `"User: {user_msg}\nAssistant: {agent_response}"`

**Dimensions:** 1536

**Storage:** `conversation_embeddings` table, `vector_type = 'combined_exchange'`

**Use Cases:**
- Detect conversation patterns (e.g., back-and-forth journaling, Socratic questioning)
- Identify when user is engaged with a specific behavior mode
- Track conversation momentum and flow

**Example Embeddings:**
- "User: I'm stuck\nAssistant: What feels most stuck right now?" → Cognitive reframing pattern
- "User: I can't do anything right\nAssistant: That's really harsh. What would you tell a friend?" → Self-compassion pattern

---

### 4. Agent Inner Thought Vector

**Purpose:** Captures the AI's reasoning and internal state about the conversation

**When Generated:** When agent uses reasoning/thinking mode (future: always extract from agent's decision-making)

**Embedding Source:** Agent's internal reasoning text (e.g., "User is expressing self-criticism, likely needs self-compassion work")

**Dimensions:** 1536

**Storage:** `conversation_embeddings` table, `vector_type = 'agent_thought'`

**Use Cases:**
- Match agent's understanding of user state to behavior requirements
- Detect when agent recognizes emotional patterns
- Capture implicit signals agent notices but user doesn't state

**Example Embeddings:**
- "User seems to be catastrophizing about a work situation" → Cognitive-reframing behavior
- "User is beating themselves up over a mistake" → Self-compassion behavior
- "User mentioned childhood repeatedly" → Inner-child-work behavior

**Implementation Note:** 
Initially, this can be extracted from LLM's reasoning if available, or generated via a separate "analyze user state" call. Future: integrate with agent's natural reasoning flow.

---

### 5. External Events Vector

**Purpose:** Captures contextual information about time, user state, app events

**When Generated:** Composed dynamically on each behavior detection request

**Embedding Source:** Structured context string:
```
Time: Monday, 9:15 AM
User mood: anxious (from recent journal)
Recent journal themes: work stress, sleep issues
Days since last check-in: 3
Recent app activity: meditation 2 days ago
```

**Dimensions:** 1536

**Storage:** Not stored (ephemeral, generated fresh each time). Optionally store for analytics.

**Use Cases:**
- Time-based behavior triggers (Sunday evening → weekly-review)
- User state awareness (tired → energy-checkin, anxious → difficult-emotion-processing)
- Activity patterns (hasn't journaled in a week → prompt journaling)

**Example Embeddings:**
- "Friday evening, user feeling reflective" → Weekly-review behavior
- "Monday morning, user mentioned planning" → Weekly-planning behavior
- "Late night, user expressing anxiety" → Difficult-emotion-processing or sleep-related behavior

---

### 6. Tool Call Vector

**Purpose:** Captures the semantic meaning of tools the agent used or considered using

**When Generated:** After agent invokes tools (journal access, activities, etc.)

**Embedding Source:** List of tool calls with outcomes:
```
Tools used: get_recent_journal_entries, get_available_activities
Journal entries showed: anxiety, work stress
Activities recommended: breathwork meditation
```

**Dimensions:** 1536

**Storage:** `conversation_embeddings` table, `vector_type = 'tool_call'`

**Use Cases:**
- Detect behavior based on agent actions (if agent searched for meditations → anxiety-related behavior)
- Track tool usage patterns across behaviors
- Learn which tools correlate with which behaviors

**Example Embeddings:**
- "Searched for sleep meditations" → Sleep-related behavior
- "Retrieved journal entries about boundaries" → Boundary-setting behavior
- "Recommended gratitude reflection" → Gratitude-practice behavior

---

## Broadcast System Algorithm

### High-Level Flow

```
1. User message arrives
2. Generate embeddings for applicable vector types (1-6)
3. Search each vector type against stored behavior trigger embeddings (parallel)
4. Rank and fuse results across vector types
5. Apply behavior priority and persistence bonuses
6. Select top 20 candidates
7. Feed to LLM for final selection with reasoning
8. Activate selected behavior
```

### Detailed Algorithm

```typescript
async detectBehaviorWithVectors(
  message: string,
  userId: string,
  conversationContext: ConversationContext
): Promise<BehaviorDetectionResult> {
  
  // STEP 1: Generate Embeddings
  const embeddings = await this.generateEmbeddings({
    userMessage: message,
    agentLastResponse: conversationContext.lastAgentMessage,
    externalContext: this.buildExternalContext(userId, conversationContext),
    toolCalls: conversationContext.recentToolCalls
  });

  // STEP 2: Parallel Vector Search (across all 6 types)
  const searchResults = await Promise.all([
    this.searchUserMessageVectors(embeddings.userMessage),
    this.searchAgentMessageVectors(embeddings.agentMessage),
    this.searchCombinedVectors(embeddings.combined),
    this.searchAgentThoughtVectors(embeddings.agentThought),
    this.searchExternalEventVectors(embeddings.externalContext),
    this.searchToolCallVectors(embeddings.toolCalls)
  ]);

  // STEP 3: Aggregate and Weight Scores
  const candidateScores = this.aggregateScores(searchResults, {
    weights: {
      userMessage: 1.0,      // Primary signal
      agentMessage: 0.3,     // Context continuity
      combined: 0.5,         // Conversation flow
      agentThought: 0.7,     // Agent understanding
      externalContext: 0.4,  // Time/state signals
      toolCalls: 0.3         // Action patterns
    }
  });

  // STEP 4: Apply Behavior Priority Multipliers
  const priorityAdjusted = candidateScores.map(candidate => ({
    ...candidate,
    score: candidate.score * (candidate.behavior.priority / 10) * 1.2
  }));

  // STEP 5: Apply Persistence Bonus
  const currentBehavior = await this.getCurrentBehavior(userId);
  if (currentBehavior) {
    const persistenceCandidate = priorityAdjusted.find(
      c => c.behavior.id === currentBehavior.id
    );
    if (persistenceCandidate && persistenceCandidate.score > 0.3) {
      persistenceCandidate.score *= 1.5; // 50% bonus for active behavior
    }
  }

  // STEP 6: Rank and Select Top 20
  const topCandidates = priorityAdjusted
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // STEP 7: LLM Final Selection
  const selected = await this.llmSelectBehavior(
    message,
    conversationContext,
    topCandidates
  );

  // STEP 8: Log and Return
  await this.logBehaviorTransition(userId, selected, {
    vectorScores: topCandidates,
    method: 'multi-vector-embedding'
  });

  return selected;
}
```

### Score Aggregation

For each behavior candidate, aggregate similarity scores across vector types:

```
final_score = (
  user_msg_sim * 1.0 +
  agent_msg_sim * 0.3 +
  combined_sim * 0.5 +
  agent_thought_sim * 0.7 +
  external_sim * 0.4 +
  tool_call_sim * 0.3
) / (1.0 + 0.3 + 0.5 + 0.7 + 0.4 + 0.3)  // Normalize by total weight

final_score *= (behavior_priority / 10) * 1.2
if (is_current_behavior && final_score > 0.3):
  final_score *= 1.5  // Persistence bonus
```

### Similarity Search

For each vector type, retrieve top 5 behavior matches:

```sql
SELECT 
  behavior_id,
  vector_type,
  1 - (embedding <=> $1::vector) AS similarity
FROM behavior_trigger_embeddings
WHERE vector_type = $2
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

**Cosine Similarity:** 
- pgvector uses `<=>` operator for cosine distance
- `1 - distance` converts to similarity (0 = no match, 1 = perfect match)
- Threshold: Only consider candidates with similarity > 0.4

---

## LLM Selection Prompt

After vector search generates top 20 candidates, LLM makes final decision:

```
You are selecting the most appropriate behavior mode for a mental wellness AI.

CONVERSATION CONTEXT:
User message: "{user_message}"
Recent conversation: [{last 3 messages}]
Current behavior: {current_behavior_name}
User state: {mood from journal, time of day, recent activity}

TOP CANDIDATE BEHAVIORS (ranked by vector similarity):
1. {behavior_name} (priority: {priority}, score: {score})
   Description: {description}
   Why matched: {top matching trigger}
   
2. {behavior_name} (priority: {priority}, score: {score})
   ...
   
[Continue for top 20]

TASK:
Select the single most appropriate behavior for this moment.

DECISION CRITERIA:
- User's explicit intent (what they're asking for)
- Emotional urgency (crisis > routine)
- Conversation continuity (if mid-flow, maintain behavior unless strong signal to switch)
- User state (tired → energy check, Sunday evening → weekly review)

RESPOND WITH JSON:
{
  "selectedBehaviorId": "behavior-id",
  "confidence": 0.85,
  "reasoning": "User explicitly mentioned X, which indicates Y. Current behavior is Z, but switching because..."
}

Be decisive. Select exactly one behavior.
```

### LLM Selection Benefits:
- **Contextual reasoning**: LLM sees full conversation, not just vector scores
- **Explicit intent recognition**: Handles "Actually, I want to talk about X" gracefully
- **Edge case handling**: Ambiguous situations get human-like judgment
- **Explainability**: Returns reasoning for debugging and user transparency

---

## Behavior Persistence Logic

### Concept
Once a behavior is activated, it should persist across multiple messages unless:
1. User explicitly signals a switch ("actually, let's talk about X")
2. Conversation naturally concludes (e.g., journaling session complete)
3. Higher-priority behavior has very strong signal (e.g., sudden emotional distress)

### Implementation

**Persistence Bonus:**
- If current behavior appears in top candidates with score > 0.3, multiply score by 1.5
- This prevents "flickering" between behaviors on similar messages

**Decay:**
- After N messages in same behavior, gradually reduce persistence bonus
- Allows natural transitions when conversation shifts

**Explicit Exit Detection:**
- Phrases like "let's move on", "thanks, that's enough", "actually I wanted to" trigger immediate re-evaluation without persistence bonus

**Example:**
```
Message 1: "I've been struggling with anxiety" 
  → Activates difficult-emotion-processing

Message 2: "Tell me more about what's overwhelming"
  → Stays in difficult-emotion-processing (persistence bonus keeps it active)

Message 3: "Actually, I want to plan my week"
  → Switches to weekly-planning (explicit intent overrides persistence)
```

---

## Embedding Model Recommendation

### Primary Recommendation: OpenAI `text-embedding-3-small`

**Rationale:**
- **Cost-effective**: $0.02 per 1M tokens (vs $0.13 for ada-002)
- **Performance**: MTEB score 62.3% (excellent for this use case)
- **Dimensions**: 1536 (good balance of expressiveness and storage)
- **Speed**: ~500ms for batch of 6 embeddings
- **Proven**: Widely used, stable API

**Alternative: `text-embedding-ada-002`**
- **Dimensions**: 1536
- **Cost**: Higher ($0.10 per 1M tokens)
- **Use if**: Need maximum stability (older, more established model)

**Alternative: Open-Source (Sentence-Transformers)**
- **Model**: `all-MiniLM-L6-v2`
- **Dimensions**: 384 (smaller)
- **Cost**: Free (self-hosted)
- **Tradeoff**: Lower semantic understanding, need to self-host
- **Use if**: Budget is primary concern or data privacy requires local processing

### Recommendation Decision Matrix

| Factor | OpenAI text-embedding-3-small | OpenAI ada-002 | Open-Source |
|--------|------------------------------|----------------|-------------|
| Cost | ✅ Best | ⚠️ Medium | ✅✅ Free |
| Performance | ✅ Excellent | ✅ Excellent | ⚠️ Good |
| Speed | ✅ Fast | ✅ Fast | ✅✅ Fastest |
| Data Privacy | ❌ External API | ❌ External API | ✅ Self-hosted |
| Maintenance | ✅ Zero | ✅ Zero | ⚠️ Self-host |

**Decision:** Use `text-embedding-3-small` unless data privacy requires self-hosting.

---

## Vector Storage Strategy

### Database: PostgreSQL with pgvector Extension

**Why pgvector:**
- Native vector operations in PostgreSQL
- HNSW index for fast approximate nearest neighbor search
- Familiar SQL interface
- Handles 1536-dimensional vectors efficiently

### Storage Schema

**Key Tables:**
1. `behavior_trigger_embeddings`: Pre-computed embeddings for each behavior's triggers
2. `conversation_embeddings`: Embeddings for user/agent messages over time
3. `conversation_state`: Tracks active behavior and context per user

**Vector Dimensions:** 1536 (matches OpenAI text-embedding-3-small)

**Index Strategy:**
- HNSW index on embedding columns for <10ms search
- Composite indexes on (user_id, created_at) for history queries

**Storage Estimates:**
- 1 embedding = 1536 dimensions × 4 bytes = 6.1 KB
- 1000 messages/user/month = ~6.1 MB/user/month
- 10,000 users = 61 GB/month (manageable)

### Retention Policy
- Keep conversation_embeddings for 90 days
- Archive older embeddings to cold storage
- Keep behavior_trigger_embeddings indefinitely (small dataset)

---

## Performance Targets

### End-to-End Latency Budget

Target: **<2 seconds** from message arrival to behavior selection

**Breakdown:**
1. **Embedding Generation**: 500ms (6 embeddings via OpenAI API batch)
2. **Vector Search** (6 parallel queries): 100ms (HNSW index)
3. **Score Aggregation**: 50ms (in-memory computation)
4. **LLM Selection**: 1000ms (GPT-4-turbo-preview, short prompt)
5. **Database Writes**: 50ms (log transition)

**Total**: ~1.7 seconds ✅

### Optimization Strategies

**If Latency Exceeds Target:**

1. **Parallel Execution**: 
   - Run vector search in parallel with LLM call prep
   - Pre-generate external context embedding during conversation

2. **Caching**:
   - Cache behavior trigger embeddings in memory (never change)
   - Cache external context embedding for 60 seconds (user state doesn't change that fast)

3. **Model Selection**:
   - Use faster LLM for selection (e.g., GPT-3.5-turbo instead of GPT-4) if latency critical
   - Tradeoff: Slightly less nuanced decisions

4. **Reduce Vector Types**:
   - Start with 3 core types (user message, agent message, external context)
   - Add others if latency budget allows

### Monitoring Metrics
- P50, P95, P99 latency for each step
- Embedding API success rate
- Vector search performance
- LLM selection accuracy (via user feedback/overrides)

---

## Continuous Learning

### Feedback Loop

**Explicit Feedback:**
- User can override behavior selection ("Actually, I want to talk about X")
- Log override → Label that (message, context) → correct behavior
- Periodically retrain trigger embeddings with labeled data

**Implicit Feedback:**
- Track behavior engagement:
  - Did user continue in behavior or switch immediately?
  - How many messages in behavior before switching?
  - Did user complete behavior's success criteria?
- Use engagement as weak signal for trigger quality

### Trigger Refinement

**Initial Triggers:**
- Use existing keywords and patterns from behaviors.ts
- Convert to natural language descriptions
- Generate embeddings for each trigger description

**Iterative Improvement:**
1. Collect misclassifications (when LLM overrides vector scores significantly)
2. Analyze: What message patterns are we missing?
3. Add new trigger descriptions to `behavior_trigger_embeddings`
4. Re-generate embeddings

**Example:**
```
Initial trigger for "weekly-planning": 
  "User wants to plan their week"

After learning:
  "User wants to plan their week"
  "User is organizing their schedule"
  "User is setting intentions for the coming days"
  "User mentioned it's Sunday or Monday and wants to get organized"
```

---

## Testing Strategy

### Unit Tests

1. **Embedding Generation**
   - Verify correct dimensions (1536)
   - Verify API error handling
   - Test batch embedding efficiency

2. **Vector Search**
   - Test similarity threshold filtering
   - Test top-K retrieval accuracy
   - Test HNSW index performance

3. **Score Aggregation**
   - Test weighted averaging
   - Test priority multipliers
   - Test persistence bonus logic

### Integration Tests

1. **End-to-End Flow**
   - Given message → Correct behavior selected
   - Test all 13 behaviors
   - Test edge cases (ambiguous messages)

2. **Performance**
   - Latency under load (100 concurrent requests)
   - Database query performance
   - API rate limiting

### Behavior-Specific Tests

For each behavior:
1. **Positive Cases**: Messages that should trigger this behavior
2. **Negative Cases**: Similar but should trigger different behavior
3. **Persistence Cases**: Should stay in behavior across multiple messages
4. **Exit Cases**: Should recognize explicit switch signals

**Example Test Suite for `difficult-emotion-processing`:**
```
Positive:
- "I'm feeling overwhelmed and anxious" ✅
- "Everything is falling apart" ✅
- "I can't cope anymore" ✅

Negative:
- "I was feeling overwhelmed, but now I'm okay" → free-form-chat
- "My friend is feeling anxious" → free-form-chat (not about user)

Persistence:
- "I'm anxious" → difficult-emotion-processing
- "It's been going on for days" → STAY in difficult-emotion-processing

Exit:
- "Thanks, I feel better now. Let's plan my week" → weekly-planning
```

### A/B Testing

**Phase 1: Shadow Mode**
- Run vector system in parallel with keyword system
- Log both predictions, use keyword system for actual behavior
- Compare accuracy, collect data

**Phase 2: Gradual Rollout**
- 10% of users on vector system
- Monitor: latency, behavior accuracy, user engagement
- Gradually increase to 100%

**Success Metrics:**
- Behavior selection accuracy > 85% (vs human judgment)
- Average latency < 2s
- User engagement (messages per session) increases or stays same
- Fewer user overrides/corrections

---

## Risk Assessment & Mitigation

### Risk 1: High Latency
**Impact:** User waits >2s for response, poor UX
**Probability:** Medium
**Mitigation:**
- Aggressive caching of embeddings
- Parallel execution of independent steps
- Fallback to fast keyword matching if vector system times out
- Use faster embedding model (3-small vs ada-002)

### Risk 2: Embedding API Failures
**Impact:** System can't generate embeddings, behavior detection fails
**Probability:** Low (OpenAI SLA ~99.9%)
**Mitigation:**
- Retry logic with exponential backoff
- Fallback to keyword matching on API failure
- Cache recent embeddings to reuse if API down
- Health monitoring and alerts

### Risk 3: Poor Behavior Selection Accuracy
**Impact:** Wrong behaviors selected, user frustration
**Probability:** Medium (especially in early deployment)
**Mitigation:**
- Extensive testing before rollout
- A/B test against keyword system
- User feedback mechanism ("Switch to X instead")
- Continuous monitoring and trigger refinement

### Risk 4: Database Performance Degradation
**Impact:** Slow vector searches, increased latency
**Probability:** Low (HNSW index is fast)
**Mitigation:**
- Proper indexing strategy
- Connection pooling
- Query timeout limits
- Regular VACUUM and index maintenance
- Scale database vertically if needed

### Risk 5: Cost Explosion
**Impact:** High OpenAI API costs
**Probability:** Low-Medium
**Mitigation:**
- Use cost-effective text-embedding-3-small
- Batch embedding requests (6 at once)
- Cache embeddings aggressively
- Rate limit per user if needed
- Monitor spending, set alerts

### Risk 6: Cold Start Problem
**Impact:** Insufficient trigger embeddings initially
**Probability:** High (new system)
**Mitigation:**
- Seed initial trigger embeddings from existing keywords/patterns
- Expand triggers manually before launch
- Use LLM to generate diverse trigger phrases for each behavior
- Collect and label data from shadow mode

---

## Future Enhancements

### Phase 2 Features

1. **User-Specific Embeddings**
   - Learn per-user behavior patterns
   - "User always wants journaling on Sunday evenings"
   - Personalized trigger embeddings

2. **Multi-Turn Conversation Vectors**
   - Embed last 3-5 message exchanges as single vector
   - Capture conversation trajectory, not just current message
   - Better behavior persistence and flow detection

3. **Emotion Embeddings**
   - Extract emotion from message (separate model or LLM)
   - Generate emotion-specific vector
   - Better match emotional states to behaviors

4. **Fine-Tuned Embedding Model**
   - Fine-tune sentence-transformers model on our data
   - Optimize for mental wellness domain
   - Reduce cost, increase accuracy

5. **Real-Time Learning**
   - Update trigger embeddings based on user feedback immediately
   - Online learning from every interaction
   - Adaptive system that improves continuously

### Phase 3: Advanced Features

1. **Behavior Transition Prediction**
   - Predict when user is likely to switch behaviors
   - Proactively suggest: "Would you like to do a weekly review?"

2. **Multi-Behavior Sessions**
   - Support blended behaviors (e.g., emotion processing + boundary setting)
   - Dynamic weighting based on conversation flow

3. **Voice/Audio Embeddings**
   - For voice-based interactions
   - Capture tone, emotion from audio
   - Multimodal behavior detection

4. **Explainable AI Dashboard**
   - Show user why specific behavior was selected
   - "I noticed you mentioned X, which suggests Y"
   - Build trust and transparency

---

## Conclusion

This multi-vector embedding architecture provides a robust, scalable, and intelligent foundation for behavior detection in the Ora AI wellness app. By moving from brittle keyword matching to semantic understanding across 6 vector types, the system can:

- **Understand user intent** even with novel phrasing
- **Adapt to context** (time, mood, conversation flow)
- **Learn continuously** from user interactions
- **Provide explainable decisions** via LLM reasoning
- **Maintain <2s latency** for real-time conversation

The architecture is designed for incremental rollout (shadow mode → A/B test → full deployment) and continuous improvement through feedback loops.

**Next Steps:** See `implementation-plan.md` for detailed task breakdown and recommended implementation order.
