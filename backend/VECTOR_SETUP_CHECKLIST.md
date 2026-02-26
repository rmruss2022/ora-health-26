# Vector Setup Checklist - ORA-075

## ✅ Completed Items

### Infrastructure
- [x] Updated `docker-compose.yml` to use `pgvector/pgvector:pg16` image
- [x] Updated `init-db.sql` to enable vector extension
- [x] Created migration `006_pgvector_setup.sql` with all vector tables
- [x] Created HNSW indexes for fast vector search
- [x] Created helper SQL functions for similarity search
- [x] Created analytics views for monitoring

### Services
- [x] Created `embedding.service.ts` with OpenAI integration
- [x] Implemented batch embedding generation
- [x] Implemented embedding cache (1-hour TTL)
- [x] Implemented mock embeddings fallback
- [x] Created `vector-search.service.ts` for pgvector operations
- [x] Implemented multi-vector parallel search
- [x] Implemented score aggregation and ranking
- [x] Implemented conversation state tracking
- [x] Implemented detection logging

### Testing & Documentation
- [x] Created `run-vector-migration.ts` migration runner
- [x] Created `test-vector-system.ts` comprehensive test suite
- [x] Added npm scripts: `migrate:vector`, `test:vector`
- [x] Created `/docs/VECTOR_SETUP_GUIDE.md` with full documentation
- [x] Updated `.env.example` with OPENAI_API_KEY
- [x] Created completion summary document

### Database Tables Created
- [x] `behavior_trigger_embeddings` - Behavior trigger vectors
- [x] `conversation_embeddings` - User conversation history
- [x] `conversation_state` - Active conversation tracking
- [x] `behavior_detection_logs` - Detection audit log
- [x] `behavior_feedback` - User feedback collection

---

## 🔲 Next Steps (Future Tasks)

### ORA-076: Seed Behavior Triggers
- [ ] Read all behaviors from `behaviors.ts`
- [ ] Generate natural language trigger descriptions
- [ ] Generate embeddings for each trigger
- [ ] Insert into `behavior_trigger_embeddings` table
- [ ] Verify search quality

### ORA-077: Integrate Vector Detection
- [ ] Update `behavior-detection.service.ts`
- [ ] Replace keyword matching with vector search
- [ ] Implement multi-vector detection flow
- [ ] Add LLM selection layer (GPT-4 or Claude)
- [ ] Implement persistence logic

### ORA-078: Chat Flow Integration
- [ ] Update `ai.service.ts` to call vector detection
- [ ] Store conversation embeddings after each message
- [ ] Update conversation state tracking
- [ ] Add external context building

### ORA-079: A/B Testing Setup
- [ ] Run vector system in shadow mode
- [ ] Log both keyword and vector predictions
- [ ] Compare accuracy metrics
- [ ] Collect user feedback
- [ ] Gradual rollout (10% → 50% → 100%)

---

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Stop existing PostgreSQL
docker-compose down

# 2. Remove old volume (⚠️  Deletes existing data!)
docker volume rm ora-ai-api_postgres_data

# 3. Start pgvector-enabled PostgreSQL
docker-compose up -d postgres

# 4. Wait for PostgreSQL to be ready
sleep 5

# 5. Run vector migration
npm run migrate:vector

# 6. Add OpenAI API key to .env
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# 7. Run tests to verify setup
npm run test:vector
```

### If PostgreSQL Already Running

```bash
# Just run the migration
npm run migrate:vector

# Run tests
npm run test:vector
```

---

## 📋 Verification

Run these commands to verify setup:

```bash
# Check pgvector extension
docker exec shadow-ai-postgres psql -U shadowai -d shadowai \
  -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Check tables created
docker exec shadow-ai-postgres psql -U shadowai -d shadowai \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%embedding%' OR tablename LIKE '%conversation%';"

# Check HNSW indexes
docker exec shadow-ai-postgres psql -U shadowai -d shadowai \
  -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE '%vector%';"

# Run test suite
npm run test:vector
```

Expected output:
- ✅ pgvector extension enabled
- ✅ 5 vector tables created
- ✅ 4 HNSW indexes created
- ✅ All tests passing

---

## 🐛 Troubleshooting

### "pgvector extension not found"
```bash
# Verify using correct Docker image
docker inspect shadow-ai-postgres | grep Image
# Should show: pgvector/pgvector:pg16

# If not, update docker-compose.yml and restart
docker-compose down
docker-compose up -d postgres
```

### "Migration fails"
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database connection
docker exec shadow-ai-postgres psql -U shadowai -d shadowai -c "SELECT version();"
```

### "Tests fail with embedding errors"
```bash
# Check if OpenAI key is set
grep OPENAI_API_KEY .env

# If not set, tests will use mock embeddings (which is fine for testing)
# To use real embeddings, add key to .env:
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

---

## 📊 Performance Expectations

Based on architecture spec:

| Operation | Expected Time | Actual (will vary) |
|-----------|---------------|-------------------|
| Single embedding | <100ms | 50-200ms (cached: <1ms) |
| Batch 6 embeddings | <500ms | 200-600ms |
| Vector search (top-5) | <100ms | 10-50ms with HNSW |
| Multi-vector search | <200ms | 50-150ms (parallel) |
| Full detection flow | <2s | TBD after integration |

---

## 💰 Cost Estimates

OpenAI text-embedding-3-small:
- **Price**: $0.02 per 1M tokens
- **Typical message**: ~50 tokens
- **6 embeddings/message**: ~300 tokens
- **Cost per message**: ~$0.000006
- **10,000 messages**: ~$0.06
- **100,000 messages**: ~$0.60
- **1M messages**: ~$6

Very affordable for embedding generation!

---

## 📚 Documentation

- **Setup Guide**: `/docs/VECTOR_SETUP_GUIDE.md`
- **Architecture**: `/docs/architecture/multi-vector-system.md`
- **Schema**: `/docs/architecture/vector-schema.sql`
- **Completion Summary**: `/ORA-075-COMPLETION-SUMMARY.md`

---

## ✨ Task Status

**ORA-075: Set up pgvector extension for vector storage**

Status: ✅ **COMPLETE**

All deliverables met:
1. ✅ Database migration for pgvector
2. ✅ Vector storage tables
3. ✅ Embedding service with OpenAI integration
4. ✅ Vector search service with HNSW
5. ✅ Docker compose update
6. ✅ Test scripts

Ready for:
- Code review
- QA testing
- Integration with behavior detection

**Mark complete:**
```bash
curl -X PATCH http://localhost:3001/api/tasks/ORA-075 \
  -H "Content-Type: application/json" \
  -d '{"state": "done", "completed_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}'
```
