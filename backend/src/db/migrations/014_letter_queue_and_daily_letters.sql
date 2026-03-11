-- Migration 014: Letter Queue & Daily Letters
-- Queue-based daily letters: 3 per day, disappear at 3am local, posts go to queue

-- ==========================================
-- 1. LETTER QUEUE (pool of letters from community posts)
-- ==========================================
CREATE TABLE IF NOT EXISTS letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  source_type VARCHAR(50) NOT NULL DEFAULT 'community_post', -- 'community_post' | 'manual'
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message_type VARCHAR(50) DEFAULT 'encouragement',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_letter_queue_created ON letter_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letter_queue_source ON letter_queue(source_post_id) WHERE source_post_id IS NOT NULL;

-- ==========================================
-- 2. USER DAILY LETTERS (3 letters delivered per user per day)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_daily_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  letter_queue_id UUID NOT NULL REFERENCES letter_queue(id) ON DELETE CASCADE,
  delivered_date DATE NOT NULL, -- local date when delivered
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, letter_queue_id, delivered_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_letters_user_date ON user_daily_letters(user_id, delivered_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_letters_read ON user_daily_letters(user_id, read_at) WHERE read_at IS NULL;

-- ==========================================
-- 3. USER LETTER READS (for prioritization: prefer unread)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_letter_reads (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  letter_queue_id UUID NOT NULL REFERENCES letter_queue(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, letter_queue_id)
);

CREATE INDEX IF NOT EXISTS idx_user_letter_reads_user ON user_letter_reads(user_id);

-- ==========================================
-- 4. ADD delivery_date TO inbox_messages (optional, for backward compat)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inbox_messages' AND column_name = 'delivery_date'
  ) THEN
    ALTER TABLE inbox_messages ADD COLUMN delivery_date DATE;
  END IF;
END $$;
