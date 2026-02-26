-- Community Letters & AI Agent Interaction System
-- Extends the existing community_posts table with AI agent capabilities

-- Add category field if it doesn't exist (for filtering)
-- Skip if we don't have permission
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' AND column_name = 'category'
  ) THEN
    BEGIN
      ALTER TABLE community_posts ADD COLUMN category VARCHAR(50);
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping category column addition - table already exists or no permission';
    END;
  END IF;
END $$;

-- Create AI agents table for tracking agent personalities
CREATE TABLE IF NOT EXISTS ai_agents (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  traits TEXT[] NOT NULL,
  specialties TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert agent personalities
INSERT INTO ai_agents (id, name, avatar, role, traits, specialties) VALUES
  ('luna', 'Luna', '🌙', 'The Gentle Guide', 
   ARRAY['empathetic', 'nurturing', 'calming', 'patient'],
   ARRAY['sleep', 'anxiety relief', 'self-compassion', 'evening practices']),
  ('kai', 'Kai', '🔥', 'The Motivator', 
   ARRAY['enthusiastic', 'energetic', 'encouraging', 'dynamic'],
   ARRAY['morning practices', 'motivation', 'breaking through plateaus', 'building streaks']),
  ('sage', 'Sage', '🦉', 'The Wise Teacher', 
   ARRAY['thoughtful', 'insightful', 'philosophical', 'grounded'],
   ARRAY['mindfulness', 'meditation insights', 'reflection prompts', 'pattern recognition']),
  ('river', 'River', '🌊', 'The Playful Spirit', 
   ARRAY['lighthearted', 'curious', 'spontaneous', 'creative'],
   ARRAY['breathwork', 'creative practices', 'joy cultivation', 'experimentation']),
  ('sol', 'Sol', '☀️', 'The Compassionate Cheerleader', 
   ARRAY['warm', 'supportive', 'validating', 'kind'],
   ARRAY['self-compassion', 'emotional support', 'validation', 'loving-kindness'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  avatar = EXCLUDED.avatar,
  role = EXCLUDED.role,
  traits = EXCLUDED.traits,
  specialties = EXCLUDED.specialties;

-- Add agent_id to community_posts to track which posts are from AI agents
DO $$
BEGIN
  BEGIN
    ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50);
    ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_agent_post BOOLEAN DEFAULT false;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping community_posts columns - no permission or already exists';
  END;
END $$;

-- Add agent_id to post_comments to track AI agent comments
DO $$
BEGIN
  BEGIN
    ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS agent_id VARCHAR(50);
    ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS is_agent_comment BOOLEAN DEFAULT false;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping post_comments columns - no permission or already exists';
  END;
END $$;

-- Create table for tracking agent interactions with users
CREATE TABLE IF NOT EXISTS agent_user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(50) NOT NULL REFERENCES ai_agents(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'reaction', 'encouragement'
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT,
  metadata JSONB, -- Store any additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for agent_user_interactions
CREATE INDEX IF NOT EXISTS idx_agent_user ON agent_user_interactions(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions ON agent_user_interactions(user_id, created_at DESC);

-- Create table for user meditation history (for AI context)
CREATE TABLE IF NOT EXISTS user_meditation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meditation_id UUID REFERENCES meditations(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mood_before VARCHAR(50),
  mood_after VARCHAR(50),
  notes TEXT
);

-- Create index for user_meditation_history
CREATE INDEX IF NOT EXISTS idx_user_history ON user_meditation_history(user_id, completed_at DESC);

-- Create table for user mood patterns (for AI personalization)
CREATE TABLE IF NOT EXISTS user_mood_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood VARCHAR(50) NOT NULL,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  notes TEXT,
  tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_mood_tracking
CREATE INDEX IF NOT EXISTS idx_user_mood ON user_mood_tracking(user_id, tracked_at DESC);

-- Create categories for letters/posts if not exists
CREATE TABLE IF NOT EXISTS post_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO post_categories (id, name, description, icon, color, display_order) VALUES
  ('meditation', 'Meditation', 'Share your meditation journey', '🧘', '#7C3AED', 1),
  ('reflection', 'Reflection', 'Deep thoughts and insights', '💭', '#6366F1', 2),
  ('growth', 'Growth', 'Personal growth milestones', '🌱', '#16A34A', 3),
  ('wellness', 'Wellness', 'Health and well-being', '💚', '#0D9488', 4),
  ('support', 'Support', 'Community support and encouragement', '🤝', '#DB2777', 5),
  ('gratitude', 'Gratitude', 'Gratitude and appreciation', '🙏', '#2563EB', 6),
  ('prompt', 'Prompt Response', 'Responses to community prompts', '✨', '#D946EF', 7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- Create table for weekly prompts that AI agents can post
CREATE TABLE IF NOT EXISTS community_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  category VARCHAR(50) REFERENCES post_categories(id),
  agent_id VARCHAR(50) REFERENCES ai_agents(id),
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some starter prompts
INSERT INTO community_prompts (prompt_text, category, agent_id, is_active) VALUES
  ('What small habit has made a big impact on your well-being this week?', 'reflection', 'sage', true),
  ('Share a moment today when you felt truly present.', 'meditation', 'luna', true),
  ('What are you grateful for right now, in this moment?', 'gratitude', 'sol', true),
  ('What energizes you in the morning?', 'wellness', 'kai', true),
  ('Describe your breathing in three words.', 'wellness', 'river', true);

-- Grant permissions
GRANT ALL ON ai_agents TO PUBLIC;
GRANT ALL ON agent_user_interactions TO PUBLIC;
GRANT ALL ON user_meditation_history TO PUBLIC;
GRANT ALL ON user_mood_tracking TO PUBLIC;
GRANT ALL ON post_categories TO PUBLIC;
GRANT ALL ON community_prompts TO PUBLIC;
