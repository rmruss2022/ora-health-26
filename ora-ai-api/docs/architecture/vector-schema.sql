-- ============================================================================
-- MULTI-VECTOR EMBEDDING SCHEMA FOR BEHAVIOR DETECTION
-- ============================================================================
-- This schema supports a 6-vector embedding system for intelligent behavior
-- detection in the Ora AI wellness app. It uses pgvector for efficient
-- similarity search and HNSW indexes for fast nearest-neighbor queries.
--
-- Prerequisites: PostgreSQL 12+ with pgvector extension
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE 1: behavior_trigger_embeddings
-- ============================================================================
-- Stores pre-computed embeddings for each behavior's trigger descriptions
-- These are the "templates" that incoming messages are matched against
--
-- Each behavior can have multiple trigger descriptions, each generating
-- an embedding. This allows rich semantic matching.
-- ============================================================================

CREATE TABLE IF NOT EXISTS behavior_trigger_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    behavior_id VARCHAR(100) NOT NULL, -- References behaviors.ts behavior.id
    trigger_description TEXT NOT NULL, -- Natural language description of trigger
    vector_type VARCHAR(50) NOT NULL, -- Which vector type this applies to
    embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small (1536 dim)
    metadata JSONB DEFAULT '{}', -- Additional context (priority, category, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure no duplicate triggers per behavior
    UNIQUE(behavior_id, trigger_description, vector_type)
);

-- Vector types:
-- - 'user_message': Matches against user's current message
-- - 'agent_message': Matches against agent's previous response
-- - 'combined_exchange': Matches against user+agent conversation pair
-- - 'agent_thought': Matches against agent's internal reasoning
-- - 'external_context': Matches against time/state/event context
-- - 'tool_call': Matches against tool usage patterns

-- HNSW index for fast similarity search (cosine distance)
-- m=16, ef_construction=64 are good defaults for 1536-dim embeddings
CREATE INDEX IF NOT EXISTS idx_behavior_trigger_embeddings_vector 
    ON behavior_trigger_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Index for fast filtering by behavior and vector type
CREATE INDEX IF NOT EXISTS idx_behavior_trigger_embeddings_behavior 
    ON behavior_trigger_embeddings(behavior_id);
CREATE INDEX IF NOT EXISTS idx_behavior_trigger_embeddings_type 
    ON behavior_trigger_embeddings(vector_type);

-- ============================================================================
-- TABLE 2: conversation_embeddings
-- ============================================================================
-- Stores embeddings generated during conversations (user/agent messages, etc.)
-- This table grows over time and captures the semantic history of conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID, -- Optional: group by conversation session
    vector_type VARCHAR(50) NOT NULL, -- Same types as above
    source_text TEXT NOT NULL, -- Original text that was embedded
    embedding vector(1536) NOT NULL,
    behavior_context VARCHAR(100), -- Which behavior was active when generated
    metadata JSONB DEFAULT '{}', -- Additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for similarity search within user's history
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_vector 
    ON conversation_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Composite index for user+time queries (retrieve recent embeddings)
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_user_time 
    ON conversation_embeddings(user_id, created_at DESC);

-- Index for filtering by vector type
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_type 
    ON conversation_embeddings(vector_type);

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_session 
    ON conversation_embeddings(session_id) 
    WHERE session_id IS NOT NULL;

-- ============================================================================
-- TABLE 3: conversation_state
-- ============================================================================
-- Tracks the current state of each user's conversation, including active
-- behavior, message count, and context for persistence logic
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID, -- Optional: track across sessions
    active_behavior_id VARCHAR(100), -- Current behavior
    behavior_started_at TIMESTAMP, -- When behavior was activated
    message_count_in_behavior INTEGER DEFAULT 0, -- Persistence decay tracking
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_user_message TEXT, -- For context in next detection
    last_agent_message TEXT, -- For agent message vector
    recent_tool_calls JSONB DEFAULT '[]', -- Track recent tool usage
    external_context JSONB DEFAULT '{}', -- Current user state (mood, time, etc.)
    metadata JSONB DEFAULT '{}', -- Additional tracking data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One active state per user
    UNIQUE(user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_conversation_state_user 
    ON conversation_state(user_id);

-- Index for session tracking
CREATE INDEX IF NOT EXISTS idx_conversation_state_session 
    ON conversation_state(session_id) 
    WHERE session_id IS NOT NULL;

-- ============================================================================
-- TABLE 4: behavior_detection_logs
-- ============================================================================
-- Logs every behavior detection decision for analytics, debugging, and learning
-- This is crucial for continuous improvement and A/B testing
-- ============================================================================

CREATE TABLE IF NOT EXISTS behavior_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    previous_behavior_id VARCHAR(100),
    detected_behavior_id VARCHAR(100) NOT NULL,
    detection_method VARCHAR(50) NOT NULL, -- 'multi-vector', 'keyword-fallback', etc.
    confidence_score FLOAT, -- Overall confidence (0-1)
    vector_scores JSONB, -- Detailed scores per vector type
    top_candidates JSONB, -- Top 20 candidates considered
    llm_reasoning TEXT, -- LLM's explanation for selection
    user_overrode BOOLEAN DEFAULT FALSE, -- Did user manually switch?
    correct_behavior_id VARCHAR(100), -- If user overrode, what did they choose?
    latency_ms INTEGER, -- End-to-end detection time
    embedding_latency_ms INTEGER, -- Time spent generating embeddings
    search_latency_ms INTEGER, -- Time spent on vector search
    llm_latency_ms INTEGER, -- Time spent on LLM selection
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_behavior_detection_logs_user 
    ON behavior_detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_detection_logs_behavior 
    ON behavior_detection_logs(detected_behavior_id);
CREATE INDEX IF NOT EXISTS idx_behavior_detection_logs_time 
    ON behavior_detection_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_detection_logs_override 
    ON behavior_detection_logs(user_overrode) 
    WHERE user_overrode = TRUE;

-- ============================================================================
-- TABLE 5: behavior_feedback
-- ============================================================================
-- Explicit user feedback on behavior selections
-- Used for supervised learning and trigger refinement
-- ============================================================================

CREATE TABLE IF NOT EXISTS behavior_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    detection_log_id UUID REFERENCES behavior_detection_logs(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    suggested_behavior_id VARCHAR(100) NOT NULL, -- What system suggested
    user_selected_behavior_id VARCHAR(100) NOT NULL, -- What user chose
    feedback_type VARCHAR(50) NOT NULL, -- 'override', 'correction', 'preference'
    user_comment TEXT, -- Optional explanation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for learning pipeline
CREATE INDEX IF NOT EXISTS idx_behavior_feedback_user 
    ON behavior_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_feedback_time 
    ON behavior_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_feedback_log 
    ON behavior_feedback(detection_log_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_behavior_trigger_embeddings_updated_at 
    BEFORE UPDATE ON behavior_trigger_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_state_updated_at 
    BEFORE UPDATE ON conversation_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SIMILARITY SEARCH HELPER FUNCTION
-- ============================================================================
-- Function to search for top K similar behaviors for a given embedding
--
-- Usage:
-- SELECT * FROM search_behavior_triggers(
--     embedding_vector, 
--     'user_message', 
--     5, 
--     0.4
-- );
-- ============================================================================

CREATE OR REPLACE FUNCTION search_behavior_triggers(
    query_embedding vector(1536),
    search_vector_type VARCHAR(50),
    top_k INTEGER DEFAULT 5,
    similarity_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
    behavior_id VARCHAR(100),
    trigger_description TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bte.behavior_id,
        bte.trigger_description,
        1 - (bte.embedding <=> query_embedding) AS similarity,
        bte.metadata
    FROM behavior_trigger_embeddings bte
    WHERE bte.vector_type = search_vector_type
      AND 1 - (bte.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY bte.embedding <=> query_embedding
    LIMIT top_k;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONVERSATION HISTORY SEARCH
-- ============================================================================
-- Find similar past conversations for a user
-- Useful for understanding user patterns and preferences
-- ============================================================================

CREATE OR REPLACE FUNCTION search_user_conversation_history(
    query_embedding vector(1536),
    search_user_id VARCHAR(255),
    search_vector_type VARCHAR(50),
    top_k INTEGER DEFAULT 10,
    days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
    id UUID,
    source_text TEXT,
    similarity FLOAT,
    behavior_context VARCHAR(100),
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.source_text,
        1 - (ce.embedding <=> query_embedding) AS similarity,
        ce.behavior_context,
        ce.created_at
    FROM conversation_embeddings ce
    WHERE ce.user_id = search_user_id
      AND ce.vector_type = search_vector_type
      AND ce.created_at >= CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL
    ORDER BY ce.embedding <=> query_embedding
    LIMIT top_k;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BEHAVIOR ANALYTICS VIEWS
-- ============================================================================

-- View: Behavior usage statistics
CREATE OR REPLACE VIEW behavior_usage_stats AS
SELECT 
    detected_behavior_id,
    COUNT(*) as detection_count,
    AVG(confidence_score) as avg_confidence,
    AVG(latency_ms) as avg_latency_ms,
    SUM(CASE WHEN user_overrode THEN 1 ELSE 0 END) as override_count,
    ROUND(100.0 * SUM(CASE WHEN user_overrode THEN 1 ELSE 0 END) / COUNT(*), 2) as override_rate
FROM behavior_detection_logs
GROUP BY detected_behavior_id
ORDER BY detection_count DESC;

-- View: User behavior preferences
CREATE OR REPLACE VIEW user_behavior_preferences AS
SELECT 
    user_id,
    detected_behavior_id,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence,
    MAX(created_at) as last_used
FROM behavior_detection_logs
WHERE user_overrode = FALSE
GROUP BY user_id, detected_behavior_id
ORDER BY user_id, usage_count DESC;

-- View: Detection performance metrics
CREATE OR REPLACE VIEW detection_performance AS
SELECT 
    DATE(created_at) as date,
    detection_method,
    COUNT(*) as total_detections,
    AVG(latency_ms) as avg_latency,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
    AVG(confidence_score) as avg_confidence,
    SUM(CASE WHEN user_overrode THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as override_rate
FROM behavior_detection_logs
GROUP BY DATE(created_at), detection_method
ORDER BY date DESC, detection_method;

-- ============================================================================
-- DATA RETENTION & CLEANUP
-- ============================================================================
-- Function to clean up old conversation embeddings (retention: 90 days)
-- Run this as a scheduled job (e.g., daily CRON)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_conversation_embeddings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversation_embeddings
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old detection logs (retention: 180 days in main table)
CREATE OR REPLACE FUNCTION archive_old_detection_logs()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- In production, move to archive table instead of deleting
    -- For now, we'll keep this as a placeholder
    DELETE FROM behavior_detection_logs
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '180 days';
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Initial Behavior Trigger Embeddings
-- ============================================================================
-- These are placeholder triggers that should be replaced with actual
-- embeddings generated from behaviors.ts
--
-- In practice, run a script that:
-- 1. Reads each behavior from behaviors.ts
-- 2. Generates natural language trigger descriptions
-- 3. Generates embeddings via OpenAI API
-- 4. Inserts into behavior_trigger_embeddings
--
-- Example structure (embeddings omitted, replace with real vectors):
-- ============================================================================

-- Note: These INSERT statements are templates. Replace array_fill(0, ARRAY[1536])
-- with actual embeddings from OpenAI API

-- Example: difficult-emotion-processing
INSERT INTO behavior_trigger_embeddings 
    (behavior_id, trigger_description, vector_type, embedding, metadata)
VALUES 
    (
        'difficult-emotion-processing',
        'User is expressing acute distress, anxiety, panic, or overwhelming emotions',
        'user_message',
        array_fill(0, ARRAY[1536])::vector, -- REPLACE WITH REAL EMBEDDING
        '{"priority": 10, "category": "emotional_support"}'::jsonb
    ),
    (
        'difficult-emotion-processing',
        'User mentions feeling anxious, overwhelmed, scared, or unable to cope',
        'user_message',
        array_fill(0, ARRAY[1536])::vector, -- REPLACE WITH REAL EMBEDDING
        '{"priority": 10, "category": "emotional_support"}'::jsonb
    ),
    (
        'difficult-emotion-processing',
        'User is in emotional crisis or expressing hopelessness',
        'user_message',
        array_fill(0, ARRAY[1536])::vector, -- REPLACE WITH REAL EMBEDDING
        '{"priority": 10, "category": "crisis"}'::jsonb
    )
ON CONFLICT (behavior_id, trigger_description, vector_type) DO NOTHING;

-- Example: weekly-planning
INSERT INTO behavior_trigger_embeddings 
    (behavior_id, trigger_description, vector_type, embedding, metadata)
VALUES 
    (
        'weekly-planning',
        'User wants to plan their upcoming week or organize their schedule',
        'user_message',
        array_fill(0, ARRAY[1536])::vector, -- REPLACE WITH REAL EMBEDDING
        '{"priority": 7, "category": "planning"}'::jsonb
    ),
    (
        'weekly-planning',
        'It is Sunday evening or Monday morning and user is thinking about the week ahead',
        'external_context',
        array_fill(0, ARRAY[1536])::vector, -- REPLACE WITH REAL EMBEDDING
        '{"priority": 7, "category": "planning", "time_based": true}'::jsonb
    )
ON CONFLICT (behavior_id, trigger_description, vector_type) DO NOTHING;

-- Example: self-compassion-exercise
INSERT INTO behavior_trigger_embeddings 
    (behavior_id, trigger_description, vector_type, embedding, metadata)
VALUES 
    (
        'self-compassion-exercise',
        'User is being harshly self-critical or expressing self-hatred',
        'user_message',
        array_fill(0, ARRAY[1536])::vector, -- REPLACE WITH REAL EMBEDDING
        '{"priority": 9, "category": "self_work"}'::jsonb
    ),
    (
        'self-compassion-exercise',
        'User calls themselves stupid, a failure, or expresses shame',
        'user_message',
        array_fill(0, ARRAY[1536])::vector, -- REPLACE WITH REAL EMBEDDING
        '{"priority": 9, "category": "self_work"}'::jsonb
    )
ON CONFLICT (behavior_id, trigger_description, vector_type) DO NOTHING;

-- Continue for all 13 behaviors...
-- (In practice, generate this via script)

-- ============================================================================
-- MIGRATION CHECKLIST
-- ============================================================================
--
-- [ ] 1. Enable pgvector extension: CREATE EXTENSION vector;
-- [ ] 2. Run this schema file: psql -d your_db -f vector-schema.sql
-- [ ] 3. Verify tables created: \dt in psql
-- [ ] 4. Verify indexes created: \di in psql
-- [ ] 5. Generate real trigger embeddings from behaviors.ts
-- [ ] 6. Insert trigger embeddings into behavior_trigger_embeddings
-- [ ] 7. Test similarity search: SELECT * FROM search_behavior_triggers(...)
-- [ ] 8. Set up cleanup CRON jobs for data retention
-- [ ] 9. Monitor query performance and adjust HNSW parameters if needed
-- [ ] 10. Set up monitoring for table sizes and query latencies
--
-- ============================================================================

-- ============================================================================
-- PERFORMANCE TUNING NOTES
-- ============================================================================
--
-- HNSW Index Parameters:
-- - m: Number of connections per layer (default 16, range 4-64)
--   Higher = better recall, slower build, more memory
-- - ef_construction: Size of candidate list during index build (default 64)
--   Higher = better recall, slower build
--
-- Query-time parameter:
-- - ef_search: Size of candidate list during search (default 40)
--   SET LOCAL hnsw.ef_search = 100; -- For more accurate search
--
-- If searches are too slow:
-- - Reduce vector dimensions (requires re-embedding)
-- - Lower m and ef_construction (tradeoff: accuracy)
-- - Add WHERE filters to reduce search space
--
-- If searches are inaccurate:
-- - Increase ef_search at query time
-- - Increase m and ef_construction and rebuild index
-- - Check data quality and embedding model
--
-- ============================================================================

-- End of schema
