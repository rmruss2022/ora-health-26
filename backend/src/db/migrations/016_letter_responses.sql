-- Letter responses: store replies to daily letters (and optionally link to community posts)
CREATE TABLE IF NOT EXISTS letter_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_daily_letter_id UUID NOT NULL REFERENCES user_daily_letters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_letter_responses_user ON letter_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_letter_responses_daily_letter ON letter_responses(user_daily_letter_id);
