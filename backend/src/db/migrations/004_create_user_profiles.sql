-- Migration 004: Create User Profiles Table
-- Stores user quiz responses and personalization settings

-- ==========================================
-- 1. USER PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Quiz Data (stored as JSONB for flexibility)
  quiz_responses JSONB,
  quiz_version VARCHAR(10) DEFAULT '1.0',
  quiz_completed_at TIMESTAMPTZ,
  quiz_started_at TIMESTAMPTZ,
  
  -- Derived Personalization Settings
  suggested_behaviors TEXT[],
  notification_frequency VARCHAR(50),
  preferred_check_in_time VARCHAR(50),
  content_difficulty_level INTEGER DEFAULT 5,
  
  -- Additional Profile Fields
  primary_goals TEXT[],
  focus_area VARCHAR(100),
  reflection_styles TEXT[],
  motivation_drivers TEXT[],
  stress_baseline INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revision_count INTEGER DEFAULT 0
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_quiz_completed_at ON user_profiles(quiz_completed_at DESC);

-- GIN index for JSONB quiz_responses (for querying inside JSON)
CREATE INDEX IF NOT EXISTS idx_user_profiles_quiz_responses ON user_profiles USING GIN (quiz_responses);

-- Trigger to update updated_at on user_profiles table
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 2. HELPER FUNCTIONS
-- ==========================================

-- Function to get user profile with user details
CREATE OR REPLACE FUNCTION get_user_profile_with_details(p_user_id UUID)
RETURNS TABLE (
  profile_id UUID,
  user_id UUID,
  email VARCHAR,
  name VARCHAR,
  avatar_url TEXT,
  quiz_responses JSONB,
  quiz_completed_at TIMESTAMPTZ,
  suggested_behaviors TEXT[],
  notification_frequency VARCHAR,
  preferred_check_in_time VARCHAR,
  content_difficulty_level INTEGER,
  primary_goals TEXT[],
  focus_area VARCHAR,
  profile_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id AS profile_id,
    u.id AS user_id,
    u.email,
    u.name,
    u.avatar_url,
    up.quiz_responses,
    up.quiz_completed_at,
    up.suggested_behaviors,
    up.notification_frequency,
    up.preferred_check_in_time,
    up.content_difficulty_level,
    up.primary_goals,
    up.focus_area,
    up.created_at AS profile_created_at
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  WHERE u.id = p_user_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
