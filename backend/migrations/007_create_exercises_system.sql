-- Guided Exercises System Schema

-- Exercise types table
CREATE TABLE IF NOT EXISTS exercise_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type_id UUID REFERENCES exercise_types(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced
  content JSONB NOT NULL, -- Steps, prompts, guidance
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise completions table
CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  notes TEXT,
  mood_before VARCHAR(50),
  mood_after VARCHAR(50),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorite exercises
CREATE TABLE IF NOT EXISTS user_favorite_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Weekly plans table
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  reflections JSONB, -- Past week reflections
  intentions TEXT[],
  focus_areas TEXT[],
  goals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Weekly reviews table
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_plan_id UUID REFERENCES weekly_plans(id) ON DELETE SET NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  intention_ratings JSONB, -- { "intention_text": rating }
  wins TEXT[],
  challenges TEXT[],
  learnings TEXT[],
  gratitude TEXT,
  shared_to_community BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_exercise_completions_user ON exercise_completions(user_id);
CREATE INDEX idx_exercise_completions_exercise ON exercise_completions(exercise_id);
CREATE INDEX idx_exercise_completions_date ON exercise_completions(completed_at);
CREATE INDEX idx_exercises_type ON exercises(type_id);
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);
CREATE INDEX idx_weekly_plans_user_date ON weekly_plans(user_id, week_start_date);
CREATE INDEX idx_weekly_reviews_user_date ON weekly_reviews(user_id, week_start_date);

-- Insert default exercise types
INSERT INTO exercise_types (name, description, icon) VALUES
  ('morning-intention', 'Start your day with intention', '🌅'),
  ('evening-gratitude', 'End your day with gratitude', '🌙'),
  ('breathwork', 'Breathing exercises for calm and focus', '🫁'),
  ('body-scan', 'Mindful body awareness', '✨'),
  ('loving-kindness', 'Cultivate compassion', '💚'),
  ('weekly-planning', 'Plan your week ahead', '📅'),
  ('weekly-review', 'Reflect on your week', '🔍')
ON CONFLICT (name) DO NOTHING;

-- Insert default exercises
INSERT INTO exercises (title, description, type_id, duration_minutes, difficulty, content, tags)
SELECT 
  'Morning Intention Setting',
  'Set a clear intention for your day ahead',
  (SELECT id FROM exercise_types WHERE name = 'morning-intention'),
  3,
  'beginner',
  '{
    "steps": [
      {
        "title": "Ground Yourself",
        "prompt": "Take three deep breaths. Notice how you feel right now.",
        "duration": 30
      },
      {
        "title": "Reflect",
        "prompt": "What energy do you want to bring to today?",
        "duration": 60
      },
      {
        "title": "Set Intention",
        "prompt": "Choose one word or phrase to guide your day.",
        "duration": 60
      },
      {
        "title": "Visualize",
        "prompt": "Imagine yourself moving through the day with this intention.",
        "duration": 30
      }
    ]
  }'::jsonb,
  ARRAY['morning', 'intention', 'mindfulness']
ON CONFLICT DO NOTHING;

INSERT INTO exercises (title, description, type_id, duration_minutes, difficulty, content, tags)
SELECT 
  'Evening Gratitude Practice',
  'Reflect on the gifts of your day',
  (SELECT id FROM exercise_types WHERE name = 'evening-gratitude'),
  3,
  'beginner',
  '{
    "steps": [
      {
        "title": "Settle In",
        "prompt": "Take a comfortable seat. Let your day begin to wind down.",
        "duration": 30
      },
      {
        "title": "Three Good Things",
        "prompt": "Name three things that went well today, no matter how small.",
        "duration": 90
      },
      {
        "title": "Feel Gratitude",
        "prompt": "Let the feeling of gratitude wash over you.",
        "duration": 60
      }
    ]
  }'::jsonb,
  ARRAY['evening', 'gratitude', 'reflection']
ON CONFLICT DO NOTHING;

INSERT INTO exercises (title, description, type_id, duration_minutes, difficulty, content, tags)
SELECT 
  '4-7-8 Breathing',
  'Calm your nervous system with rhythmic breathing',
  (SELECT id FROM exercise_types WHERE name = 'breathwork'),
  5,
  'beginner',
  '{
    "steps": [
      {
        "title": "Prepare",
        "prompt": "Sit comfortably with your back straight. Place the tip of your tongue behind your upper front teeth.",
        "duration": 20
      },
      {
        "title": "Exhale Completely",
        "prompt": "Exhale completely through your mouth, making a whoosh sound.",
        "duration": 10
      },
      {
        "title": "Breathe In (4)",
        "prompt": "Close your mouth and inhale quietly through your nose for 4 counts.",
        "duration": 4
      },
      {
        "title": "Hold (7)",
        "prompt": "Hold your breath for 7 counts.",
        "duration": 7
      },
      {
        "title": "Exhale (8)",
        "prompt": "Exhale completely through your mouth for 8 counts.",
        "duration": 8
      },
      {
        "title": "Repeat",
        "prompt": "Continue this cycle for 4 rounds. Notice how you feel.",
        "duration": 240
      }
    ]
  }'::jsonb,
  ARRAY['breathwork', 'anxiety-relief', 'calm']
ON CONFLICT DO NOTHING;

INSERT INTO exercises (title, description, type_id, duration_minutes, difficulty, content, tags)
SELECT 
  'Body Scan Meditation',
  'Release tension through mindful body awareness',
  (SELECT id FROM exercise_types WHERE name = 'body-scan'),
  10,
  'intermediate',
  '{
    "steps": [
      {
        "title": "Settle",
        "prompt": "Lie down or sit comfortably. Close your eyes gently.",
        "duration": 30
      },
      {
        "title": "Feet",
        "prompt": "Bring awareness to your feet. Notice any sensations without judgment.",
        "duration": 60
      },
      {
        "title": "Legs",
        "prompt": "Move your attention up through your legs, observing any tension or ease.",
        "duration": 60
      },
      {
        "title": "Torso",
        "prompt": "Scan through your belly, chest, and back. Breathe into any tightness.",
        "duration": 90
      },
      {
        "title": "Arms & Hands",
        "prompt": "Notice your arms, hands, and fingers. Let them relax.",
        "duration": 60
      },
      {
        "title": "Neck & Head",
        "prompt": "Bring awareness to your neck, jaw, face, and scalp.",
        "duration": 60
      },
      {
        "title": "Whole Body",
        "prompt": "Feel your entire body as one. Rest here for a few moments.",
        "duration": 120
      }
    ]
  }'::jsonb,
  ARRAY['body-scan', 'relaxation', 'mindfulness']
ON CONFLICT DO NOTHING;

INSERT INTO exercises (title, description, type_id, duration_minutes, difficulty, content, tags)
SELECT 
  'Loving-Kindness Meditation',
  'Cultivate compassion for yourself and others',
  (SELECT id FROM exercise_types WHERE name = 'loving-kindness'),
  10,
  'beginner',
  '{
    "steps": [
      {
        "title": "Center Yourself",
        "prompt": "Sit comfortably. Place a hand on your heart if that feels right.",
        "duration": 30
      },
      {
        "title": "For Yourself",
        "prompt": "Silently repeat: May I be happy. May I be healthy. May I be safe. May I live with ease.",
        "duration": 120
      },
      {
        "title": "For Someone You Love",
        "prompt": "Bring to mind someone you love. Offer them the same wishes.",
        "duration": 120
      },
      {
        "title": "For Someone Neutral",
        "prompt": "Think of someone neutral—a stranger you saw today. Extend the wishes to them.",
        "duration": 90
      },
      {
        "title": "For Someone Difficult",
        "prompt": "If you feel ready, think of someone difficult. Offer them compassion.",
        "duration": 90
      },
      {
        "title": "For All Beings",
        "prompt": "Expand your heart to all beings everywhere. May all beings be happy.",
        "duration": 90
      }
    ]
  }'::jsonb,
  ARRAY['loving-kindness', 'compassion', 'heart']
ON CONFLICT DO NOTHING;

-- Triggers for updated_at (function already exists from previous migrations)
DROP TRIGGER IF EXISTS update_exercises_updated_at ON exercises;
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_plans_updated_at ON weekly_plans;
CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON weekly_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_reviews_updated_at ON weekly_reviews;
CREATE TRIGGER update_weekly_reviews_updated_at BEFORE UPDATE ON weekly_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Exercises system schema created successfully!' as status;
