# pgvector Setup Guide

## Overview

This guide covers the complete setup and usage of the pgvector extension for the Ora AI multi-vector embedding system. This system enables intelligent behavior detection using semantic understanding across 6 vector types.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 16 with pgvector extension
- OpenAI API key (for production embeddings)
- Node.js 18+ and TypeScript

## Quick Start

### 1. Update Docker Configuration

The docker-compose.yml has been updated to use `pgvector/pgvector:pg16` instead of `postgres:16-alpine`:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16  # ← Changed from postgres:16-alpine
    # ... rest of config
```

### 2. Restart PostgreSQL Container

```bash
# Stop existing container
docker-compose down

# Remove old volume (CAUTION: This deletes all data!)
docker volume rm ora-ai-api_postgres_data

# Start new pgvector-enabled container
docker-compose up -d postgres

# Verify container is running
docker-compose ps
```

### 3. Run Vector Migration

```bash
# Install dependencies if needed
npm install

# Run the migration
npm run build
node dist/run-vector-migration.js

# Or using ts-node directly
npx ts-node run-vector-migration.ts
```

### 4. Configure OpenAI API Key

Add your OpenAI API key to `.env`:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Note:** If OpenAI key is not configured, the system will automatically use mock embeddings for development/testing.

### 5. Run Tests

```bash
# Build and test
npm run build
node dist/test-vector-system.js

# Or using ts-node
npx ts-node test-vector-system.ts
```

## What Was Created

### Database Tables

1. **behavior_trigger_embeddings**
   - Pre-computed embeddings for each behavior's trigger descriptions
   - HNSW index for fast similarity search
   - Supports 6 vector types: user_message, agent_message, combined_exchange, agent_thought, external_context, tool_call

2. **conversation_embeddings**
   - Embeddings generated during conversations
   - Tracks user message history semantically
   - HNSW index for similarity search within user history

3. **conversation_state**
   - Tracks active behavior and context per user
   - Stores recent messages and tool calls
   - Enables behavior persistence logic

4. **behavior_detection_logs**
   - Logs every behavior detection decision
   - Stores vector scores, LLM reasoning, and latency metrics
   - Critical for analytics and continuous learning

5. **behavior_feedback**
   - Explicit user feedback for supervised learning
   - Tracks behavior overrides and corrections

### Services

#### EmbeddingService (`src/services/embedding.service.ts`)

Generates embeddings using OpenAI text-embedding-3-small:

```typescript
import { embeddingService } from './services/embedding.service';

// Generate single embedding
const embedding = await embeddingService.generateEmbedding('I feel anxious');

// Generate batch (more efficient)
const results = await embeddingService.generateBatchEmbeddings([
  { text: 'Message 1', vectorType: 'user_message' },
  { text: 'Message 2', vectorType: 'agent_message' },
]);

// Generate conversation embeddings (all types at once)
const convEmbeddings = await embeddingService.generateConversationEmbeddings({
  userMessage: 'I need help with anxiety',
  agentLastResponse: 'I can help with that',
  externalContext: { timeOfDay: 'evening', mood: 'anxious' },
});
```

**Features:**
- Automatic caching with 1-hour TTL
- Batch processing (up to 6 embeddings at once)
- Mock embeddings for development (when API key not configured)
- Error recovery with fallback to mock embeddings

#### VectorSearchService (`src/services/vector-search.service.ts`)

Handles similarity search and vector storage:

```typescript
import { vectorSearchService } from './services/vector-search.service';

// Search behavior triggers
const results = await vectorSearchService.searchBehaviorTriggers(
  embedding,
  'user_message',
  { topK: 5, similarityThreshold: 0.4 }
);

// Multi-vector search (parallel)
const multiResults = await vectorSearchService.searchMultiVector({
  userMessage: userEmbedding,
  agentMessage: agentEmbedding,
  externalContext: contextEmbedding,
});

// Rank candidates with weights
const candidates = vectorSearchService.rankBehaviorCandidates(
  multiResults.results,
  {
    user_message: 1.0,
    agent_message: 0.3,
    external_context: 0.4,
  }
);

// Apply priority and persistence bonuses
const adjusted = vectorSearchService.applyBehaviorPriority(
  candidates,
  currentBehaviorId
);

// Store conversation embedding
await vectorSearchService.storeConversationEmbedding({
  userId: 'user-uuid',
  vectorType: 'user_message',
  sourceText: 'I feel anxious',
  embedding: embedding,
  behaviorContext: 'difficult-emotion-processing',
});

// Log detection result
await vectorSearchService.logBehaviorDetection({
  userId: 'user-uuid',
  userMessage: 'I feel anxious',
  detectedBehaviorId: 'difficult-emotion-processing',
  detectionMethod: 'multi-vector-embedding',
  confidenceScore: 0.87,
  vectorScores: { user_message: 0.92, external_context: 0.75 },
  topCandidates: candidates.slice(0, 20),
  latencyMs: 1234,
});
```

### Helper Functions

Two PostgreSQL functions are available:

#### 1. `search_behavior_triggers()`

```sql
SELECT * FROM search_behavior_triggers(
  embedding_vector::vector,
  'user_message',
  5,  -- top K
  0.4 -- similarity threshold
);
```

Returns top K behaviors with similarity scores above threshold.

#### 2. `search_user_conversation_history()`

```sql
SELECT * FROM search_user_conversation_history(
  embedding_vector::vector,
  user_id::uuid,
  'user_message',
  10, -- top K
  90  -- days back
);
```

Searches user's past conversations for similar messages.

## Analytics Views

Three views are created for monitoring:

### 1. behavior_usage_stats

```sql
SELECT * FROM behavior_usage_stats;
```

Shows detection counts, average confidence, latency, and override rates per behavior.

### 2. user_behavior_preferences

```sql
SELECT * FROM user_behavior_preferences WHERE user_id = 'uuid';
```

Shows which behaviors each user engages with most.

### 3. detection_performance

```sql
SELECT * FROM detection_performance WHERE date >= CURRENT_DATE - 7;
```

Shows P50/P95/P99 latency, confidence, and override rates by day and method.

## Performance Tuning

### HNSW Index Parameters

The migration creates HNSW indexes with these parameters:

- `m = 16`: Number of connections per layer (default, balanced)
- `ef_construction = 64`: Candidate list size during build (good quality)

**If searches are slow:**

```sql
-- Increase search quality at query time
SET LOCAL hnsw.ef_search = 100;
```

**If searches are inaccurate:**

```sql
-- Rebuild index with higher quality
DROP INDEX idx_behavior_trigger_embeddings_vector;
CREATE INDEX idx_behavior_trigger_embeddings_vector 
  ON behavior_trigger_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 32, ef_construction = 128);
```

### Query Performance

- **Expected search latency**: <100ms for top-5 search
- **Expected total latency**: <2s for full behavior detection
- **Embedding latency**: ~500ms for 6 embeddings (batch)

Monitor with:

```sql
SELECT 
  AVG(search_latency_ms) as avg_search,
  AVG(embedding_latency_ms) as avg_embedding,
  AVG(latency_ms) as avg_total
FROM behavior_detection_logs
WHERE created_at >= CURRENT_DATE;
```

## Data Retention

Conversation embeddings are kept for 90 days by default. Run cleanup:

```sql
SELECT cleanup_old_conversation_embeddings(); -- Returns number deleted
SELECT archive_old_detection_logs(); -- Archives logs older than 180 days
```

Set up a cron job to run these periodically.

## Cost Management

### OpenAI Embedding Costs

Using `text-embedding-3-small`:

- **Price**: $0.02 per 1M tokens
- **Typical message**: ~50 tokens
- **Cost per message**: ~$0.000001 (6 embeddings)
- **10,000 messages/day**: ~$0.01/day = $3/month

### Optimization Tips

1. **Enable caching**: Already implemented (1-hour TTL)
2. **Batch requests**: Use `generateBatchEmbeddings()` instead of single calls
3. **Reuse embeddings**: Cache external context embeddings (user state doesn't change fast)
4. **Monitor spending**:
   ```typescript
   const stats = embeddingService.getStats();
   console.log(`Cache size: ${stats.cacheSize} entries`);
   ```

## Troubleshooting

### Issue: "pgvector extension not found"

**Solution**: Make sure you're using `pgvector/pgvector:pg16` image:

```bash
docker-compose down
docker-compose up -d postgres
docker exec shadow-ai-postgres psql -U shadowai -d shadowai -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Issue: "Migration fails with syntax error"

**Solution**: Ensure PostgreSQL 12+ (vector type requires Postgres 12+):

```bash
docker exec shadow-ai-postgres psql -V
```

### Issue: "Embedding API rate limit"

**Solution**: Implement exponential backoff (already handled in service) or use batch requests.

### Issue: "Slow searches"

**Solution**: Check HNSW index exists:

```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'behavior_trigger_embeddings';
```

If missing, re-run migration.

### Issue: "Mock embeddings in production"

**Solution**: Set `OPENAI_API_KEY` in `.env`:

```bash
OPENAI_API_KEY=sk-your-real-key-here
```

## Next Steps

1. **Seed behavior triggers**: Create trigger embeddings for all 13 behaviors
   - Read `behaviors.ts`
   - Generate natural language descriptions
   - Generate embeddings via OpenAI
   - Insert into `behavior_trigger_embeddings`

2. **Integrate with chat flow**: Update `ai.service.ts` to use vector-based behavior detection

3. **A/B testing**: Run vector system in shadow mode alongside keyword matching

4. **Continuous learning**: Implement feedback loop using `behavior_feedback` table

## Architecture Reference

For detailed architecture and design decisions, see:

- `/docs/architecture/multi-vector-system.md` - Complete architecture specification
- `/docs/architecture/vector-schema.sql` - Commented schema with design notes
- `/docs/architecture/vector-api.md` - API integration guide (if exists)

## Support

For questions or issues:

1. Check this guide first
2. Review architecture docs
3. Run test suite to verify setup
4. Check database logs: `docker-compose logs postgres`
