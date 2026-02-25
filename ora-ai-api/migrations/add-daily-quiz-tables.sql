-- Daily Check-in Quiz Tables
-- Created: 2026-02-25
-- Purpose: Daily wellness quiz for mood, energy, and intention tracking

-- Quiz templates (reusable question sets)
CREATE TABLE IF NOT EXISTS quiz_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  question_set JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily quiz instances (generated each day)
CREATE TABLE IF NOT EXISTS daily_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date DATE UNIQUE NOT NULL,
  template_id UUID REFERENCES quiz_templates(id) ON DELETE SET NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User quiz responses
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES daily_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  mood_score INTEGER,
  energy_score INTEGER,
  intentions TEXT[],
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quiz_id)
);

-- Quiz completion streaks
CREATE TABLE IF NOT EXISTS quiz_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  total_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz insights (AI-generated insights based on responses)
CREATE TABLE IF NOT EXISTS quiz_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_response_id UUID REFERENCES quiz_responses(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  insight_type TEXT, -- 'mood', 'energy', 'pattern', 'recommendation'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_quizzes_date ON daily_quizzes(quiz_date);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user ON quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz ON quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_completed ON quiz_responses(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_streaks_user ON quiz_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_insights_user ON quiz_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_insights_response ON quiz_insights(quiz_response_id);

-- Insert default quiz template
INSERT INTO quiz_templates (name, description, question_set, is_active)
VALUES (
  'Daily Check-in',
  'Standard daily wellness check-in',
  '{
    "questions": [
      {
        "id": "mood",
        "type": "scale",
        "question": "How are you feeling right now?",
        "scale": {"min": 1, "max": 5, "labels": ["Struggling", "Low", "Okay", "Good", "Great"]},
        "emoji": ["😞", "😕", "😐", "🙂", "😊"]
      },
      {
        "id": "energy",
        "type": "scale",
        "question": "What''s your energy level?",
        "scale": {"min": 1, "max": 5, "labels": ["Exhausted", "Tired", "Moderate", "Energized", "Vibrant"]},
        "emoji": ["🪫", "😴", "😌", "⚡", "🔋"]
      },
      {
        "id": "sleep",
        "type": "scale",
        "question": "How did you sleep last night?",
        "scale": {"min": 1, "max": 5, "labels": ["Terrible", "Poor", "Fair", "Good", "Excellent"]},
        "emoji": ["😫", "😓", "😐", "😊", "🌟"]
      },
      {
        "id": "stress",
        "type": "scale",
        "question": "What''s your stress level?",
        "scale": {"min": 1, "max": 5, "labels": ["None", "Low", "Moderate", "High", "Overwhelming"]},
        "emoji": ["😌", "🙂", "😐", "😰", "😱"]
      },
      {
        "id": "intention",
        "type": "multiple_choice",
        "question": "What''s your intention for today?",
        "options": [
          {"value": "peace", "label": "Find Peace", "emoji": "🕊️"},
          {"value": "productivity", "label": "Be Productive", "emoji": "✅"},
          {"value": "connection", "label": "Connect with Others", "emoji": "💛"},
          {"value": "growth", "label": "Personal Growth", "emoji": "🌱"},
          {"value": "rest", "label": "Rest & Recharge", "emoji": "🌙"},
          {"value": "joy", "label": "Seek Joy", "emoji": "✨"}
        ],
        "multiple": true,
        "maxSelections": 3
      },
      {
        "id": "gratitude",
        "type": "text",
        "question": "What are you grateful for today?",
        "placeholder": "Share what brings you gratitude...",
        "optional": true
      }
    ]
  }'::jsonb,
  true
);

COMMENT ON TABLE quiz_templates IS 'Reusable quiz question templates';
COMMENT ON TABLE daily_quizzes IS 'Daily quiz instances generated from templates';
COMMENT ON TABLE quiz_responses IS 'User responses to daily quizzes';
COMMENT ON TABLE quiz_streaks IS 'User streak tracking for quiz completion';
COMMENT ON TABLE quiz_insights IS 'AI-generated insights from quiz responses';
