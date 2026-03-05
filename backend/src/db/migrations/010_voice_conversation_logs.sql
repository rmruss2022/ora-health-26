-- Migration 010: Voice Conversation Logs
-- Stores transcript of ElevenLabs voice agent conversations for analysis

CREATE TABLE IF NOT EXISTS voice_conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  agent_id VARCHAR(100),
  message_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_logs_user_id ON voice_conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_session_id ON voice_conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_created_at ON voice_conversation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_session ON voice_conversation_logs(user_id, session_id);
