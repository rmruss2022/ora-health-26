-- Migration 006: pgvector Extension and Vector Storage Tables
-- Enables multi-vector embedding system for intelligent behavior detection
-- Requires: PostgreSQL with pgvector extension (postgres:16-alpine replaced with pgvector/pgvector:pg16)

-- ============================================================================
-- STEP 1: Enable pgvector Extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: behavior_trigger_embeddings
-- ============================================================================
-- Stores pre-computed embeddings for each behavior's trigger descriptions
-- These are the "templates" that incoming messages are matched against

CREATE TABLE IF NOT EXISTS behavior_trigger_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    behavior_id VARCHAR(100) NOT NULL,
    trigger_description TEXT NOT NULL,
    vector_type VARCHAR(50) NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(behavior_id, trigger_description, vector_type)
);

-- HNSW index for fast similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_behavior_trigger_embeddings_vector 
    ON behavior_trigger_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_behavior_trigger_embeddings_behavior 
    ON behavior_trigger_embeddings(behavior_id);
CREATE INDEX IF NOT EXISTS idx_behavior_trigger_embeddings_type 
    ON behavior_trigger_embeddings(vector_type);

-- ============================================================================
-- STEP 3: conversation_embeddings
-- ============================================================================
-- Stores embeddings generated during conversations

CREATE TABLE IF NOT EXISTS conversation_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    vector_type VARCHAR(50) NOT NULL,
    source_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    behavior_context VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_vector 
    ON conversation_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_user_time 
    ON conversation_embeddings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_type 
    ON conversation_embeddings(vector_type);
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_session 
    ON conversation_embeddings(session_id) 
    WHERE session_id IS NOT NULL;

-- ============================================================================
-- STEP 4: conversation_state
-- ============================================================================
-- Tracks current conversation state for each user

CREATE TABLE IF NOT EXISTS conversation_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    active_behavior_id VARCHAR(100),
    behavior_started_at TIMESTAMP,
    message_count_in_behavior INTEGER DEFAULT 0,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_user_message TEXT,
    last_agent_message TEXT,
    recent_tool_calls JSONB DEFAULT '[]',
    external_context JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_state_user 
    ON conversation_state(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_state_session 
    ON conversation_state(session_id) 
    WHERE session_id IS NOT NULL;

-- ============================================================================
-- STEP 5: behavior_detection_logs
-- ============================================================================
-- Logs every behavior detection decision for analytics and debugging

CREATE TABLE IF NOT EXISTS behavior_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    previous_behavior_id VARCHAR(100),
    detected_behavior_id VARCHAR(100) NOT NULL,
    detection_method VARCHAR(50) NOT NULL,
    confidence_score FLOAT,
    vector_scores JSONB,
    top_candidates JSONB,
    llm_reasoning TEXT,
    user_overrode BOOLEAN DEFAULT FALSE,
    correct_behavior_id VARCHAR(100),
    latency_ms INTEGER,
    embedding_latency_ms INTEGER,
    search_latency_ms INTEGER,
    llm_latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

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
-- STEP 6: behavior_feedback
-- ============================================================================
-- Explicit user feedback for supervised learning

CREATE TABLE IF NOT EXISTS behavior_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    detection_log_id UUID REFERENCES behavior_detection_logs(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    suggested_behavior_id VARCHAR(100) NOT NULL,
    user_selected_behavior_id VARCHAR(100) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL,
    user_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_behavior_feedback_user 
    ON behavior_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_feedback_time 
    ON behavior_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_feedback_log 
    ON behavior_feedback(detection_log_id);

-- ============================================================================
-- STEP 7: Update Triggers
-- ============================================================================

CREATE TRIGGER update_behavior_trigger_embeddings_updated_at 
    BEFORE UPDATE ON behavior_trigger_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_state_updated_at 
    BEFORE UPDATE ON conversation_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Helper Functions
-- ============================================================================

-- Function to search for top K similar behaviors
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

-- Function to search user conversation history
CREATE OR REPLACE FUNCTION search_user_conversation_history(
    query_embedding vector(1536),
    search_user_id UUID,
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
-- STEP 9: Analytics Views
-- ============================================================================

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
-- MIGRATION COMPLETE
-- ============================================================================
