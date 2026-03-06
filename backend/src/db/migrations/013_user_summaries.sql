-- Migration 013: User Summaries
-- Stores AI-generated insights about the user (personality, goals, patterns, preferences)

CREATE TABLE IF NOT EXISTS user_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary_type VARCHAR(50) NOT NULL,
  summary_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, summary_type)
);

CREATE INDEX IF NOT EXISTS idx_user_summaries_user_id ON user_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_summaries_type ON user_summaries(summary_type);
