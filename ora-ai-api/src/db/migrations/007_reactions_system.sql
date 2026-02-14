-- Reactions table for posts and comments
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment')),
  emoji VARCHAR(10) NOT NULL CHECK (emoji IN ('❤️', '👍', '🤗', '💡', '🔥')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, target_id, emoji)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

-- Add reaction counts to community_posts (optional, for denormalization)
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;

-- Add reaction counts to post_comments (optional, for denormalization)
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;
