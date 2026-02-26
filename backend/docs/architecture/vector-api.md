# Vector Embedding API Design

## Overview

This document specifies the API endpoints, WebSocket events, and service interfaces for the multi-vector embedding behavior detection system.

**Core Services:**
1. **Embedding Service**: Generates embeddings via OpenAI API
2. **Vector Search Service**: Queries pgvector for similarity search
3. **Behavior Detection Service**: Orchestrates the full detection pipeline
4. **Feedback Service**: Captures and processes user feedback

---

## Table of Contents

1. [HTTP REST API](#http-rest-api)
2. [WebSocket Events](#websocket-events)
3. [Internal Service Interfaces](#internal-service-interfaces)
4. [Rate Limiting & Caching](#rate-limiting--caching)
5. [Error Handling](#error-handling)
6. [Authentication](#authentication)

---

## HTTP REST API

### Base URL
```
Production: https://api.ora-ai.com/v1
Development: http://localhost:3000/v1
```

All endpoints require authentication via JWT token in `Authorization` header.

---

### 1. Behavior Detection Endpoints

#### `POST /behavior/detect`

**Description:** Primary endpoint for detecting appropriate behavior based on user message and context.

**Request:**
```json
{
  "message": "I'm feeling really overwhelmed with work",
  "userId": "user-123",
  "conversationContext": {
    "sessionId": "session-abc",
    "lastAgentMessage": "How are you doing today?",
    "recentToolCalls": [
      {
        "tool": "get_recent_journal_entries",
        "timestamp": "2024-02-11T10:30:00Z"
      }
    ]
  },
  "options": {
    "includeReasoning": true,
    "topCandidates": 20
  }
}
```

**Response (200 OK):**
```json
{
  "selectedBehavior": {
    "id": "difficult-emotion-processing",
    "name": "Difficult Emotion Processing",
    "priority": 10,
    "confidence": 0.87
  },
  "reasoning": "User explicitly mentioned feeling overwhelmed, which indicates acute emotional distress. This matches the primary trigger for difficult-emotion-processing.",
  "vectorScores": {
    "userMessage": 0.92,
    "agentMessage": 0.45,
    "combined": 0.68,
    "agentThought": 0.81,
    "externalContext": 0.52,
    "toolCalls": 0.33
  },
  "topCandidates": [
    {
      "behaviorId": "difficult-emotion-processing",
      "score": 0.87,
      "matchedTriggers": ["User expresses overwhelming emotions"]
    },
    {
      "behaviorId": "energy-checkin",
      "score": 0.64,
      "matchedTriggers": ["User mentions work stress"]
    }
  ],
  "previousBehavior": "free-form-chat",
  "latency": {
    "total": 1650,
    "embedding": 480,
    "search": 95,
    "llm": 920,
    "database": 155
  },
  "detectionMethod": "multi-vector-embedding"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Missing or invalid auth token
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Detection pipeline failure
- `503 Service Unavailable`: OpenAI API unavailable

**Rate Limit:** 60 requests per minute per user

**Caching:** No caching (each detection is unique to conversation state)

---

#### `POST /behavior/feedback`

**Description:** Submit user feedback when they override or correct behavior selection.

**Request:**
```json
{
  "userId": "user-123",
  "detectionLogId": "log-uuid-123",
  "userMessage": "I'm feeling really overwhelmed",
  "suggestedBehaviorId": "energy-checkin",
  "userSelectedBehaviorId": "difficult-emotion-processing",
  "feedbackType": "override",
  "comment": "I needed emotional support, not an energy check"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "feedbackId": "feedback-uuid-456",
  "message": "Feedback recorded. Thank you for helping us improve."
}
```

**Use Case:** 
User sees behavior suggestion in UI, clicks "Switch to X instead", app sends feedback to improve future detection.

---

#### `GET /behavior/current/:userId`

**Description:** Get the current active behavior for a user.

**Response (200 OK):**
```json
{
  "userId": "user-123",
  "activeBehavior": {
    "id": "weekly-planning",
    "name": "Weekly Planning",
    "startedAt": "2024-02-11T10:00:00Z",
    "messageCount": 5
  },
  "persistenceStrength": 0.75,
  "canSwitch": true
}
```

**Use Case:** 
Chat UI displays current behavior mode to user.

---

#### `GET /behavior/history/:userId`

**Description:** Get behavior transition history for a user.

**Query Parameters:**
- `limit` (default: 50): Number of transitions to return
- `startDate` (optional): ISO timestamp
- `endDate` (optional): ISO timestamp

**Response (200 OK):**
```json
{
  "userId": "user-123",
  "transitions": [
    {
      "fromBehavior": "free-form-chat",
      "toBehavior": "weekly-planning",
      "timestamp": "2024-02-11T10:00:00Z",
      "confidence": 0.89,
      "userOverrode": false
    },
    {
      "fromBehavior": "weekly-planning",
      "toBehavior": "difficult-emotion-processing",
      "timestamp": "2024-02-11T10:15:00Z",
      "confidence": 0.92,
      "userOverrode": false
    }
  ],
  "total": 2
}
```

---

### 2. Embedding Management Endpoints

#### `POST /embeddings/generate`

**Description:** Generate embeddings for arbitrary text (admin/testing only).

**Request:**
```json
{
  "texts": [
    "I'm feeling overwhelmed",
    "Let's plan my week"
  ],
  "model": "text-embedding-3-small"
}
```

**Response (200 OK):**
```json
{
  "embeddings": [
    {
      "text": "I'm feeling overwhelmed",
      "embedding": [0.023, -0.015, 0.041, ...], // 1536 dimensions
      "model": "text-embedding-3-small"
    },
    {
      "text": "Let's plan my week",
      "embedding": [0.018, 0.032, -0.008, ...],
      "model": "text-embedding-3-small"
    }
  ],
  "usage": {
    "totalTokens": 15,
    "cost": 0.0000003
  }
}
```

**Authentication:** Admin only

**Rate Limit:** 30 requests per minute

---

#### `POST /embeddings/triggers/refresh`

**Description:** Regenerate all behavior trigger embeddings from behaviors.ts config (admin only).

**Request:**
```json
{
  "force": true,
  "behaviorIds": ["difficult-emotion-processing", "weekly-planning"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "refreshed": 42,
  "errors": 0,
  "duration": 8500
}
```

**Use Case:**
After updating behaviors.ts with new trigger descriptions, regenerate embeddings.

---

#### `GET /embeddings/triggers/:behaviorId`

**Description:** Get all trigger embeddings for a specific behavior.

**Response (200 OK):**
```json
{
  "behaviorId": "difficult-emotion-processing",
  "triggers": [
    {
      "id": "trigger-uuid-1",
      "description": "User expresses acute distress or anxiety",
      "vectorType": "user_message",
      "createdAt": "2024-02-10T12:00:00Z"
    },
    {
      "id": "trigger-uuid-2",
      "description": "User mentions feeling overwhelmed",
      "vectorType": "user_message",
      "createdAt": "2024-02-10T12:00:00Z"
    }
  ],
  "total": 2
}
```

---

### 3. Analytics Endpoints

#### `GET /analytics/behavior/usage`

**Description:** Get behavior usage statistics (admin only).

**Query Parameters:**
- `startDate` (optional): ISO timestamp
- `endDate` (optional): ISO timestamp
- `groupBy` (default: "day"): day | week | month

**Response (200 OK):**
```json
{
  "period": {
    "start": "2024-02-01T00:00:00Z",
    "end": "2024-02-11T23:59:59Z"
  },
  "behaviors": [
    {
      "behaviorId": "free-form-chat",
      "name": "Free-form Chat",
      "detectionCount": 1542,
      "avgConfidence": 0.78,
      "avgLatency": 1420,
      "overrideRate": 0.05
    },
    {
      "behaviorId": "difficult-emotion-processing",
      "name": "Difficult Emotion Processing",
      "detectionCount": 387,
      "avgConfidence": 0.89,
      "avgLatency": 1680,
      "overrideRate": 0.03
    }
  ]
}
```

---

#### `GET /analytics/performance`

**Description:** Get system performance metrics (admin only).

**Response (200 OK):**
```json
{
  "period": {
    "start": "2024-02-11T00:00:00Z",
    "end": "2024-02-11T23:59:59Z"
  },
  "metrics": {
    "totalDetections": 2540,
    "avgLatency": 1550,
    "p50Latency": 1420,
    "p95Latency": 2100,
    "p99Latency": 3200,
    "detectionMethods": {
      "multi-vector-embedding": 2450,
      "keyword-fallback": 90
    },
    "embeddingApiSuccess": 0.998,
    "vectorSearchAvgTime": 92
  }
}
```

---

## WebSocket Events

### Connection URL
```
wss://api.ora-ai.com/v1/ws?token={JWT_TOKEN}
```

### Events

#### Client → Server: `chat:message`

**Payload:**
```json
{
  "message": "I'm feeling anxious",
  "sessionId": "session-abc"
}
```

**Response:** Server emits `chat:behavior-detected` and `chat:response` events.

---

#### Server → Client: `chat:behavior-detected`

**Payload:**
```json
{
  "behaviorId": "difficult-emotion-processing",
  "behaviorName": "Difficult Emotion Processing",
  "confidence": 0.87,
  "reasoning": "User expressed anxiety...",
  "previousBehavior": "free-form-chat",
  "isSwitch": true
}
```

**Use Case:** 
UI shows behavior transition: "Switching to Difficult Emotion Processing mode..."

---

#### Server → Client: `chat:response`

**Payload:**
```json
{
  "message": "I hear that you're feeling anxious. That sounds really hard. You're not alone in this.",
  "behaviorId": "difficult-emotion-processing",
  "messageId": "msg-uuid-123",
  "timestamp": "2024-02-11T10:30:15Z"
}
```

---

#### Server → Client: `chat:behavior-suggestion`

**Payload:**
```json
{
  "suggestedBehavior": {
    "id": "weekly-planning",
    "name": "Weekly Planning",
    "reason": "It's Sunday evening. Would you like to plan your week?"
  },
  "currentBehavior": "free-form-chat",
  "isProactive": true
}
```

**Use Case:**
Proactive behavior suggestions based on time/context.

---

#### Client → Server: `chat:override-behavior`

**Payload:**
```json
{
  "currentBehaviorId": "energy-checkin",
  "desiredBehaviorId": "weekly-planning",
  "reason": "User clicked 'Switch to Planning' button"
}
```

**Response:** Server emits `chat:behavior-detected` with new behavior.

---

## Internal Service Interfaces

### 1. EmbeddingService

**Purpose:** Generate embeddings via OpenAI API

```typescript
interface EmbeddingService {
  /**
   * Generate embedding for a single text
   */
  generateEmbedding(
    text: string,
    model?: string
  ): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts (batched)
   */
  generateBatchEmbeddings(
    texts: string[],
    model?: string
  ): Promise<number[][]>;

  /**
   * Get embedding dimensions for a model
   */
  getEmbeddingDimensions(model: string): number;
}
```

**Implementation Notes:**
- Use OpenAI `text-embedding-3-small` by default (1536 dimensions)
- Batch up to 2048 texts per API call for efficiency
- Implement retry logic with exponential backoff
- Cache frequently requested embeddings (e.g., behavior triggers)

---

### 2. VectorSearchService

**Purpose:** Query pgvector for similarity search

```typescript
interface VectorSearchService {
  /**
   * Search for top-K similar behaviors
   */
  searchBehaviorTriggers(
    queryEmbedding: number[],
    vectorType: VectorType,
    topK?: number,
    similarityThreshold?: number
  ): Promise<BehaviorMatch[]>;

  /**
   * Search user's conversation history
   */
  searchConversationHistory(
    userId: string,
    queryEmbedding: number[],
    vectorType: VectorType,
    topK?: number,
    daysBack?: number
  ): Promise<ConversationMatch[]>;

  /**
   * Store conversation embedding
   */
  storeConversationEmbedding(
    userId: string,
    vectorType: VectorType,
    sourceText: string,
    embedding: number[],
    metadata?: any
  ): Promise<string>; // Returns embedding ID
}

interface BehaviorMatch {
  behaviorId: string;
  triggerDescription: string;
  similarity: number; // 0-1
  metadata: any;
}

interface ConversationMatch {
  id: string;
  sourceText: string;
  similarity: number;
  behaviorContext?: string;
  createdAt: Date;
}

type VectorType = 
  | 'user_message'
  | 'agent_message'
  | 'combined_exchange'
  | 'agent_thought'
  | 'external_context'
  | 'tool_call';
```

---

### 3. BehaviorDetectionService

**Purpose:** Orchestrate multi-vector detection pipeline

```typescript
interface BehaviorDetectionService {
  /**
   * Main detection method
   */
  detectBehavior(
    message: string,
    userId: string,
    conversationContext: ConversationContext
  ): Promise<BehaviorDetectionResult>;

  /**
   * Get current active behavior for user
   */
  getCurrentBehavior(userId: string): Promise<Behavior | null>;

  /**
   * Force switch to specific behavior (user override)
   */
  switchBehavior(
    userId: string,
    behaviorId: string,
    reason: string
  ): Promise<void>;

  /**
   * Get behavior by ID
   */
  getBehaviorById(behaviorId: string): Behavior | undefined;
}

interface ConversationContext {
  sessionId?: string;
  lastAgentMessage?: string;
  recentToolCalls?: ToolCall[];
  userState?: {
    mood?: string;
    recentJournalThemes?: string[];
    daysS SinceLastCheckIn?: number;
  };
}

interface BehaviorDetectionResult {
  selectedBehavior: Behavior;
  confidence: number;
  reasoning: string;
  vectorScores: Record<VectorType, number>;
  topCandidates: BehaviorCandidate[];
  previousBehavior?: string;
  latency: LatencyBreakdown;
  detectionMethod: 'multi-vector-embedding' | 'keyword-fallback';
}

interface BehaviorCandidate {
  behaviorId: string;
  score: number;
  matchedTriggers: string[];
}

interface LatencyBreakdown {
  total: number;
  embedding: number;
  search: number;
  llm: number;
  database: number;
}
```

---

### 4. FeedbackService

**Purpose:** Process user feedback for continuous learning

```typescript
interface FeedbackService {
  /**
   * Record user feedback on behavior selection
   */
  recordFeedback(feedback: BehaviorFeedback): Promise<string>;

  /**
   * Get feedback for specific behavior
   */
  getFeedbackForBehavior(
    behaviorId: string,
    limit?: number
  ): Promise<BehaviorFeedback[]>;

  /**
   * Get most common corrections
   */
  getCommonCorrections(): Promise<CorrectionPattern[]>;
}

interface BehaviorFeedback {
  userId: string;
  detectionLogId: string;
  userMessage: string;
  suggestedBehaviorId: string;
  userSelectedBehaviorId: string;
  feedbackType: 'override' | 'correction' | 'preference';
  comment?: string;
}

interface CorrectionPattern {
  fromBehaviorId: string;
  toBehaviorId: string;
  count: number;
  avgConfidenceWhenWrong: number;
  commonTriggerPhrases: string[];
}
```

---

## Rate Limiting & Caching

### Rate Limits (per user)

| Endpoint | Rate Limit |
|----------|-----------|
| `POST /behavior/detect` | 60 req/min |
| `POST /behavior/feedback` | 30 req/min |
| `GET /behavior/current/:userId` | 120 req/min |
| `GET /behavior/history/:userId` | 30 req/min |
| Admin endpoints | 30 req/min |

**Implementation:** Redis-based rate limiting with sliding window algorithm.

**Response Header:** `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

### Caching Strategy

#### 1. Behavior Trigger Embeddings (Permanent Cache)
- **Cache:** In-memory (Node.js Map or Redis)
- **TTL:** Infinite (invalidate on trigger refresh)
- **Rationale:** Triggers rarely change, accessed on every detection

#### 2. External Context Embeddings (Short TTL)
- **Cache:** Redis
- **TTL:** 60 seconds
- **Key:** `external-context:{userId}:{timestamp-minute}`
- **Rationale:** User state doesn't change rapidly within a minute

#### 3. Recent Conversation Embeddings (User-scoped)
- **Cache:** Redis
- **TTL:** 5 minutes
- **Key:** `conv-embeddings:{userId}:recent`
- **Rationale:** Avoid re-querying recent messages frequently

#### 4. Current Behavior State (User-scoped)
- **Cache:** Redis
- **TTL:** 10 minutes
- **Key:** `behavior-state:{userId}`
- **Rationale:** Reduce database reads for active users

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "EMBEDDING_API_ERROR",
    "message": "Failed to generate embeddings from OpenAI API",
    "details": "Connection timeout after 10s",
    "retryable": true,
    "timestamp": "2024-02-11T10:30:00Z"
  }
}
```

### Error Codes

| Code | Description | HTTP Status | Retryable |
|------|-------------|-------------|-----------|
| `INVALID_REQUEST` | Malformed request | 400 | No |
| `UNAUTHORIZED` | Missing/invalid auth | 401 | No |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 | Yes (after delay) |
| `EMBEDDING_API_ERROR` | OpenAI API failure | 500 | Yes |
| `DATABASE_ERROR` | PostgreSQL error | 500 | Yes |
| `VECTOR_SEARCH_ERROR` | pgvector search failed | 500 | Yes |
| `LLM_SELECTION_ERROR` | LLM selection failed | 500 | Yes |
| `SERVICE_UNAVAILABLE` | System overloaded | 503 | Yes |

### Fallback Behavior

If multi-vector detection fails:
1. Log error with full context
2. Fall back to keyword-based detection (legacy system)
3. Return result with `detectionMethod: "keyword-fallback"`
4. Alert engineering team if fallback rate >5%

---

## Authentication

### JWT Token Structure

```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "role": "user",
  "iat": 1707652800,
  "exp": 1707739200
}
```

**Token Lifetime:** 24 hours

**Refresh:** Use `/auth/refresh` endpoint with refresh token

### Admin Endpoints

Admin-only endpoints require `role: "admin"` in JWT token.

---

## API Client Example

### TypeScript SDK (example usage)

```typescript
import { OraAIClient } from '@ora-ai/sdk';

const client = new OraAIClient({
  apiKey: process.env.ORA_API_KEY,
  baseUrl: 'https://api.ora-ai.com/v1'
});

// Detect behavior
const result = await client.behavior.detect({
  message: "I'm feeling really overwhelmed",
  userId: "user-123",
  conversationContext: {
    sessionId: "session-abc",
    lastAgentMessage: "How are you doing?"
  }
});

console.log(`Selected behavior: ${result.selectedBehavior.name}`);
console.log(`Confidence: ${result.confidence}`);

// Submit feedback
await client.behavior.feedback({
  userId: "user-123",
  detectionLogId: result.detectionLogId,
  userSelectedBehaviorId: "weekly-planning",
  feedbackType: "override"
});
```

---

## Performance SLAs

| Metric | Target | P95 | P99 |
|--------|--------|-----|-----|
| Detection Latency | <2s | <2.5s | <4s |
| Embedding Generation | <500ms | <800ms | <1.2s |
| Vector Search | <100ms | <150ms | <300ms |
| API Availability | 99.9% | - | - |
| Error Rate | <0.1% | - | - |

**Monitoring:** Prometheus + Grafana dashboards for all metrics.

**Alerting:** PagerDuty alerts if P95 latency >3s or error rate >1%.

---

## Summary

This API design provides:
- **RESTful endpoints** for behavior detection, feedback, and analytics
- **WebSocket events** for real-time behavior switching in chat UIs
- **Well-defined service interfaces** for internal architecture
- **Rate limiting and caching** for scalability
- **Comprehensive error handling** with fallback mechanisms
- **Authentication and authorization** for security

The design supports the multi-vector embedding system while maintaining <2s latency and graceful degradation under failure conditions.
