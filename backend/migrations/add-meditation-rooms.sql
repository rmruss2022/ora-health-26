-- Meditation Rooms Schema
-- Creates tables for room-based meditation system

-- Drop existing tables if they exist
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS meditation_rooms CASCADE;

-- Meditation Rooms table
CREATE TABLE meditation_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  theme VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  tags TEXT[],
  gradient_start VARCHAR(7),
  gradient_end VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Room Participants table
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES meditation_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(100),
  avatar_url TEXT,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  CONSTRAINT unique_active_participant UNIQUE(room_id, user_id, joined_at)
);

-- Indexes
CREATE INDEX idx_room_participants_active 
  ON room_participants(room_id, user_id) 
  WHERE left_at IS NULL;

CREATE INDEX idx_room_participants_room 
  ON room_participants(room_id, left_at);

CREATE INDEX idx_meditation_rooms_active 
  ON meditation_rooms(is_active) 
  WHERE is_active = true;

-- Seed default rooms
INSERT INTO meditation_rooms (name, description, theme, icon, tags, gradient_start, gradient_end) VALUES
  ('The Commons', 'Join others in the main meditation space', 'commons', '☀️', ARRAY['community', 'open', 'welcoming'], '#F8F7F3', '#FFF9E6'),
  ('Tide Pool', 'Find calm in the gentle rhythm of waves', 'tide-pool', '🌊', ARRAY['mindfulness', 'grounding', 'calm'], '#4A90E2', '#50E3C2'),
  ('Starlit Clearing', 'Meditate under the stars', 'starlit', '⭐', ARRAY['evening', 'peace', 'reflection'], '#6B5B95', '#2C3E50'),
  ('Forest Nest', 'Ground yourself in nature''s embrace', 'forest', '🌲', ARRAY['nature', 'renewal', 'growth'], '#1d473e', '#8BA888'),
  ('Solo Sanctuary', 'Your personal meditation space', 'solo', '🕯️', ARRAY['solo', 'focus', 'privacy'], '#2C2C2C', '#6B6B6B');

-- Function to get current participant count for a room
CREATE OR REPLACE FUNCTION get_room_participant_count(room_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM room_participants
    WHERE room_id = room_uuid AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale participants (left more than 1 hour ago)
CREATE OR REPLACE FUNCTION cleanup_stale_participants()
RETURNS void AS $$
BEGIN
  DELETE FROM room_participants
  WHERE left_at IS NOT NULL 
    AND left_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE meditation_rooms IS 'Themed meditation rooms where users can join and meditate together';
COMMENT ON TABLE room_participants IS 'Tracks which users are currently in which rooms';
COMMENT ON FUNCTION get_room_participant_count IS 'Returns the count of active participants in a room';
COMMENT ON FUNCTION cleanup_stale_participants IS 'Removes old participant records to keep table clean';
