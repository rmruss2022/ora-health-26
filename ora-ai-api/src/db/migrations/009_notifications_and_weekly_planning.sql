-- Migration 009: Notifications & Weekly Planning System
-- Push notification infrastructure and weekly planning/review tables

-- User Push Tokens Table
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = true;

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  letter_notifications_enabled BOOLEAN DEFAULT true,
  community_notifications_enabled BOOLEAN DEFAULT true,
  reminder_notifications_enabled BOOLEAN DEFAULT true,
  weekly_planning_enabled BOOLEAN DEFAULT true,
  weekly_review_enabled BOOLEAN DEFAULT true,
  weekly_planning_day VARCHAR(10) DEFAULT 'sunday', -- day of week
  weekly_planning_time TIME DEFAULT '09:00:00', -- optimal time for planning prompt
  weekly_review_day VARCHAR(10) DEFAULT 'sunday', -- day of week
  weekly_review_time TIME DEFAULT '18:00:00', -- optimal time for review prompt
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON user_notification_preferences(user_id);

-- Weekly Plans Table
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Monday of the week
  intentions TEXT NOT NULL,
  ai_prompt TEXT, -- The AI prompt that was used
  ai_response TEXT, -- AI's response/encouragement
  goals JSONB, -- Structured goals if any
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week_start ON weekly_plans(week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week ON weekly_plans(user_id, week_start_date);

-- Weekly Reviews Table
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_plan_id UUID REFERENCES weekly_plans(id) ON DELETE SET NULL,
  week_start_date DATE NOT NULL,
  reflection TEXT NOT NULL,
  learnings TEXT, -- What they learned
  wins TEXT, -- What went well
  challenges TEXT, -- What was challenging
  ai_analysis TEXT, -- AI's analysis comparing plan vs reality
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_id ON weekly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_week_start ON weekly_reviews(week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_plan_id ON weekly_reviews(weekly_plan_id);

-- Push Notification Logs Table
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100), -- 'weekly_planning', 'weekly_review', 'letter', etc.
  title TEXT,
  body TEXT,
  data JSONB,
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'error', 'delivered'
  error_message TEXT,
  error_details JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_sent_at ON push_notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_logs_type ON push_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_logs_status ON push_notification_logs(status);

-- Agent Memory/Context Table
-- Stores AI agent's memory of user data for personalized prompts
CREATE TABLE IF NOT EXISTS agent_memory_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type VARCHAR(100) NOT NULL, -- 'meditation_history', 'mood_patterns', 'community_activity', etc.
  context_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id ON agent_memory_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory_cache(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_expires ON agent_memory_cache(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger to update updated_at on user_push_tokens
CREATE TRIGGER update_user_push_tokens_updated_at 
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on user_notification_preferences
CREATE TRIGGER update_notification_prefs_updated_at 
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on weekly_plans
CREATE TRIGGER update_weekly_plans_updated_at 
  BEFORE UPDATE ON weekly_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on weekly_reviews
CREATE TRIGGER update_weekly_reviews_updated_at 
  BEFORE UPDATE ON weekly_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on agent_memory_cache
CREATE TRIGGER update_agent_memory_cache_updated_at 
  BEFORE UPDATE ON agent_memory_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_notification_preferences 
  WHERE user_notification_preferences.user_id = users.id
);
