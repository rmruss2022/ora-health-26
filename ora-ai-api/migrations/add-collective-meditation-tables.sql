-- Collective Meditation Tables
-- Created: 2026-02-24

-- Collective sessions (scheduled meditation times)
CREATE TABLE IF NOT EXISTS collective_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  participant_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants (who joined each session)
CREATE TABLE IF NOT EXISTS collective_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collective_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  post_session_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Daily reflection prompts
CREATE TABLE IF NOT EXISTS daily_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  question TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User reflection responses
CREATE TABLE IF NOT EXISTS reflection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES daily_prompts(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collective_sessions_scheduled ON collective_sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_collective_sessions_active ON collective_sessions(started_at, ended_at) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_collective_participants_session ON collective_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_collective_participants_user ON collective_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_date ON daily_prompts(date);
CREATE INDEX IF NOT EXISTS idx_reflection_responses_user ON reflection_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_responses_prompt ON reflection_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_reflection_responses_public ON reflection_responses(is_public) WHERE is_public = true;
