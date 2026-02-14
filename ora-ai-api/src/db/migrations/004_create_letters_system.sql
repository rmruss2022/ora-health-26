-- Migration 004: Letters System
-- Adds a daily inbox feature where users receive and send personal letters
-- Think of it like a private, intimate messaging system with an "envelope" metaphor

-- ==========================================
-- 1. LETTERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_category VARCHAR(50),
  metadata JSONB,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  is_starred BOOLEAN DEFAULT FALSE,
  parent_letter_id UUID REFERENCES letters(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for letters
CREATE INDEX IF NOT EXISTS idx_letters_recipient ON letters(recipient_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_sender ON letters(sender_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_unread ON letters(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_letters_archived ON letters(recipient_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_letters_starred ON letters(recipient_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_letters_parent ON letters(parent_letter_id);
CREATE INDEX IF NOT EXISTS idx_letters_ai_category ON letters(ai_category) WHERE is_ai_generated = true;

-- ==========================================
-- 2. LETTER THREADS TABLE
-- ==========================================
-- For organizing letters into conversation threads
CREATE TABLE IF NOT EXISTS letter_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  thread_root_id UUID NOT NULL,
  thread_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(letter_id)
);

-- Indexes for threads
CREATE INDEX IF NOT EXISTS idx_letter_threads_root ON letter_threads(thread_root_id, thread_position);
CREATE INDEX IF NOT EXISTS idx_letter_threads_letter ON letter_threads(letter_id);

-- ==========================================
-- 3. LETTER TEMPLATES TABLE
-- ==========================================
-- Templates for AI-generated letters
CREATE TABLE IF NOT EXISTS letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  variables JSONB,
  tone VARCHAR(50) DEFAULT 'warm',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_letter_templates_category ON letter_templates(category, is_active);
CREATE INDEX IF NOT EXISTS idx_letter_templates_priority ON letter_templates(priority DESC);

-- ==========================================
-- 4. USER LETTER PREFERENCES TABLE
-- ==========================================
-- Store user preferences for letter delivery
CREATE TABLE IF NOT EXISTS user_letter_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_letter_enabled BOOLEAN DEFAULT TRUE,
  preferred_delivery_time TIME DEFAULT '08:00:00',
  preferred_categories TEXT[],
  max_daily_letters INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Index for preferences
CREATE INDEX IF NOT EXISTS idx_letter_preferences_user ON user_letter_preferences(user_id);

-- ==========================================
-- 5. SEED LETTER TEMPLATES
-- ==========================================
-- Motivational and encouragement templates
INSERT INTO letter_templates (category, subcategory, subject_template, body_template, variables, tone, priority) VALUES
  (
    'motivation',
    'morning',
    'Good morning! A new day awaits ☀️',
    E'Dear {{user_name}},\n\nEvery morning brings new opportunities and fresh beginnings. Today is your chance to move one step closer to your goals.\n\n{{personalized_insight}}\n\nRemember: progress, not perfection. You''ve got this!\n\nWith encouragement,\nYour Ora Companion',
    '{"required": ["user_name"], "optional": ["personalized_insight", "recent_achievement"]}',
    'warm',
    10
  ),
  (
    'motivation',
    'evening',
    'Evening Reflection 🌙',
    E'Dear {{user_name}},\n\nAs the day winds down, take a moment to acknowledge all you''ve accomplished - both big and small.\n\n{{personalized_reflection}}\n\nRest well tonight. Tomorrow is another opportunity to shine.\n\nWarmly,\nYour Ora Companion',
    '{"required": ["user_name"], "optional": ["personalized_reflection", "day_summary"]}',
    'calm',
    8
  ),
  (
    'encouragement',
    'tough_day',
    'You''re stronger than you think 💪',
    E'Dear {{user_name}},\n\nSome days are harder than others, and that''s completely okay. What matters is that you''re still here, still trying, still growing.\n\n{{supportive_message}}\n\nBe gentle with yourself today. You deserve compassion, especially from yourself.\n\nWith care,\nYour Ora Companion',
    '{"required": ["user_name"], "optional": ["supportive_message", "coping_suggestion"]}',
    'compassionate',
    9
  ),
  (
    'celebration',
    'milestone',
    '🎉 Celebrating Your Progress!',
    E'Dear {{user_name}},\n\nLook how far you''ve come! {{achievement_description}}\n\nThis milestone is worth celebrating. Take a moment to feel proud of yourself - you''ve earned it.\n\nKeep going - we''re cheering you on!\n\nProudly,\nYour Ora Companion',
    '{"required": ["user_name", "achievement_description"], "optional": ["days_count", "streak_info"]}',
    'celebratory',
    7
  ),
  (
    'mindfulness',
    'reminder',
    'A Moment of Presence 🧘',
    E'Dear {{user_name}},\n\nIn the midst of a busy day, here''s a gentle reminder to pause and breathe.\n\nTake three deep breaths right now. Notice how your body feels. This moment is yours.\n\n{{mindfulness_prompt}}\n\nPeace,\nYour Ora Companion',
    '{"required": ["user_name"], "optional": ["mindfulness_prompt", "breathing_exercise"]}',
    'peaceful',
    6
  ),
  (
    'gratitude',
    'daily',
    'Today''s Gratitude Moment 💛',
    E'Dear {{user_name}},\n\nGratitude has the power to shift our entire perspective. Today, what are you thankful for?\n\n{{gratitude_prompt}}\n\nEven the smallest things count. A warm cup of tea, a kind word, a moment of peace.\n\nWith appreciation,\nYour Ora Companion',
    '{"required": ["user_name"], "optional": ["gratitude_prompt", "suggested_gratitude"]}',
    'warm',
    5
  ),
  (
    'connection',
    'community',
    'You''re Not Alone 🤝',
    E'Dear {{user_name}},\n\nJourneys like yours are shared by many. You''re part of a community that understands, supports, and celebrates with you.\n\n{{community_highlight}}\n\nConsider sharing your story or reaching out to others. Connection heals.\n\nWith community,\nYour Ora Companion',
    '{"required": ["user_name"], "optional": ["community_highlight", "suggested_action"]}',
    'supportive',
    4
  ),
  (
    'insight',
    'personal_growth',
    'Growth Insight 🌱',
    E'Dear {{user_name}},\n\nBased on your journey so far, here''s something to consider:\n\n{{personal_insight}}\n\nGrowth isn''t always linear, but every experience teaches us something valuable.\n\nThoughtfully,\nYour Ora Companion',
    '{"required": ["user_name", "personal_insight"], "optional": ["pattern_observed", "suggestion"]}',
    'thoughtful',
    6
  )
ON CONFLICT DO NOTHING;

-- ==========================================
-- 6. CREATE DEFAULT PREFERENCES FOR EXISTING USERS
-- ==========================================
-- Give all existing users default letter preferences
INSERT INTO user_letter_preferences (user_id, daily_letter_enabled, preferred_delivery_time)
SELECT id, true, '08:00:00'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_letter_preferences WHERE user_letter_preferences.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
