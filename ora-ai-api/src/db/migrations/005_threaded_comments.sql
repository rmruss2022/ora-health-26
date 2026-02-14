-- Migration 004: Threaded Discussion System
-- Adds threading support to comments with reactions

-- ==========================================
-- 1. ALTER POST_COMMENTS TABLE FOR THREADING
-- ==========================================

-- Add parent_comment_id for threading (nullable for top-level comments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'parent_comment_id'
  ) THEN
    ALTER TABLE post_comments
    ADD COLUMN parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add deleted_at for soft deletion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE post_comments
    ADD COLUMN deleted_at TIMESTAMP;
  END IF;
END $$;

-- Add reactions count for denormalized counts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'reactions_count'
  ) THEN
    ALTER TABLE post_comments
    ADD COLUMN reactions_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add replies count for denormalized counts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'replies_count'
  ) THEN
    ALTER TABLE post_comments
    ADD COLUMN replies_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Indexes for threading performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id, created_at ASC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);

-- ==========================================
-- 2. CREATE COMMENT_REACTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'support', 'insightful')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Indexes for reaction queries
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);

-- ==========================================
-- 3. UTILITY FUNCTIONS
-- ==========================================

-- Function to get full comment thread path (breadcrumb)
CREATE OR REPLACE FUNCTION get_comment_thread_path(comment_id_param UUID)
RETURNS TABLE(comment_id UUID, depth INTEGER, path UUID[]) AS $$
  WITH RECURSIVE thread_path AS (
    -- Base case: the target comment
    SELECT
      id AS comment_id,
      0 AS depth,
      ARRAY[id] AS path
    FROM post_comments
    WHERE id = comment_id_param
    
    UNION ALL
    
    -- Recursive case: walk up the parent chain
    SELECT
      pc.id AS comment_id,
      tp.depth + 1 AS depth,
      pc.id || tp.path AS path
    FROM post_comments pc
    INNER JOIN thread_path tp ON tp.comment_id = pc.parent_comment_id
    WHERE pc.parent_comment_id IS NOT NULL
  )
  SELECT * FROM thread_path ORDER BY depth DESC;
$$ LANGUAGE sql STABLE;

-- Function to get all descendants of a comment (for deletion cascading)
CREATE OR REPLACE FUNCTION get_comment_descendants(comment_id_param UUID)
RETURNS TABLE(comment_id UUID, depth INTEGER) AS $$
  WITH RECURSIVE descendants AS (
    -- Base case: the target comment
    SELECT
      id AS comment_id,
      0 AS depth
    FROM post_comments
    WHERE id = comment_id_param
    
    UNION ALL
    
    -- Recursive case: all children
    SELECT
      pc.id AS comment_id,
      d.depth + 1 AS depth
    FROM post_comments pc
    INNER JOIN descendants d ON d.comment_id = pc.parent_comment_id
  )
  SELECT * FROM descendants WHERE depth > 0;
$$ LANGUAGE sql STABLE;

-- ==========================================
-- 4. TRIGGERS FOR DENORMALIZED COUNTS
-- ==========================================

-- Trigger to update replies_count when child comments are added/removed
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE post_comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE post_comments
    SET replies_count = replies_count - 1
    WHERE id = OLD.parent_comment_id AND replies_count > 0;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_replies_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_replies_count();

-- Trigger to update reactions_count when reactions are added/removed
CREATE OR REPLACE FUNCTION update_comment_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments
    SET reactions_count = reactions_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments
    SET reactions_count = reactions_count - 1
    WHERE id = OLD.comment_id AND reactions_count > 0;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_reactions_count
AFTER INSERT OR DELETE ON comment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_comment_reactions_count();

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
